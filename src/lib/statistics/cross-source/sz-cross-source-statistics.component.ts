import { Component, HostBinding, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue, parseBool } from '../../common/utils';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCrossSourceSummaryCategoryType, SzCrossSourceSummarySelectionEvent, SzCrossSourceSummarySelectionClickEvent, SzStatsSampleTableLoadingEvent } from '../../models/stats';
import { SzEntitiesPage, SzEntityData, SzEntityIdentifier, SzSourceSummary } from '@senzing/rest-api-client-ng';
import { SzDataTableCellEvent } from '../../models/stats';

export interface dataSourceSelectionChangeEvent {
  dataSource1?: string,
  dataSource2?: string
}

/**
 * Wrapper component for the comparing stats of one datasource 
 * with their mutual stat type of another datasource. Uses the 
 * Venn Diagram chart to show the overlap and a special Data Table 
 * specific to displaying a sample set from the selected type of stats
 * for the two selected data sources.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-statistics></sz-cross-source-statistics>
 *
 */
@Component({
  selector: 'sz-cross-source-statistics',
  templateUrl: './sz-cross-source-statistics.component.html',
  styleUrls: ['./sz-cross-source-statistics.component.scss']
})
export class SzCrossSourceStatistics implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _showTable    = false;
  public get showTable() {
    return this._showTable;
  }

  private _isLoading = false;
  private _showTableLoadingSpinner = true;
  private _disableClickingOnZeroResults = true;

  @HostBinding("class.loading") get isLoading() {
    return this._isLoading;
  }
  @HostBinding("class.show-table-loading-indicator") get showTableLoadingIndicator() {
    return this._showTableLoadingSpinner;
  }
  @HostBinding("class.expanded") get headerExpanded() {
    return this.prefs.dataMart.showDiagramHeader;
  }
  /** if set to false no loading spinner for the table will be shown */
  @Input() set showTableLoadingSpinner(value: boolean | string) {
    this._showTableLoadingSpinner = parseBool(value);
  }
  /** whether or not to disable clicking on venn diagrams with "0" results */
  @Input() set disableClickingOnZeroResults(value: boolean | string) {
    this._disableClickingOnZeroResults = parseBool(value);
  }
  /** @internal */
  public get clickingOnZeroDisabled(): boolean {
    return this._disableClickingOnZeroResults;
  }

  /** when a datasource section on one side or both of the venn diagram is clicked this event is emitted */
  @Output() cellClick: EventEmitter<SzDataTableCellEvent> = new EventEmitter<SzDataTableCellEvent>();
  @Output() sourceStatisticClick: EventEmitter<SzCrossSourceSummarySelectionClickEvent> = new EventEmitter();
  @Output() dataSourceSelectionChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleSourcesChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleTypeChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();
  @Output() sampleParametersChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();
  @Output() entityIdClick: EventEmitter<SzEntityIdentifier> = new EventEmitter();

  /** when a new sample set is being requested */
  private   _onNewSampleSetRequested: Subject<boolean> = new Subject();
  @Output() onNewSampleSetRequested = this._onNewSampleSetRequested.asObservable();
  /** when a new sample set has completed it's data requests/initialization */
  private _onNewSampleSet: Subject<SzEntityData[]> = new Subject();
  @Output() onNewSampleSet = this._onNewSampleSet.asObservable();
  /** aggregate observeable for when the component is "doing stuff" */
  private _loading: Subject<boolean> = new Subject();
  @Output() loading: Observable<boolean> = this._loading.asObservable();

  public toggleExpanded() {
    this.prefs.dataMart.showDiagramHeader = !this.prefs.dataMart.showDiagramHeader;
  }

  public get showAllColumns() {
    return this.prefs.dataMart.showAllColumns;
  }

  public set showAllColumns(value: boolean) {
    this.prefs.dataMart.showAllColumns = value;
  }

  public get defaultToDataSource() {
    return this.prefs.dataMart.defaultDataSource1;
  }
  public get defaultFromDataSource() {
    return this.prefs.dataMart.defaultDataSource2;
  }

  public get resolutionMode()  {
    switch (this.dataMartService.sampleMatchLevel) {
      case 1:
          return "match";
      case 2:
          return "possible_match";
      case 3:
      case 4:
        return "relationship";
    default:
      return "";
    }
  }

  private _title: string;

  get title() {
    return this._title;
    let retVal    = '';
    let isSingle  = true;
    if(this.dataMartService.sampleDataSource1 && this.dataMartService.sampleDataSource2 && this.dataMartService.sampleDataSource1 !== this.dataMartService.sampleDataSource2) {
      isSingle = false;
    } else if(this.dataMartService.sampleDataSource1 || this.dataMartService.sampleDataSource2) {
      isSingle  = true;
    }
    if(this.dataMartService.sampleStatType) {
      switch(this.dataMartService.sampleStatType) {
        case 'MATCHES':
          retVal = isSingle ? 'Duplicates' : 'Matches';
          break;
        case 'AMBIGUOUS_MATCHES':
          retVal = 'Ambiguous Matches';
          break;
        case 'POSSIBLE_MATCHES':
          retVal = isSingle ? 'Possible Duplicates' : 'Possible Matches';
          break;
        case 'POSSIBLE_RELATIONS':
          retVal = isSingle ? 'Possible Relationships' : 'Possibly Related';
          break;
        case 'DISCLOSED_RELATIONS':
          retVal = 'Disclosed Relationships';
          break;
      };

      if(this.dataMartService.sampleDataSource1 && this.dataMartService.sampleDataSource2 && this.dataMartService.sampleDataSource1 !== this.dataMartService.sampleDataSource2) {
        retVal  += `: ${this.dataMartService.sampleDataSource1} to ${this.dataMartService.sampleDataSource2}`;
      } else if(this.dataMartService.sampleDataSource1) {
        retVal  += `: ${this.dataMartService.sampleDataSource1}`;
      } else if(this.dataMartService.sampleDataSource2) {
        retVal  += `: ${this.dataMartService.sampleDataSource2}`;
      }
    }

    return retVal;
  }

  private _getTitleFromEvent(event: SzCrossSourceSummarySelectionEvent) {
    let retVal    = '';
    let isSingle  = true;
    if(event.dataSource1 && event.dataSource2 && event.dataSource1 !== event.dataSource2) {
      isSingle = false;
    } else if(event.dataSource1 || event.dataSource2) {
      isSingle  = true;
    }
    if(event.statType) {
      switch(event.statType) {
        case 'MATCHES':
          retVal = isSingle ? 'Duplicates' : 'Matches';
          break;
        case 'AMBIGUOUS_MATCHES':
          retVal = 'Ambiguous Matches';
          break;
        case 'POSSIBLE_MATCHES':
          retVal = isSingle ? 'Possible Duplicates' : 'Possible Matches';
          break;
        case 'POSSIBLE_RELATIONS':
          retVal = isSingle ? 'Possible Relationships' : 'Possibly Related';
          break;
        case 'DISCLOSED_RELATIONS':
          retVal = 'Disclosed Relationships';
          break;
      };

      if(event.dataSource1 && event.dataSource2 &&  event.dataSource1 !== event.dataSource2) {
        retVal  += `: ${event.dataSource1} to ${this.dataMartService.sampleDataSource2}`;
      } else if(event.dataSource1) {
        retVal  += `: ${event.dataSource1}`;
      } else if(event.dataSource2) {
        retVal  += `: ${event.dataSource2}`;
      }
    }

    return retVal;
  }

  constructor(
    private dataMartService: SzDataMartService,
    private cd: ChangeDetectorRef,
    public prefs: SzPrefsService
  ) {}
  ngOnInit() {
    this.dataMartService.onSampleTypeChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((statType: SzCrossSourceSummaryCategoryType) => {
      let _evtPayload = {
        dataSource1: this.dataMartService.sampleDataSource1,
        dataSource2: this.dataMartService.sampleDataSource2,
        matchLevel: this.dataMartService.sampleMatchLevel,
        statType: statType
      }
      this.sampleTypeChange.emit(_evtPayload);
    });
    this.dataMartService.onDataSourceSelected.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((dataSource: string) => {
      //console.log(`SzCrossSourceStatistics.dataMartService.onDataSourceSelected: ${dataSource}`);
      this.dataSourceSelectionChange.emit({
        dataSource1: this.dataMartService.dataSource1,
        dataSource2: this.dataMartService.dataSource2
      });
    });
    this.dataMartService.onSampleRequest.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((isInflight: boolean) => {
      this._isLoading = isInflight;
    });
    this.dataMartService.onSampleDataSourceChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((event: {dataSource1?: string, dataSource2?: string}) => {
      this.sampleSourcesChange.emit(event);
    });
    this.dataMartService.onSampleResultChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((data) => {
      //console.log(`new sample set data ready... `, data);
      this._isLoading = false;
      this._showTable = true;
    });
  }
  ngAfterViewInit() {}
  //ngAfterContentInit

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  onDefaultSourcesSelected(evt: SzCrossSourceSummarySelectionEvent) {
    console.log(`onDefaultToSourceSelected: `, evt);
    if(evt) {
      this._isLoading = true;
      if(evt.dataSource1) {
        this.dataMartService.sampleDataSource1  = evt.dataSource1;
      }
      if(evt.dataSource2) {
        this.dataMartService.sampleDataSource2  = evt.dataSource2;
      }
      this.dataMartService.sampleMatchLevel   = evt.matchLevel;
      this.dataMartService.sampleStatType     = evt.statType as SzCrossSourceSummaryCategoryType;
      // get filter counts
      this.dataMartService.getCrossSourceStatistics(
        this.dataMartService.dataSource1 ? this.dataMartService.dataSource1 : (this.dataMartService.dataSource2 ? this.dataMartService.dataSource2 : undefined), 
        this.dataMartService.dataSource1 && this.dataMartService.dataSource2 && this.dataMartService.dataSource1 !== this.dataMartService.dataSource2 ? this.dataMartService.dataSource2 : undefined, 
        '*'
      ).pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe((matchKeyCounts) => {
        let _statTypeData = this.dataMartService.getCrossSourceStatisticsByStatTypeFromData(this.dataMartService.sampleStatType, matchKeyCounts);
        if(_statTypeData){
          this.dataMartService.matchKeyCounts = _statTypeData
        }
        //console.log('default match key counts: ', _statTypeData, matchKeyCounts);
      })

      this._title = this._getTitleFromEvent(evt);
      this.cd.detectChanges();
      this.getNewSampleSet(evt).subscribe((obs)=>{
        // initialized
        //console.log('initialized new sample set: ', evt, obs);
        this.dataMartService.onSampleResultChange.subscribe();
      })
    }
  }
  /** when user clicks a source stat, change it in the service */
  onSourceStatClicked(evt: SzCrossSourceSummarySelectionClickEvent) {
    console.log(`SzCrossSourceStatistics.onSourceStatClicked: `, evt);
    this._isLoading = true;
    this._loading.next(true);
    this.cd.detectChanges();

    if(!evt.dataSource1 && evt.dataSource2) {
      // flip-flop if only one ds is defined
      this.dataMartService.sampleDataSource1  = evt.dataSource2;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
      //console.log(`\tdatasource1 set to datasource2: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
    } else if((evt.dataSource1 && !evt.dataSource2) || ((evt.dataSource1 === evt.dataSource2) && evt.dataSource1 !== undefined)) {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource1;
      //console.log(`\tdatasource2 set to datasource1: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}" | "${evt.dataSource1}","${evt.dataSource2}"]`);
    } else {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
      //console.log(`\tset both datasources: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
    }
  
    // simplify the event payload passed back
    let _parametersEvt: SzCrossSourceSummarySelectionEvent = {
      matchLevel: evt.matchLevel,
      statType: evt.statType
    }
    if(this.dataMartService.sampleDataSource1)  _parametersEvt.dataSource1 = this.dataMartService.sampleDataSource1;
    if(this.dataMartService.sampleDataSource2)  _parametersEvt.dataSource2 = this.dataMartService.sampleDataSource2;
    //this.sourceStatisticClick.emit(evt);  // emit the raw event jic someone needs to use stopPropagation or access to the DOM node

    this._title = this._getTitleFromEvent(_parametersEvt);
    this.cd.detectChanges();


    // we give this a async delay because when we change it immediately
    // it locks up the UI so the loading indicator doesn't present until 
    // the table is done rendering
    setTimeout(this._onSourceStatClicked.bind(this, _parametersEvt), 500);
  }
  _onSourceStatClicked(evt: SzCrossSourceSummarySelectionClickEvent) {
    /*
    First part here moved to the "onSourceStatClicked" to immediately provide 
    user feedback
    
    this._loading.next(true);

    if(!evt.dataSource1 && evt.dataSource2) {
      // flip-flop if only one ds is defined
      this.dataMartService.sampleDataSource1  = evt.dataSource2;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
      //console.log(`\tdatasource1 set to datasource2: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
    } else if((evt.dataSource1 && !evt.dataSource2) || ((evt.dataSource1 === evt.dataSource2) && evt.dataSource1 !== undefined)) {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource1;
      //console.log(`\tdatasource2 set to datasource1: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}" | "${evt.dataSource1}","${evt.dataSource2}"]`);
    } else {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
      //console.log(`\tset both datasources: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
    }
    this.dataMartService.sampleMatchLevel   = evt.matchLevel;
    this.dataMartService.sampleStatType     = evt.statType as SzCrossSourceSummaryCategoryType;

    // simplify the event payload passed back
    let _parametersEvt: SzCrossSourceSummarySelectionEvent = {
      matchLevel: evt.matchLevel,
      statType: evt.statType
    }
    if(this.dataMartService.sampleDataSource1)  _parametersEvt.dataSource1 = this.dataMartService.sampleDataSource1;
    if(this.dataMartService.sampleDataSource2)  _parametersEvt.dataSource2 = this.dataMartService.sampleDataSource2;
    */
    this.dataMartService.sampleMatchLevel   = evt.matchLevel;
    this.dataMartService.sampleStatType     = evt.statType as SzCrossSourceSummaryCategoryType;

    this.sampleParametersChange.emit(evt);
    this.sourceStatisticClick.emit(evt);  // emit the raw event jic someone needs to use stopPropagation or access to the DOM node

    // get new sample set
    //console.log(`\t\tgetting new sample set: `, _parametersEvt, evt);
    this.getNewSampleSet(evt).subscribe((obs)=>{
      // initialized
      //console.log('initialized new sample set: ', obs, _parametersEvt);
      this.dataMartService.onSampleRequest.subscribe();
      this.dataMartService.onSampleResultChange.subscribe();
    })
  }

  /** since data can be any format we have to use loose typing */
  onTableCellClick(data: any) {
    console.log('cell click: ', data);
    this.cellClick.emit(data);
  }

  onTableLoading(isLoading: SzStatsSampleTableLoadingEvent) {
    console.warn(`onTableLoading ${isLoading.inflight}|${isLoading.source}`, isLoading);
    this._isLoading = isLoading.inflight;
    this._loading.next(this._isLoading);
  }

  onEntityIdClick(entityId: SzEntityIdentifier) {
    console.log(`SzCrossSourceStatistics.onEntityIdClick: ${entityId}`);
    this.entityIdClick.emit(entityId);
  }

  private getNewSampleSet(parameters: SzCrossSourceSummarySelectionEvent) {
    // set loading emitter(s)
    this._onNewSampleSetRequested.next(true);
    this._loading.next(true);

    // initialize new sample set
    return this.dataMartService.createNewSampleSetFromParameters(
      parameters.statType, 
      parameters.dataSource1, 
      parameters.dataSource2, 
      parameters.matchKey, 
      parameters.principle).pipe(
        takeUntil(this.unsubscribe$),
        take(1),
        tap((data: SzEntityData[]) => {
          this._loading.next(false);
          this._onNewSampleSet.next(data);
        })
      )
  }
}