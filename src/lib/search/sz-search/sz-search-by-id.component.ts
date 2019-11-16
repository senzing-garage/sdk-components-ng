import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject  } from 'rxjs';
import { map, tap, mapTo, first, filter, takeUntil } from 'rxjs/operators';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

import {
  ConfigService,
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters,
  SzEntityRecord,
  SzAttributeType,
  EntityDataService as SzEntityDataService,
  SzEntityData,
  SzResolvedEntity
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../../models/entity-search';
import { SzSearchService } from '../../services/sz-search.service';
import { JSONScrubber } from '../../common/utils';
import { SzConfigurationService } from '../../services/sz-configuration.service';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';

/** @internal */
export interface SzSearchByIdFormParams {
  recordId?: string | number;
  entityId?: string | number;
  dataSource?: string;
}
/** @internal */
interface SzBoolFieldMapByName {
  searchButton: boolean;
  resetButton: boolean;
  datasource: boolean,
  entityId: boolean,
  recordId: boolean
}

/** @internal */
const parseBool = (value: any): boolean => {
  if (!value || value === undefined) {
    return false;
  } else if (typeof value === 'string') {
    return (value.toLowerCase().trim() === 'true') ? true : false;
  } else if (value > 0) { return true; }
  return false;
};

/**
 * Provides a search box component that can execute search queries and return results.
 *
 * @example <!-- (WC javascript) SzSearchByIdComponent -->
 * <sz-search-by-id
 * id="sz-search"
 * name="Isa Creepr"></sz-search-by-id>
 * <script>
 *  document.getElementById('sz-search').addEventListener('resultChange', (results) => {
 *    console.log('results: ', results);
 *  });
 * </script>
 *
 * @example <!-- (Angular) SzSearchByIdComponent -->
 * <sz-search-by-id
 * name="Isa Creepr"
 * (resultChange)="myResultsHandler($event)"
 * (searchStart)="showSpinner()"
 * (searchEnd)="hideSpinner()"></sz-search-by-id>
 * @export
 *
 */
@Component({
  selector: 'sz-search-by-id',
  templateUrl: './sz-search-by-id.component.html',
  styleUrls: ['./sz-search-by-id.component.scss']
})
export class SzSearchByIdComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  /**
   * populate the search fields with an pre-existing set of search parameters.
   */
  @Input() searchValue: SzSearchByIdFormParams;

  /**
   * whether or not to show the search box label
   * @memberof SzSearchByIdComponent
   */
  @Input() showSearchLabel = true;
  /**
   * collection of which mapping attributes to show in the identifiers pulldown.
   * @memberof SzSearchByIdComponent
   */
  @Input() hiddenDataSources = [
    'TEST',
    'SEARCH'
  ]
  /**
   * emitted when a search is being performed.
   * @returns SzByIdFormParams
   * @memberof SzSearchByIdComponent
   */
  @Output() searchStart: EventEmitter<SzSearchByIdFormParams> = new EventEmitter<SzSearchByIdFormParams>();
  /**
   * emitted when a search is done being performed.
   * @returns the number of total results returned from the search.
   * @memberof SzSearchByIdComponent
   */
  @Output() searchEnd: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when a search encounters an exception
   * @todo remove from next breaking change release.
   * @deprecated
   */
  @Output() searchException: EventEmitter<Error> = new EventEmitter<Error>();
  /**
   * emitted when a search encounters an exception
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();

  /**
   * emmitted when the results have been cleared.
   * @memberof SzSearchByIdComponent
   */
  @Output() resultCleared: EventEmitter<void> = new EventEmitter<void>();
  /**
   * emmitted when the search results have been changed.
   * @memberof SzSearchByIdComponent
   */
  @Output() resultChange: EventEmitter<SzEntityRecord> = new EventEmitter<SzEntityRecord>();

  private _entity: SzEntityData;
  @Output() entityChange: EventEmitter<SzEntityData> = new EventEmitter<SzEntityData>();

  /**
   * emmitted when parameters of the search have been changed.
   *
   * @memberof SzSearchByIdComponent
   */
  @Output('parameterChange')
  searchParameters: Subject<SzSearchByIdFormParams> = new Subject<SzSearchByIdFormParams>();

  /**
   * @ignore
   */
  entitySearchForm: FormGroup;
  /**
   * @ignore
   */
  public _result: SzEntityRecord;

  /* start tag input setters */

  // ---------------------- individual field visibility setters ----------------------------------
  /** hide the search button */
  @Input() public set hideSearchButton(value: any)   { this.hiddenFields.searchButton        = parseBool(value); }
  /** hide the reset button */
  @Input() public set hideResetButton(value: any)    { this.hiddenFields.resetButton         = parseBool(value); }
  /** hide the clear button */
  @Input() public set hideClearButton(value: any)    { this.hiddenFields.resetButton         = parseBool(value); }

  // ---------------------- individual field readonly setters ------------------------------------
  /** disable the search button. button is not clickable. */
  @Input() public set disableSearchButton(value: any)   { this.disabledFields.searchButton   = parseBool(value); }
  /** disable the reset button. button is not clickable. */
  @Input() public set disableResetButton(value: any)    { this.disabledFields.resetButton    = parseBool(value); }
  /** disable the clear button. button is not clickable. */
  @Input() public set disableClearButton(value: any)    { this.disabledFields.resetButton    = parseBool(value); }
  /** disable the "record id" field. input cannot be edited. */
  @Input() public set disableRecordId(value: any)       { this.disabledFields.recordId     = parseBool(value); }

  /**
   * disable an individual datasource type option.
   * @internal
   */
  private disableDataSourceOption(value: string) {
    value = value.trim();
    const optionIndex = this._datasources.indexOf(value);
    if(optionIndex > -1) {
      this._datasources.splice(optionIndex, 1);
    }
  }
  /**
   * disable a set of datasource options.
   * format is "SOCIAL_NETWORK, DRIVERS_LICENSE_NUMBER" or array of strings
   */
  @Input()
  public set disableDataSourceOptions(options: string[] | string) {
    if(typeof options === 'string') {
      options = options.split(',');
    }
    // enable each option in collection
    options.forEach((opt)=> {
      this.disableDataSourceOption(opt);
    });
  }
  /** @interal */
  public getAnyDisabled(keys: string[]): string {
    const _some = keys.some((key) => {
      return this.disabledFields[ key ];
    });
    if(_some) {
      return '';
    }
    return null;
  }
  /** @interal */
  public getDisabled(key: string): string {
    if(this.disabledFields && this.disabledFields[ key ]) {
      return '';
    }
    return null;
  }
  /** @internal*/
  public disabledFields: SzBoolFieldMapByName = {
    searchButton: false,
    resetButton: false,
    datasource: false,
    entityId: false,
    recordId: false
  };
  /** @internal */
  public hiddenFields: SzBoolFieldMapByName = {
    searchButton: false,
    resetButton: false,
    datasource: false,
    entityId: false,
    recordId: false
  };

  // layout enforcers
  /** @internal */
  public _layoutEnforcers: string[] = [''];
  /** @internal */
  public _forceLayout = false;
  /** @internal */
  public _layoutClasses: string[] = [];

  /**
   * Takes a collection or a single value of layout enum css classnames to pass
   * to all children components. this value overrides auto-responsive css adjustments.
   *
   * @example forceLayout="layout-narrow"
   *
   * @memberof SzEntityDetailComponent
   */
  @Input() public set forceLayout(value: string | string[]) {
    if(value){
      this._forceLayout = true;
      if(typeof value == 'string'){
        if(value.indexOf(',') > -1){
          this._layoutEnforcers = value.split(',');
        } else {
          this._layoutEnforcers = [value];
        }
      } else {
        this._layoutEnforcers = value;
      }
    }

  }
  /** the width to switch from wide to narrow layout */
  @Input() public layoutBreakpoints = [
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 700, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 699 }
  ]
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  public get layoutClasses() {
    return this._layoutClasses;
  }

  /** the datasources available to user */
  public _datasources: string[] = [];
  private _dataSource: string;
  @Input() set dataSource(value: string) {
    this._dataSource = value;
  }
  private _recordId: number | string;
  @Input() set recordId(value: string | number) {
    //if(this._recordId !== value && this._dataSource){
      this.submitSearch();
    //}
    this._recordId = value;
  }
  private _entityId: string | number;
  @Input() set entityId(value: string | number) {
    if(this._entityId !== value){

      //this.submitSearch();
    }
    this._recordId = value;
  }

  /**
   * returns an ordered list of identifier fields to use in the pulldown list.
   * @internal
   * @returns SzAttributeType[]
   */
  public orderedDataSources(): string[] {
    if(this._datasources && this._datasources.sort){
      const matchingDataSources =  this._datasources.sort((a, b) => {
        let returnVal = 0;
        returnVal = returnVal + 1;
        return returnVal;
      });
      return matchingDataSources;
    }
    return this._datasources;
  }

   /**
   * returns an filtered list of datasources to use in the pulldown list.
   * @internal
   * @returns SzAttributeType[]
   */
  public get filteredDataSources(): string[] {
    if(this._datasources && this._datasources.filter && this.hiddenDataSources && this.hiddenDataSources.length > 0){
      const matchingDataSources =  this._datasources.filter((datasrc) => {
        return this.hiddenDataSources.indexOf(datasrc) === -1;
      });
      return matchingDataSources;
    }
    return this._datasources;
  }

  /* end tag input setters */

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private entityDataService: SzEntityDataService,
    private dataSourcesService: SzDataSourcesService,
    private cd: ChangeDetectorRef,
    private apiConfigService: SzConfigurationService,
    private searchService: SzSearchService,
    public breakpointObserver: BreakpointObserver) {}

  /**
   * @internal
  */
  private _waitForConfigChange = false;
  /**
   * whether or not to show the wait for the the api
   * conf to change before fetching resources like the identifiers list
   * @memberof SzSearchByIdComponent
   */
  @Input() public set waitForConfigChange(value: any){
    this._waitForConfigChange = parseBool(value);
  }
  public get waitForConfigChange(): boolean | any {
    return this._waitForConfigChange;
  }
  /**
   * whether or not to fetch new attributes from the
   * api server when a configuration change is detected
   * @memberof SzSearchByIdComponent
   */
  @Input() getDataSourcesOnConfigChange = true;

  /**
   * do any additional component set up
   * @internal
   */
  public ngOnInit(): void {
    this.createEntitySearchForm();
    this.apiConfigService.parametersChanged.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => {
        return this.getDataSourcesOnConfigChange;
       })
    ).subscribe(
      (cfg: SzRestConfiguration) => {
        //console.info('@senzing/sdk-components-ng/sz-search[ngOnInit]->apiConfigService.parametersChanged: ', cfg);
        this.updateDataSources();
      }
    );
    // make immediate request
    if(!this.waitForConfigChange){
      this.updateDataSources();
    }
    // detect layout changes
    let bpSubArr = [];
    this.layoutBreakpoints.forEach( (bpObj: any) => {
      if(bpObj.minWidth && bpObj.maxWidth){
        // in between
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px) and (max-width: ${bpObj.maxWidth}px)`);
      } else if(bpObj.minWidth){
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px)`);
      } else if(bpObj.maxWidth){
        bpSubArr.push(`(max-width: ${bpObj.maxWidth}px)`);
      }
    });
    const layoutChanges = this.breakpointObserver.observe(bpSubArr);

    layoutChanges.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => { return !this.forceLayout })
    ).subscribe( (state: BreakpointState) => {

      const cssQueryMatches = [];
      // get array of media query matches
      for(let k in state.breakpoints){
        const val = state.breakpoints[k];
        if(val == true) {
          // find key in layoutBreakpoints
          cssQueryMatches.push( k )
        }
      }
      // get array of layoutBreakpoints objects that match media queries
      const _matches = this.layoutBreakpoints.filter( (_bp) => {
        const _mq = this.getCssQueryFromCriteria(_bp.minWidth, _bp.maxWidth);
        if(cssQueryMatches.indexOf(_mq) >= 0) {
          return true;
        }
        return false;
      });
      // assign matches to local prop
      this.layoutClasses = _matches.map( (_bp) => {
        return _bp.cssClass;
      })
    })
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Pull in the list of data sources from the api server.
   */
  @Input()
  public updateDataSources = (): void => {
    this.dataSourcesService.listDataSources().subscribe((dataSrc: string[]) => {
      this._datasources = dataSrc;
      this.cd.markForCheck();
      this.cd.detectChanges();
    }, (err)=> {
      this.exception.next( err );
    });
  }

  getCssQueryFromCriteria(minWidth?: number, maxWidth?: number): string | undefined {
    if(minWidth && maxWidth){
      // in between
      return (`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
    } else if(minWidth){
      return (`(min-width: ${minWidth}px)`);
    } else if(maxWidth){
      return (`(max-width: ${maxWidth}px)`);
    }
    return
  }

  /**
   * gets the current search parameters from the searchService and sets up the search form
   * with current values.
   * @internal
  */
  private createEntitySearchForm(): void {
    this.entitySearchForm = this.fb.group({
      dataSource: this._dataSource,
      recordId: this._recordId,
      entityId: this._entityId
    });
  }
  /**
   * submits search form on enter press
   * if the submit button is currently hidden
   */
  public onKeyEnter(): void {
    if(this.hiddenFields.searchButton){
      this.submitSearch();
    }
  }

  /**
   * get the current search params from input values
   */
  public getSearchParams(): SzSearchByIdFormParams {
    let searchParams: SzSearchByIdFormParams = (this.entitySearchForm && this.entitySearchForm.value) ? JSONScrubber((this.entitySearchForm.value as SzSearchByIdFormParams)) : {};

    // clear out record id fields if entity id is present
    if(searchParams.entityId || (searchParams.recordId && searchParams.dataSource)) {
      if(searchParams.entityId){
        // clear this
        searchParams.dataSource =  undefined;
        searchParams.recordId =  undefined;
      }
      // clear out name fields if name field is empty
      if(searchParams.recordId && searchParams.dataSource) {
        searchParams.entityId =  undefined;
      }
    } else {
      // get parameters from input param values
      console.log('get parameters from input parameters: ', this._entityId, this._dataSource, this._recordId);

      if( this._entityId && this._entityId != undefined && this._entityId !== null ) {
        searchParams.entityId = this._entityId;
      } else if(this._recordId && this._recordId != undefined && this._recordId !== null) {
        searchParams.recordId = this._recordId;
        searchParams.dataSource = this._dataSource;

        console.log('get parameters from input parameters: ', searchParams);
      }
    }
    // after mods scrub nulls
    searchParams = JSONScrubber(searchParams);
    return searchParams;
  }

  /**
   * submit current search params to search service.
   * when search service returns a result it publishes the result
   * through the resultChange event emitter, and
   * any parameter changes through the paramsChange emmitter.
   */
  public submitSearch(): void {
    const searchParams = this.getSearchParams();
    //console.log('submitSearch() ',JSON.parse(JSON.stringify(searchParams)), this);
    if(searchParams.entityId != undefined && searchParams.entityId != null) {
      // just go by entity id

      // cast string entityId to number if not already number
      const entityId: number = (typeof searchParams.entityId == 'number') ? searchParams.entityId : parseInt(searchParams.entityId);

      console.log('search by entity id: '+ searchParams.entityId +')' );
      this.searchService.getEntityById(entityId, true).
      pipe(
        takeUntil(this.unsubscribe$)
      ).
      subscribe((res: SzEntityData) => {
        console.log('sz-search-by-id.submitSearch.by-ent: ', res);
        if (res && res.resolvedEntity) {
          this._entity = res;
          this.entityChange.emit(res);
        }
        const totalResults = res && res.resolvedEntity ? 1 : 0;
        this.searchEnd.emit(totalResults);
      }, (err)=> {
        //this.requestEnd.emit( err );
        this.exception.next( err );
      });
    } else if(searchParams.recordId && searchParams.dataSource){
      // by ds / record id
      //console.log('search by record id: ', searchParams.dataSource, searchParams.recordId);

      // cast string recordId to number if not already number
      const recordId: number = (typeof searchParams.recordId == 'number') ? searchParams.recordId : parseInt(searchParams.recordId);
      // emit search start
      this.searchStart.emit(searchParams);
      // make request
      this.searchService.getEntityByRecordId(searchParams.dataSource, recordId).pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((res: SzEntityRecord) => {
        //console.warn('results of getEntityByRecordId('+ searchParams.recordId +')', res );
        this.resultChange.emit(res);
        const totalResults = res && res.recordId ? 1 : 0;
        this._result = res;
        this.searchEnd.emit(totalResults);
      }, (err)=>{
        this.searchEnd.emit();
        this.exception.next( err );
      });
    } else {
      this.searchException.next(new Error("null criteria")); //TODO: remove in breaking change release
      this.exception.next( new Error("null criteria") );
    }
    this.searchParameters.next( searchParams );
  }
  /**
   * clear the search params and form inputs.
   */
  public clearSearch(): void {
    this.resultCleared.emit();
    this.entitySearchForm.reset();
    //this.searchService.clearSearchCriteria();
    this._entityId = undefined;
    this._recordId = undefined;
    this._dataSource = undefined;
  }
}
