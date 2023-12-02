import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { map, take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { SzEntityData, SzEntityIdentifier, SzEntityNetworkData, SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
//import { SzGraphControlComponent } from './sz-graph-control.component';
//import { SzGraphNodeFilterPair, SzEntityNetworkMatchKeyTokens, SzMatchKeyTokenComposite, SzNetworkGraphInputs, SzMatchKeyTokenFilterScope } from '../../models/graph';
import { parseBool, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource } from '../../models/data-sources';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';

/**
 * Embeddable Donut Graph showing how many 
 * records belong to which datasources for the repository in a visual way. 
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-record-counts-donut (dataSourceClick)="onEntityClick($event)"></sz-record-counts-donut>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-records-stats-donut></sz-wc-records-stats-donut>
 *
 * @example <!-- (WC) by DOM -->
 * <sz-wc-records-stats-donut id="sz-wc-records-stats-donut"></sz-wc-records-stats-donut>
 * <script>
 * document.getElementById('sz-wc-records-stats-donut');
 * document.getElementById('sz-wc-records-stats-donut').addEventListener('dataSourceClick', (data) => { console.log('datasource clicked on!', data); })
 * </script>
 */
@Component({
  selector: 'sz-record-counts-donut',
  templateUrl: './sz-donut.component.html',
  styleUrls: ['./sz-donut.component.scss']
})
export class SzRecordStatsDonutChart implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _dataSourceCountsByCode: Map<string, SzRecordCountDataSource>;
  private _dataSourceCounts: SzRecordCountDataSource[];
  private _dataSources: SzDataSourcesResponseData;
  private _totalRecordCount: number;
  private _totalEntityCount: number;
  private _totalUnnamedRecordCount: number;
  private _totalPendingRecordCount: number;

  /** colors */
  private $szGrey = '#434447';
  //private colorPalette = ['#081fad', 'lightblue', this.$szGrey, '#6b486b', '#a05d56', '#d0743c', '#ff8c00'];
  private _colorPalette: string[];

  private color: any;
  private _pendingLoadColor: string;    /** if unset will be pulled from position 200 of auto generated colors */
  private _unnamedRecordsColor: string; /** if unset will be pulled from last position of auto generated colors */


  /* donut chart properties */
  private donutWidth: number;
  private donutHeight: number;
  private donutSvg: any;     // TODO replace all `any` by the right type
  private donutRadius: number;
  private arc: any;
  private pie: any;
  
  /** -------------------------------------- getters and setters -------------------------------------- */

  get totalEntityCount(): number {
    return this._totalEntityCount;
  }
  get totalRecordCount(): number {
    return this._totalRecordCount;
  }
  get totalUnnamedRecordCount(): number {
    return this._totalUnnamedRecordCount;
  }
  get totalPendingRecordCount(): number {
    return this._totalPendingRecordCount;
  }
  get totalDataSources(): number {
    let retVal = (this._dataSourceCountsByCode.size) ? this._dataSourceCountsByCode.size : 0;
    return retVal;
  }
  get pendingLoadColor(): string {
    // if we previously set this or the user passed it in pull that value
    if(this._pendingLoadColor !== undefined && this._pendingLoadColor !== null) {
      return this._pendingLoadColor;
    }
    // otherwise pull from last color value in pallete
    if(this._colorPalette && this._colorPalette.length >= 200) {
      this._pendingLoadColor = this._colorPalette[ 200 ];
      return `hsl('${ this._unnamedRecordsColor }', 100%, 50%)`;
    }
    return "'blue'";
  }
  get unnamedRecordsColor(): string {
    // if we previously set this or the user passed it in pull that value
    if(this._unnamedRecordsColor !== undefined && this._unnamedRecordsColor !== null) {
      return this._unnamedRecordsColor;
    }
    // otherwise pull from last color value in pallete
    if(this._colorPalette && this._colorPalette.length > 0) {
      this._unnamedRecordsColor = this._colorPalette[ this._colorPalette.length - 1];
      return `hsl('${ this._unnamedRecordsColor }', 100%, 50%)`;
    }
    return "'pink'";
  }

  get dataSourceCounts(): SzRecordCountDataSource[] {
    return this._dataSourceCounts;
  }
  set dataSourceCounts(value: SzRecordCountDataSource[]) {
    this._dataSourceCounts = value;
    if(value && value.length) {
      // create map by code
      let _rCountByCode = new Map<string, SzRecordCountDataSource>(value.map((obj)=>[obj.dataSourceCode, obj]));
      this._dataSourceCountsByCode = _rCountByCode;
    }
  }

  get dataSourceCountsByCode(): Map<string, SzRecordCountDataSource> {
    return this._dataSourceCountsByCode;
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
    // get data source counts
    this.getDataSourceRecordCounts().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((recordCounts: SzRecordCountDataSource[])=>{
      console.log(`got counts: `, recordCounts);
    });
    // get data sources
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe((dataSources: SzDataSourcesResponseData)=>{
      console.log(`got data sources: `, dataSources);
      this._dataSources = dataSources;
      if(this._dataSources && this._dataSources.dataSources) {
        this._colorPalette = this.getHslColors(this._dataSources.dataSources.length)
      }
    });
    
  }

  /** ---------------------------------------- methods and subs --------------------------------------- */

  private getDataSourceRecordCounts(): Observable<SzRecordCountDataSource[]> {
    //let retObsSub = new BehaviorSubject<SzRecordCountDataSource[]>(undefined);
    //let retVal    = retObsSub.asObservable();
    return this.dataMartService.getRecordCounts().pipe(
      map((response)=> {
        console.info(`SzRecordStatsDonutChart.getDataSources(): response: `, response);
        if(response && response.data) {
          if(response.data.totalEntityCount) {
            this._totalEntityCount = response.data.totalEntityCount;
          }
          if(response.data.totalRecordCount) {
            this._totalRecordCount = response.data.totalRecordCount;
          }
          if(response.data.dataSourceCounts && response.data.dataSourceCounts.length > 0){
            this.dataSourceCounts = response.data.dataSourceCounts;
          }
        }
        return this.dataSourceCounts;
      })
    );
    //.subscribe((response)=>{
      
      //retObsSub.next(this.dataSourceCounts);
    //});
    // retrieve the stub data
    //return retVal;
  }
  private getDataSources(): Observable<SzDataSourcesResponseData> {
    return this.dataSourcesService.listDataSourcesDetails();
  }
  public getDataSourceName(dsCode: string) {
    if(this._dataSources) {
      if(this._dataSources[dsCode] && this._dataSources[dsCode].dataSourceName) {
        return this._dataSources[dsCode].dataSourceName
      } 
    }
    return dsCode
  }
  public onDataSourceDetailClick(dsCode: string) {
    // emit event that can be listed for
  }
  /*
  private getColorssss() {
    if (this.totalPendingRecordCount > 0) {
      const loadedSourceColors = this.colorPalette.slice(0, this._dataSourceCounts.length);
      loadedSourceColors.push(this.colorPendingLoad);
      return loadedSourceColors;
    } else {
      return this.colorPalette;
    }
  }*/

  getLastColorIndex() {
    return this._colorPalette.length;
  }
  getColorAtIndex(index: number) {
    let retVal = "green";
    if(this._colorPalette && this._colorPalette[index]) {
      retVal = 'hsl('+ this._colorPalette[index] +', 100%, 50%)';
    }
    return retVal;
    //return 'hsl('+ this.getHslColorAtIndex(index) +', 100%, 50%)';
    //return this._colorPalette && this._colorPalette.length > index ? `'hsl(${ this._colorPalette[index] }, 100%, 50%)'` : "'green'";
  }
  getHslColorAtIndex(index: number) {
    return this._colorPalette && this._colorPalette[index] ? this._colorPalette[index] : 0;
  }

  getHslColors(num: number) {
    const initialColor = Math.floor(Math.random() * 360);
    const increment = 360 / num;
    const hsls = [];
    for (let i = 0; i < num; i++) {
      hsls.push(Math.round((initialColor + (i * increment)) % 360));
    }
    return hsls;
  }
}