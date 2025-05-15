import { Component, Output, OnInit, OnDestroy, EventEmitter, ChangeDetectorRef, HostBinding, Input } from '@angular/core';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { SzCrossSourceSummary, SzMatchCounts, SzRelationCounts } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzCrossSourceCount, SzCrossSourceSummaryCategoryType, SzCrossSourceSummaryResponses, SzCrossSourceSummarySelectionClickEvent } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { parseBool } from '../../common/utils';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SzCrossSourceSummaryMatchKeyPickerDialog } from './sz-cross-source-matchkey-picker.component';

/**
 * Embeddable Venn Diagrams component that illustrates:
 *   duplicates for datasource1 vs datasource2
 *   possible matches for datasource1 vs datasource2
 *   possibly related for datasource1 vs datasource2
 * 
 * datasouce1 vs datasource2 have no public setters because 
 * there are just to many stateful properties to coordinate through direct setters.
 * 
 * Instead set the datasoure(s) through either the #SzDataMartService or the 
 * #SzCrossSourceSelectComponent.
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-select></sz-cross-source-select>
 * <sz-cross-source-summary></sz-cross-source-summary>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-cross-source-select></sz-wc-cross-source-select>
 * <sz-wc-cross-source-summary></sz-wc-cross-source-summary>
 *
 */
@Component({
    selector: 'sz-cross-source-summary',
    templateUrl: './sz-cross-source-summary.component.html',
    styleUrls: ['./sz-cross-source-summary.component.scss'],
    standalone: false
})
export class SzCrossSourceSummaryComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** data from the api response for the first datasource selected */
  private _fromDataSourceSummaryData: SzCrossSourceSummary | undefined;
  /** data from the api response for the first datasource vs the second datasource selected */
  private _crossSourceSummaryData : SzCrossSourceSummary | undefined;
  /** data from the api response for the second datasource selected */
  private _toDataSourceSummaryData: SzCrossSourceSummary | undefined;
  /** @internal */
  private _disableClickingOnZeroResults: boolean = true;
  private _openMatchKeyFiltersOnSelection: boolean = false;
  
  private _filterPickerDialog: MatDialogRef<SzCrossSourceSummaryMatchKeyPickerDialog>;
  private _diagramClickEventPayload;
  
  // --------------------------------- getters and setters -------------------------------
  /** is only one datasource on either side selected */
  public get singular() : boolean {
    let onlyHasOneDataSource = (this.dataMartService.dataSources && this.dataMartService.dataSources.length === 1);
    let hasOneDsSelected     = ((this.dataMartService.dataSource1 !== undefined && this.dataMartService.dataSource2 === undefined) || (this.dataMartService.dataSource1 === undefined && this.dataMartService.dataSource2 !== undefined));
    let ds1NotEqds2 = (this.dataMartService.dataSource1 !== this.dataMartService.dataSource2);
    //console.log(`singular: `, onlyHasOneDataSource || (hasOneDsSelected && ds1NotEqds2));
    return onlyHasOneDataSource || (hasOneDsSelected && ds1NotEqds2);
  }
  public get hasData() :  boolean {
    return this._fromDataSourceSummaryData || this._toDataSourceSummaryData || this._crossSourceSummaryData ? true : false;
  }

  /** get the name of the first datasource to compare */
  public get fromDataSource(): string | undefined {
    return this.dataMartService.dataSource1;
  }
  /** get the name of the second datasource to compare */
  public get toDataSource(): string | null {
    return this.dataMartService.dataSource2;
  }
  /** get the number of ambiguous matches for the first datasource to compare */
  public get fromDataSourceAmbiguous() {
    return this._getCountFromSummaryData(this._fromDataSourceSummaryData, 'ambiguousMatches');
  }
  /** get the number of ambiguous that are in both the first and second datasource */
  public get overlapDataSourceAmbiguous() {
    return this._getCountFromSummaryData(this._crossSourceSummaryData, 'ambiguousMatches');
  }
  /** get the number of ambiguous for the second datasource to compare */
  public get toDataSourceAmbiguous() {
    return this._getCountFromSummaryData(this._toDataSourceSummaryData, 'ambiguousMatches');
  }
  /** get the number of ambiguous matches for the first datasource to compare */
  public get fromDataSourceDisclosed() {
    return this._getCountFromSummaryData(this._fromDataSourceSummaryData, 'disclosedRelations');
  }
  /** get the number of ambiguous that are in both the first and second datasource */
  public get overlapDataSourceDisclosed() {
    return this._getCountFromSummaryData(this._crossSourceSummaryData, 'disclosedRelations');
  }
  /** get the number of ambiguous for the second datasource to compare */
  public get toDataSourceDisclosed() {
    return this._getCountFromSummaryData(this._toDataSourceSummaryData, 'disclosedRelations');
  }
  /** get the number of matches for the first datasource to compare */
  public get fromDataSourceMatches() {
    return this._getCountFromSummaryData(this._fromDataSourceSummaryData, 'matches');
  }
  /** get the number of matches that are in both the first and second datasource */
  public get overlapDataSourceMatches() {
    return this._getCountFromSummaryData(this._crossSourceSummaryData, 'matches');
  }
  /** get the number of matches for the second datasource to compare */
  public get toDataSourceMatches() {
    return this._getCountFromSummaryData(this._toDataSourceSummaryData, 'matches');
  }
  /** get the number of possible matches for the first datasource to compare */
  public get fromDataSourcePossibles() {
    return this._getCountFromSummaryData(this._fromDataSourceSummaryData, 'possibleMatches');
  }
  /** get the number of possible matches that are in both the first and second datasource */
  public get overlapDataSourcePossibles() {
    return this._getCountFromSummaryData(this._crossSourceSummaryData, 'possibleMatches');
  }
  /** get the number of possible matches for the second datasource to compare */
  public get toDataSourcePossibles() {
    return this._getCountFromSummaryData(this._toDataSourceSummaryData, 'possibleMatches');
  }
  /** get the number of possibly related entities for the first datasource to compare */
  public get fromDataSourceRelated() {
    return this._getCountFromSummaryData(this._fromDataSourceSummaryData, 'possibleRelations');
  }
  /** get the number of possibly related entities that are in both the first and second datasource */
  public get overlapDataSourceRelated() {
    return this._getCountFromSummaryData(this._crossSourceSummaryData, 'possibleRelations');
  }
  /** get the number of possibly related entities for the second datasource to compare */
  public get toDataSourceRelated() {
    return this._getCountFromSummaryData(this._toDataSourceSummaryData, 'possibleRelations');
  }
  /** whether or not to disable clicking on venn diagrams with "0" results */
  @Input() set disableClickOnZero(value: boolean | string) {
    this._disableClickingOnZeroResults = parseBool(value);
  }
  /** @internal */
  public get disableClickOnZero(): boolean {
    return this._disableClickingOnZeroResults;
  }
  /** whether or not to disable clicking on venn diagrams with "0" results */
  @Input() set openMatchKeyFiltersOnSelection(value: boolean | string) {
    this._openMatchKeyFiltersOnSelection = parseBool(value);
  }
    /** whether or not to disable clicking on venn diagrams with "0" results */
  get openMatchKeyFiltersOnSelection(): boolean {
    return this._openMatchKeyFiltersOnSelection;
  }

  // ------------------------------------ event emitters ------------------------------------

  /** when a diagram is clicked this event is emitted */
  @Output() summaryDiagramClick: EventEmitter<any> = new EventEmitter();
  /** when a datasource section on one side or both of the venn diagram is clicked this event is emitted */
  @Output() sourceStatisticClicked: EventEmitter<SzCrossSourceSummarySelectionClickEvent> = new EventEmitter();

  /** if singular datasource set css class 'singular' on host */
  @HostBinding("class.singular") get classSingular() {
    return this.singular;
  }
    /** before data is available OR on error retrieving data */
  @HostBinding("class.no-data") get classNoData() {
    return !this.hasData;
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private dataMartService: SzDataMartService,
    private dataSourcesService: SzDataSourcesService,
    public dialog: MatDialog
  ) {}

  /**
   * unsubscribe when component is destroyed
   * @internal
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  /**
   * sets up initial service listeners etc
   * @internal
   */
  ngOnInit() {
    // get data sources
    /*
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe({
      next: (dataSources: SzDataSourcesResponseData)=>{
        this._dataSources = dataSources.dataSources;
        console.log(`got datasources: `, this._dataSources);
        //this.dataChanged.next(this._dataSourceCounts);
      },
      error: (err) => {
        this.exception.next(err);
      }
    });*/
    this.dataMartService.onDataSourceSelected.pipe(
      takeUntil(this.unsubscribe$),
      skipWhile((dsName: string)=>{
        // at least one datasource must be selected
        return this.dataMartService.dataSource1 === undefined && this.dataMartService.dataSource2 === undefined;
      })
    ).subscribe(this.onDataSourceSelectionChange.bind(this))
  }
  /**
   * When a selected datasource is changed from the datamart service this method is called 
   * which in turn sets up the http requests needed to populate the widget.
   * @internal
   */
  private onDataSourceSelectionChange(dsName: string) {
    console.log(`onDataSourceSelectionChange: ${dsName}`, this.dataMartService.dataSource1, this.dataMartService.dataSource2);
    // clear old data (for animations)
    this.clear();

    // stat requests
    let dataRequests = forkJoin({
      fromDataSource: this.dataMartService.dataSource1 ? this.dataMartService.getCrossSourceStatistics(this.dataMartService.dataSource1, undefined, '*') : of(false),
      overlapDataSource: this.dataMartService.dataSource1 && this.dataMartService.dataSource2 && this.dataMartService.dataSource1 !== this.dataMartService.dataSource2 ? this.dataMartService.getCrossSourceStatistics(
        this.dataMartService.dataSource1, 
        this.dataMartService.dataSource2, '*'): of(false),
      toDataSource: this.dataMartService.dataSource2 ? this.dataMartService.getCrossSourceStatistics(this.dataMartService.dataSource2, undefined, '*') : of(false)
      });

    dataRequests.pipe(
      take(1),
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: this.onCrossSourceDataChanged.bind(this),
      error: (err) => {
        console.warn('error: ',err);
      }
    });
  }
  private _getCountFromSummaryData(data: SzCrossSourceSummary, stype: 'ambiguousMatches' | 'possibleMatches' | 'possibleRelations' | 'matches' | 'disclosedRelations') {
    let retVal = 0;
    if(data && data[stype] && data[stype].length > 0) {
      let _rc: SzRelationCounts[] = data[stype].filter((rc: SzRelationCounts)=>{ return !rc.matchKey && !rc.principle && rc.matchKey !== null && rc.principle !== null ? true : false;});
      retVal = _rc && _rc.length > 0 ? (['possibleMatches','possibleRelations','disclosedRelations'].indexOf(stype) > -1 ? _rc[0].relationCount : _rc[0].entityCount) : retVal;
    }
    return retVal;
  }
  private clear() {
    this._fromDataSourceSummaryData = undefined;
    this._crossSourceSummaryData    = undefined;
    this._toDataSourceSummaryData   = undefined;
  }
  /** when all the api requests respond this method is called to store the data on the instance for 
   * retrieval through variables/getters/setters.
   * @internal
  */
  private onCrossSourceDataChanged(data: SzCrossSourceSummaryResponses) {
    if(data && data.fromDataSource) {
      this._fromDataSourceSummaryData = data.fromDataSource;
    }
    if(data && data.overlapDataSource) {
      this._crossSourceSummaryData = data.overlapDataSource;
    }
    if(data && data.toDataSource) {
      this._toDataSourceSummaryData = data.toDataSource;
    }
    console.warn(`onCrossSourceDataChanged: `, this._fromDataSourceSummaryData, this._crossSourceSummaryData, this._toDataSourceSummaryData);
  }
  public get legendFrom(): string {
    let retVal = 'A';
    //let retVal = (this._fromDataSourceSummaryData && this._fromDataSourceSummaryData.dataSource) ? this._fromDataSourceSummaryData.dataSource : 'A';
    return retVal;
  }

  public get legendTo(): string {
    let retVal  = 'B';
    //let retVal = (this._toDataSourceSummaryData && this._toDataSourceSummaryData.dataSource) ? this._toDataSourceSummaryData.dataSource : 'B';
    return retVal;
  }
  /** when a circle diagram is clicked for a particular stat this handler is invoked which then emits 
   * a 'summaryDiagramClick' event that can be listened for.
   * @internal
   */
  diagramClick(clickEvent: MouseEvent, diagramSection: string, matchLevel: number, statType: SzCrossSourceSummaryCategoryType) {
    let newFromDataSource;
    let newToDataSource;
    let _statTypeData: SzCrossSourceSummary;
    if (diagramSection === 'LEFT') {
      newFromDataSource = this.fromDataSource;
      newToDataSource = this.fromDataSource;
      if(this._fromDataSourceSummaryData) {
        _statTypeData = this._fromDataSourceSummaryData;
      }
    } else if (diagramSection === 'RIGHT') {
      newFromDataSource = this.toDataSource;
      newToDataSource = this.toDataSource;
      if(this._toDataSourceSummaryData) {
        _statTypeData = this._toDataSourceSummaryData;
      }
    } else if (diagramSection === 'OVERLAP') {
      newFromDataSource = this.fromDataSource;
      newToDataSource = this.toDataSource;
      if(this._crossSourceSummaryData) {
        _statTypeData = this._crossSourceSummaryData;
      }
    }
    // store the last click payload so that if the user
    // clicks outside the picker dialog we can still forward 
    // the click event and display the results
    this._diagramClickEventPayload = Object.assign(clickEvent, {
      dataSource1: newFromDataSource,
      dataSource2: newToDataSource,
      matchLevel: matchLevel,
      statType: statType
    });

    if(_statTypeData) {
      this.dataMartService.matchKeyCounts = this.dataMartService.getCrossSourceStatisticsByStatTypeFromData(statType, _statTypeData);
    }
    /*if(_statTypeData) {
      let dialogData = this.dataMartService.getCrossSourceStatisticsByStatTypeFromData(statType, _statTypeData)
      // store the match key counts so we have them even if the user doesn't select 
      // a filter to be applied
      this.dataMartService.matchKeyCounts = dialogData;

      console.log(`SzCrossSourceSummaryComponent.dialogData: ${diagramSection}, ${matchLevel}, ${statType}`, dialogData);
      if(this._openMatchKeyFiltersOnSelection && this.prefs.dataMart.showMatchKeyFiltersOnSelect && dialogData && dialogData.length > 1) {
        this.openMatchKeyFilteringForSelection(dialogData, statType);
        return;
      }
    }
    console.log(`SzCrossSourceSummaryComponent.diagramClick: ${diagramSection}, ${matchLevel}, ${statType}`);
    */

    // emit event
    this.summaryDiagramClick.emit({
      diagramSection: diagramSection,
      matchLevel: matchLevel,
      currentFromDataSource: this.fromDataSource,
      currentToDataSource: this.toDataSource,
      newFromDataSource: newFromDataSource,
      newToDataSource: newToDataSource,
    });
    this.sourceStatisticClicked.emit(Object.assign(clickEvent, {
      dataSource1: newFromDataSource,
      dataSource2: newToDataSource,
      matchLevel: matchLevel,
      statType: statType
    }) as SzCrossSourceSummarySelectionClickEvent);
  }

  public openMatchKeyFilteringForSelection(data: Array<SzCrossSourceCount>, statType: SzCrossSourceSummaryCategoryType) {
    this._filterPickerDialog = this.dialog.open(SzCrossSourceSummaryMatchKeyPickerDialog, {
      panelClass: 'sz-css-matchkey-picker-dialog-panel',
      minWidth: 200,
      height: 'var(--sz-css-matchkey-picker-dialog-default-height)',
      data: {
        data: data, 
        statType: statType
      }
    });
    this._filterPickerDialog.afterClosed().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((stopPropagation: boolean) => {
      if(!stopPropagation && this._diagramClickEventPayload) {
        // continue 
        this.sourceStatisticClicked.emit(this._diagramClickEventPayload as SzCrossSourceSummarySelectionClickEvent);
      }
    })
  }
}