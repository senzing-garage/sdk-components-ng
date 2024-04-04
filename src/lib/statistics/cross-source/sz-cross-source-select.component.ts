import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit, ViewChild } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';
import { SzCrossSourceSummary, SzDataSourcesResponseData, SzSummaryStats } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';

/**
 * pull down menus for selecting what datasources to show in other components.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-statistics></sz-cross-source-statistics>
 *
 */
@Component({
  selector: 'sz-cross-source-select',
  templateUrl: './sz-cross-source-select.component.html',
  styleUrls: ['./sz-cross-source-select.component.scss']
})
export class SzCrossSourceSelectComponent implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _defaultFromDataSource: string | undefined;
  private _defaultToDataSource: string | undefined;
  private _dataSources : string[] = [];
  private _fromDataSources: {name: string, connectionCount: number}[] = [];
  private _toDataSources: {name: string, connectionCount: number}[]   = [];
  private dataSourceLookup : { [code: string]: string } = {};
  private _summaryLookup = {};
  private _summaryData: SzSummaryStats | undefined;
  private stepFromNone = false;

  @ViewChild('displayFromDS') public displayFromDS:  ElementRef;
  @ViewChild('displayToDS')   public displayToDS:    ElementRef;

  public get auditSummaryLookup(): any {
    return this._summaryLookup;
  }

  public get dataSources() : string[] {
    return this._dataSources;
  }

  public get fromDataSources() : {name: string, connectionCount: number}[] {
    return this._fromDataSources;
  }

  public get toDataSources() : {name: string, connectionCount: number}[] {
    return this._toDataSources;
  }

  public get fromDataSource(): string | null {
    return this.dataMartService.dataSource1;
  }

  public set fromDataSource(value: string | undefined) {
    this.dataMartService.dataSource1 = value;
  }

  public get defaultFromDataSource() : string {
    return this._defaultFromDataSource;
  }

  @Input("default-from-data-source")
  public set defaultFromDataSource(source: string) {
    this._defaultFromDataSource = source;
  }

  public get toDataSource(): string | null {
    //return this._toDataSource;
    return this.dataMartService.dataSource2;
  }

  public set toDataSource(value: string | undefined) {
    this.dataMartService.dataSource2 = value;
  }

  public get defaultToDataSource() : string {
    return this._defaultToDataSource;
  }

  @Input("default-to-data-source")
  public set defaultToDataSource(source: string) {
    this._defaultToDataSource = source;
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


  public getDataSourceName(code: string) : string {
    let obs = this.dataSourceLookup[code];
    if (!obs) {
      obs = this._dataSources.find((dcode)=>{ return dcode === code;})
      this.dataSourceLookup[code] = obs;
    }
    return obs;
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private cssService: SzCSSClassService,
    private dataMartService: SzDataMartService,
    private dataSourcesService: SzDataSourcesService) {}
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
      // populate initial selections from prefs
      this.prefs.dataMart.prefsChanged.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onPrefsChange.bind(this));
      
      this.dataMartService.onCountStats.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onLoadedStatsChanged.bind(this));
      this.dataMartService.onSummaryStats.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSummaryStatsChanged.bind(this));
      this.dataMartService.onDataSourceSelected.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onDataSourceSelectionChanged.bind(this));
      // make sure we start off with the latest stats
      this.dataMartService.getSummaryStatistics().pipe(
        take(1)
      ).subscribe();
  }
  ngAfterViewInit() {

  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
  /** whenever a new datasource is selected regenerate lists for counts */
  private onDataSourceSelectionChanged(dsName: string) {
    if(this._dataSources && this.dataMartService.summaryStatistics) {
      this.regenerateDataSourceLists(this._dataSources);
    }
  }
  private regenerateDataSourceLists(value: string[]) {
    // regenerate toDataSources
    this._toDataSources = value.map((ds: string) => {
      return {
        name: ds,
        connectionCount: this.getDiscoveredConnectionCount(ds, this.fromDataSource)
      }
    });
    // regenerate fromDataSources
    this._fromDataSources = value.map((ds: string) => {
      return {
        name: ds,
        connectionCount: this.getDiscoveredConnectionCount(ds, this.toDataSource)
      }
    });
  }

  public onPulldownMenuSizeChange(menubox: HTMLButtonElement, event: Event | any) {
    if(menubox && menubox.clientWidth) {
      let menuWidth = menubox.clientWidth;
      this.cssService.setVariable('--sz-css-pulldown-width', menuWidth+'px');
    }
  }

  private onLoadedStatsChanged(stats) {
    console.info('on Count Stats: ', stats);
  }
  private onSummaryStatsChanged(stats: SzSummaryStats) {
    console.info('onSummaryStatsChanged: ', stats, this.dataMartService);
    if(!this.dataMartService.dataSource1) {
      // select a default
      if(this._defaultFromDataSource) { 
        this.dataMartService.dataSource1 = this._defaultFromDataSource;
      } else {
        // pull first valid
        if(stats) {
          // we only care about the ones that have some sort of information
          let crossSourcesWithStats = stats.sourceSummaries.filter((_ss) => {
            let retVal = false;
            // if no vs ds, match to self
            let toSrcKeyToMatch = this.dataMartService.dataSource2 ? this.dataMartService.dataSource2 : _ss.dataSource;
            if(_ss.crossSourceSummaries.find) {
              // check IF toDataSource exists
              let _css = _ss.crossSourceSummaries.find((_css) => {
                return _css.versusDataSource === toSrcKeyToMatch;
              });
              if(_css) {
                // do we have any relevant counts?
                retVal = this._getTotalRelevantCount(_css) > 0;
              }
            }
            return retVal
          });
          if(crossSourcesWithStats && crossSourcesWithStats.length > 0) {
            console.log(`found datasource with stats "${crossSourcesWithStats[0].dataSource}"`, crossSourcesWithStats);
            // grab the first one
            this.dataMartService.dataSource1 = crossSourcesWithStats[0].dataSource;
          }
        }
      }
    }
  }
  public getSummaryStats() {
    this.dataMartService.getSummaryStatistics().subscribe(
      (resp) => console.log('on summary stats response: ', resp)
    )
  }

  private _getTotalRelevantCount(crossSourceMatch: SzCrossSourceSummary) {
    let retVal = 0;
    if(crossSourceMatch) {
      if(crossSourceMatch.ambiguousMatches && crossSourceMatch.ambiguousMatches.length > 0) {
        retVal += crossSourceMatch.ambiguousMatches[0].entityCount;
      }
      if(crossSourceMatch.disclosedRelations && crossSourceMatch.disclosedRelations.length > 0) {
        retVal += crossSourceMatch.disclosedRelations[0].entityCount;
      }
      if(crossSourceMatch.matches && crossSourceMatch.matches.length > 0) {
        retVal += crossSourceMatch.matches[0].entityCount;
      }
      if(crossSourceMatch.possibleMatches && crossSourceMatch.possibleMatches.length > 0) {
        retVal += crossSourceMatch.possibleMatches[0].entityCount;
      }
    }
    return retVal;
  }
  

  public getFromAuditInfoDiscoveredConnectionCount() {
    return 0
    /*return (this.fromAuditInfo.discoveredConnectionCount < 1000)
              ? ("" + this.fromAuditInfo.discoveredConnectionCount)
              : (this.fromAuditInfo.discoveredConnectionCount)*/
  }

  private getDataSources(): Observable<SzDataSourcesResponseData> {
    return this.dataSourcesService.listDataSourcesDetails()
  }

  public getFormattedConnectionCount(dataSource1: string, dataSource2: string) {
    let connCount = this.getDiscoveredConnectionCount(dataSource1, dataSource2);
    if(connCount > 0) {
      return `(${connCount})`;
    }
    return '';
  }
  /**
   * 
   * "matchedCount", "possibleMatchCount", "discoveredRelationshipCount"
   */
  private getDiscoveredConnectionCount(dataSource1: string, dataSource2: string): number {
    //console.log(`getDiscoveredConnectionCount: ${dataSource1} vs ${dataSource2}`, this.dataMartService.summaryStatistics)
    if(this.dataMartService.summaryStatistics && this.dataMartService.summaryStatistics.sourceSummaries) {
      let _ss = this.dataMartService.summaryStatistics.sourceSummaries.find((_ss) => { return _ss.dataSource === dataSource1;});
      if(_ss) {
        // find the cross source
        let _css = _ss.crossSourceSummaries.find((_css) => {
          if(!dataSource2) {
            // vs itself
            return _css.versusDataSource === dataSource1;
          } else {
            return _css.versusDataSource === dataSource2;
          }
        });
        if(_css){
          let _tConnections = 0;
          //if(_css.ambiguousMatches && _css.ambiguousMatches.length > 0)     { _tConnections += _css.ambiguousMatches[0].entityCount; }
          //if(_css.disclosedRelations && _css.disclosedRelations.length > 0) { _tConnections += _css.disclosedRelations[0].relationCount; }
          if(_css.matches && _css.matches.length > 0)                       { _tConnections += _css.matches[0].entityCount; }
          if(_css.possibleMatches && _css.possibleMatches.length > 0)       { _tConnections += _css.possibleMatches[0].relationCount; }
          if(_css.possibleRelations && _css.possibleRelations.length > 0)   { _tConnections += _css.possibleRelations[0].relationCount; }
          return _tConnections;
        }
      }
    }
    return 0;
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
        this.fromDataSource  = dataSource;
        this.toDataSource    = dataSource;
        //this.currentProjectService.setAttribute(FROM_DATA_SOURCE_KEY, dataSource);
        //this.currentProjectService.setAttribute(TO_DATA_SOURCE_KEY, dataSource);
        //this.onSummaryDataChanged();
      }
    });
  }

  public setFromDataSource(dataSource: string) {
    setTimeout(() => {
      if (this.dataSources && this.dataSources.indexOf(dataSource) >= 0) {
        this.fromDataSource = dataSource;
        console.log(`from datasource: ${this.fromDataSource}`);
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
        this.toDataSource = dataSource;
        this.stepFromNone = (this.toDataSource === this.fromDataSource);
        console.log(`to datasource: ${dataSource}|${this.toDataSource}`);
        //this.currentProjectService.setAttribute(TO_DATA_SOURCE_KEY, dataSource);
        //this.onSummaryDataChanged();
      }
    });
  }
}