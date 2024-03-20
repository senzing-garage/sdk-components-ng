import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { map, skipWhile, take, takeUntil, takeWhile } from 'rxjs/operators';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';

import { SzCrossSourceSummary, SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatCountsForDataSources } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { filter } from 'd3';

export interface crossSourceSummaryRequests {
  fromDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean> 
  overlapDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean> 
  toDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean>
}
export interface crossSourceSummaryResponses {
  fromDataSource?: SzCrossSourceSummary
  overlapDataSource?: SzCrossSourceSummary
  toDataSource?: SzCrossSourceSummary
}

/**
 * Embeddable Donut Graph showing how many 
 * records belong to which datasources for the repository in a visual way. 
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-summary></sz-cross-source-summary>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-cross-source-summary></sz-wc-cross-source-summary>
 *
 */
@Component({
  selector: 'sz-cross-source-summary',
  templateUrl: './sz-cross-source-summary.component.html',
  styleUrls: ['./sz-cross-source-summary.component.scss']
})
export class SzCrossSourceSummaryComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _crossSourceSummaryData : SzCrossSourceSummary | undefined;
  private _fromDataSourceSummaryData: SzCrossSourceSummary | undefined;
  private _toDataSourceSummaryData: SzCrossSourceSummary | undefined;
  private _totalRecordCount: number = 0;
  private _totalEntityCount: number = 0;
  private _totalSingleCount: number = 0;
  private _totalConnectionCount : number = 0;
  private dataSourceLookup : { [code: string]: string } = {};


  /*public get fromDataSources(): string[] {
    return this._fromDataSources;
  }*/

  /*public get fromDataSourceInfos() : string[] {
    return this._fromDataSourceInfos;
  }*/

  /*public get toDataSources(): string[] {
    return this._toDataSources;
  }*/

  /*public get toDataSourceInfos(): any[] {
    return this._toDataSourceInfos;
  }*/

  public get totalRecordCount(): number {
    return this._totalRecordCount;
  }

  public get totalEntityCount(): number {
    return this._totalEntityCount;
  }

  public get totalSingleCount(): number {
    return this._totalSingleCount;
  }

  public get totalConnectionCount(): number {
    return this._totalConnectionCount;
  }

  public get singular() : boolean {
    return (this.dataMartService.dataSources && this.dataMartService.dataSources.length === 1) || ((this.dataMartService.dataSource1 !== undefined || this.dataMartService.dataSource2 !== undefined) && (this.dataMartService.dataSource1 === this.dataMartService.dataSource2));
  }

  @Output() summaryDiagramClick: EventEmitter<any> = new EventEmitter();

  public get fromDataSource(): string | undefined {
    return this.dataMartService.dataSource1;
  }

  public get toDataSource(): string | null {
    return this.dataMartService.dataSource2;
  }

  public get fromDataSourceMatches() {
    return 25;
  }
  public get overlapDataSourceMatches() {
    return this._crossSourceSummaryData && this._crossSourceSummaryData.matches.length > 0 ? this._crossSourceSummaryData.matches[0].entityCount : 0;
  }
  public get toDataSourceMatches() {
    return 30;
  }

  /**
   * emitted when the component begins a request for data.
   * @returns entityId of the request being made.
   */
  @Output() requestStart: EventEmitter<any> = new EventEmitter();
  /**
   * emitted when a search is done being performed.
   * @returns the result of the entity request OR an Error object if something went wrong.
   */
  @Output() requestEnd: EventEmitter<SzRecordCountDataSource[]|Error> = new EventEmitter<SzRecordCountDataSource[]|Error>();
  /**
   * emitted when a search encounters an exception
   * @returns error object.
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private dataMartService: SzDataMartService,
    private dataSourcesService: SzDataSourcesService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

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
  private onDataSourceSelectionChange(dsName: string) {
    console.log(`onDataSourceSelectionChange: ${dsName}`, this.dataMartService.dataSource1, this.dataMartService.dataSource2);

    // stat requests
    let dataRequests = forkJoin({
      fromDataSource: this.dataMartService.dataSource1 ? this.dataMartService.getCrossSourceStatistics(this.dataMartService.dataSource1) : of(false),
      overlapDataSource: this.dataMartService.dataSource1 && this.dataMartService.dataSource2 && this.dataMartService.dataSource1 !== this.dataMartService.dataSource2 ? this.dataMartService.getCrossSourceStatistics(
        this.dataMartService.dataSource1, 
        this.dataMartService.dataSource2): of(false),
      toDataSource: this.dataMartService.dataSource2 ? this.dataMartService.getCrossSourceStatistics(this.dataMartService.dataSource2) : of(false)
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

    // update stats shown
    /*
    this.dataMartService.getCrossSourceStatistics(
      this.dataMartService.dataSource1, 
      this.dataMartService.dataSource2)
      .pipe(
        take(1),
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onCrossSourceDataChanged.bind(this));
    */
  }
  private onCrossSourceDataChanged(data: crossSourceSummaryResponses) {
    if(data && data.fromDataSource) {
      this._fromDataSourceSummaryData = data.fromDataSource;
    }
    if(data && data.overlapDataSource) {
      this._crossSourceSummaryData = data.overlapDataSource;
    }
    if(data && data.toDataSource) {
      this._toDataSourceSummaryData = data.toDataSource;
    }
    console.log(`onCrossSourceDataChanged: `, this._fromDataSourceSummaryData, this._crossSourceSummaryData, this._toDataSourceSummaryData);
  }

  diagramClick(diagramSection: string, matchLevel: number) {
    let newFromDataSource;
    let newToDataSource;
    if (diagramSection === 'LEFT') {
      newFromDataSource = this.fromDataSource;
      newToDataSource = this.fromDataSource;
    } else if (diagramSection === 'RIGHT') {
      newFromDataSource = this.toDataSource;
      newToDataSource = this.toDataSource;
    } else if (diagramSection === 'OVERLAP') {
      newFromDataSource = this.fromDataSource;
      newToDataSource = this.toDataSource;
    }


    this.summaryDiagramClick.emit({
      diagramSection: diagramSection,
      matchLevel: matchLevel,
      currentFromDataSource: this.fromDataSource,
      currentToDataSource: this.toDataSource,
      newFromDataSource: newFromDataSource,
      newToDataSource: newToDataSource,
    });
  }
}