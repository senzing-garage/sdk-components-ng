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


  public get auditSummaryLookup(): any {
    return this._summaryLookup;
  }

  public get dataSources() : string[] {
    return this._dataSources;
  }

  public get fromDataSources(): string[] {
    return this._fromDataSources;
  }

  public get fromDataSourceInfos() : string[] {
    return this._fromDataSourceInfos;
  }

  public get toDataSources(): string[] {
    return this._toDataSources;
  }

  public get toDataSourceInfos(): any[] {
    return this._toDataSourceInfos;
  }

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