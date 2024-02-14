import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';

import { SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatCountsForDataSources } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';

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

  private _project: any | null = null;
  private _resultsSummary : any | null = null;
  private _summaryData = [];
  private _summaryLookup = {};
  private _fromDataSource: string | null = null;
  private _defaultFromDataSource: string | null = null;
  private _toDataSource: string | null = null;
  private _defaultToDataSource: string | null = null;
  private _dataSources : string[] = [];
  private _fromDataSources: string[] = [];
  private _fromDataSourceInfos : any[] = [];
  private _toDataSources: string[] = [];
  private _toDataSourceInfos: any[] = [];
  private _fromAuditInfo : any | null = null;
  private _toAuditInfo : any | null = null;
  private _overlapAuditInfo : any | null = null;
  private _totalRecordCount: number = 0;
  private _totalEntityCount: number = 0;
  private _totalSingleCount: number = 0;
  private _totalConnectionCount : number = 0;
  private stepFromNone = false;
  private dataSourceLookup : { [code: string]: string } = {};

  public get auditSummaryLookup(): any {
    return this._summaryLookup;
  }

  public get dataSources() : string[] {
    return this._dataSources;
  }

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
    return false
    return (this.dataSources.length === 1
            || this.fromDataSource === this.toDataSource);
  }
  public getDataSourceName(code: string) : string {
    let obs = this.dataSourceLookup[code];
    if (!obs) {
      obs = this.dataSources.find((dcode)=>{ return dcode === code;})
      this.dataSourceLookup[code] = obs;
    }
    return obs;
  }

  @Output() summaryDiagramClick: EventEmitter<any> = new EventEmitter();

  public get fromDataSource(): string | null {
    return this._fromDataSource;
  }

  public get defaultFromDataSource() : string {
    return this._defaultFromDataSource;
  }

  @Input("default-from-data-source")
  public set defaultFromDataSource(source: string) {
    this._defaultFromDataSource = source;
  }

  public get toDataSource(): string | null {
    return this._toDataSource;
  }

  public get defaultToDataSource() : string {
    return this._defaultToDataSource;
  }

  @Input("default-to-data-source")
  public set defaultToDataSource(source: string) {
    this._defaultToDataSource = source;
  }

  public get fromAuditInfo() : any | null {
    return this._fromAuditInfo;
  }

  public get toAuditInfo() : any | null {
    return this._toAuditInfo;
  }

  public get overlapAuditInfo() : any | null {
    return this._overlapAuditInfo;
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
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe({
      next: (dataSources: SzDataSourcesResponseData)=>{
        this._dataSources = dataSources.dataSources;
        console.log(`got datasources: `, this._dataSources);
        //this.dataChanged.next(this._dataSourceCounts);
        /*if(this._dataSourceCounts && this._dataSources) {
          this.dataChanged.next(this._dataSourceCounts);
        }*/
      },
      error: (err) => {
        this.exception.next(err);
      }
    });
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

  public getFromAuditInfoDiscoveredConnectionCount() {
    return 0
    return (this.fromAuditInfo.discoveredConnectionCount < 1000)
              ? ("" + this.fromAuditInfo.discoveredConnectionCount)
              : (this.fromAuditInfo.discoveredConnectionCount)
  }

  private getDataSources(): Observable<SzDataSourcesResponseData> {
    return this.dataSourcesService.listDataSourcesDetails()
  }

  public getDiscoveredConnectionCount(dataSource1: string, dataSource2: string) {
    return '';
  }

  stepFromDataSource(backwards: boolean) : void
  {
    const fromDS = this.fromDataSource;
    const sources = this.dataSources;
    if (sources && sources.length === 1) {
      this.setFromDataSource(sources[0]);
      return;
    }

    if (!fromDS && sources && sources.length > 0) {
      this.setFromDataSource(sources[0]);
      return;
    }

    let index = sources.indexOf(fromDS) + (backwards ? -1 : 1);
    const length = sources.length;

    if (index < 0) {
      index = length + (index%length);
    } else if (index >= length) {
      index = index % length;
    }

    if (this.stepFromNone) {
      this.setBothDataSources(sources[index]);
    } else {
      this.setFromDataSource(sources[index]);
    }
  }

  stepToDataSource(backwards: boolean) : void
  {
    const sources = this.dataSources;
    if (sources && sources.length === 1) {
      this.setToDataSource(sources[0]);
      return;
    }

    let index = 0;
    const length = sources.length;

    if (!this.toDataSource && sources && sources.length > 0) {
      if (backwards) {
        index = sources.length-1;
      } else {
        index = 0;
      }
    } else {
      index = sources.indexOf(this.toDataSource) + (backwards ? -1 : 1);
    }

    if (index < 0) {
      index = length + (index % length);
    } else if (index >= length) {
      index = index % length;
    }
    this.setToDataSource(sources[index]);
    this.stepFromNone = sources[index] === this.fromDataSource;
  }

  private setBothDataSources(dataSource: string) {
    setTimeout(() => {
      if (this.dataSources && this.dataSources.indexOf(dataSource) >= 0)
      {
        this._fromDataSource  = dataSource;
        this._toDataSource    = dataSource;
        //this.currentProjectService.setAttribute(FROM_DATA_SOURCE_KEY, dataSource);
        //this.currentProjectService.setAttribute(TO_DATA_SOURCE_KEY, dataSource);
        //this.onSummaryDataChanged();
      }
    });
  }

  public setFromDataSource(dataSource: string) {
    setTimeout(() => {
      if (this.dataSources && this.dataSources.indexOf(dataSource) >= 0) {
        this._fromDataSource = dataSource;
        console.log(`from datasource: ${this._fromDataSource}`);
        if (this.stepFromNone && (this.fromDataSource !== this.toDataSource)) {
          this.stepFromNone = false;
        }
        //this.currentProjectService.setAttribute(FROM_DATA_SOURCE_KEY, dataSource);
        //this.onSummaryDataChanged();
      }
    });
  }

  public setToDataSource(dataSource: string) {
    setTimeout(() => {
      if (!dataSource || (this.dataSources.indexOf(dataSource) >= 0)) {
        this._toDataSource = dataSource;
        this.stepFromNone = (this._toDataSource === this._fromDataSource);
        console.log(`to datasource: ${this._toDataSource}`);
        //this.currentProjectService.setAttribute(TO_DATA_SOURCE_KEY, dataSource);
        //this.onSummaryDataChanged();
      }
    });
  }
}