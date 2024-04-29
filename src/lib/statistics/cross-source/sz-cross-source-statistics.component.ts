import { Component, HostBinding, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue, parseBool } from '../../common/utils';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCrossSourceSummaryCategoryType, SzCrossSourceSummarySelectionEvent, SzCrossSourceSummarySelectionClickEvent, SzStatsSampleTableLoadingEvent } from '../../models/stats';
import { SzEntitiesPage, SzEntityData, SzSourceSummary } from '@senzing/rest-api-client-ng';

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

  /** when a datasource section on one side or both of the venn diagram is clicked this event is emitted */
  @Output() sourceStatisticClick: EventEmitter<SzCrossSourceSummarySelectionClickEvent> = new EventEmitter();
  @Output() dataSourceSelectionChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleSourcesChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleTypeChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();
  @Output() sampleParametersChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();

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

  get title() {
    let retVal    = '';
    let isSingle  = true;
    if(this.dataMartService.dataSource1 && this.dataMartService.dataSource2 && this.dataMartService.dataSource1 !== this.dataMartService.dataSource2) {
      isSingle = false;
    } else if(this.dataMartService.dataSource1 || this.dataMartService.dataSource2) {
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

      if(this.dataMartService.dataSource1 && this.dataMartService.dataSource2 && this.dataMartService.dataSource1 !== this.dataMartService.dataSource2) {
        retVal  += `: ${this.dataMartService.dataSource1} to ${this.dataMartService.dataSource2}`;
      } else if(this.dataMartService.dataSource1) {
        retVal  += `: ${this.dataMartService.dataSource1}`;
      } else if(this.dataMartService.dataSource2) {
        retVal  += `: ${this.dataMartService.dataSource2}`;
      }
    }

    return retVal;
  }

  constructor(
    private dataMartService: SzDataMartService,
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
      this.dataSourceSelectionChange.emit({
        dataSource1: this.dataMartService.dataSource1,
        dataSource2: this.dataMartService.dataSource2
      });
    });
    this.dataMartService.onSampleDataSourceChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((event: {dataSource1?: string, dataSource2?: string}) => {
      this.sampleSourcesChange.emit(event);
    });
    this.dataMartService.onSampleResultChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((data) => {
      console.log(`new sample set data ready... `);
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
  onDefaultToSourceSelected(evt: SzCrossSourceSummarySelectionEvent) {
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
      this.getNewSampleSet(evt).subscribe((obs)=>{
        // initialized
        console.log('initialized new sample set: ', evt, obs);
        this.dataMartService.onSampleResultChange.subscribe();
      })
    }
  }
  /** when user clicks a source stat, change it in the service */
  onSourceStatClicked(evt: SzCrossSourceSummarySelectionClickEvent) {
    console.log(`SzCrossSourceStatistics.onSourceStatClicked: `, evt);
    if(!evt.dataSource1 && evt.dataSource2) {
      // flip-flop if only one ds is defined
      this.dataMartService.sampleDataSource1  = evt.dataSource2;
      this.dataMartService.sampleDataSource2  = undefined;
      console.log(`\tflip flopped datasources: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
    } else if((evt.dataSource1 && !evt.dataSource2) || ((evt.dataSource1 === evt.dataSource2) && evt.dataSource1 !== undefined)) {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = undefined;
      console.log(`\tnulled second datasource due to equivalence: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}" | "${evt.dataSource1}","${evt.dataSource2}"]`);
    } else {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
      console.log(`\tset both datasources: ["${this.dataMartService.sampleDataSource1}","${this.dataMartService.sampleDataSource2}"]`);
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

    this.sampleParametersChange.emit(_parametersEvt);
    this.sourceStatisticClick.emit(evt);  // emit the raw event jic someone needs to use stopPropagation or access to the DOM node

    // get new sample set
    console.log(`\t\tgetting new sample set: `, _parametersEvt, evt);
    this.getNewSampleSet(_parametersEvt).subscribe((obs)=>{
      // initialized
      console.log('initialized new sample set: ', obs, _parametersEvt);
      this.dataMartService.onSampleResultChange.subscribe();
    })
  }

  /** since data can be any format we have to use loose typing */
  onTableCellClick(data: any) {
    console.log('cell click: ', data);
  }

  onTableLoading(isLoading: SzStatsSampleTableLoadingEvent) {
    console.warn(`onTableLoading ${isLoading.inflight}|${isLoading.source}`, isLoading);
    this._isLoading = isLoading.inflight;
    this._loading.next(this._isLoading);
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