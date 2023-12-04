import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { map, take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
//import * as d3 from 'd3';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';

import { SzEntityData, SzEntityIdentifier, SzEntityNetworkData, SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
//import { SzGraphControlComponent } from './sz-graph-control.component';
//import { SzGraphNodeFilterPair, SzEntityNetworkMatchKeyTokens, SzMatchKeyTokenComposite, SzNetworkGraphInputs, SzMatchKeyTokenFilterScope } from '../../models/graph';
import { isValueTypeOfArray, parseBool, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatCountsForDataSources } from '../../models/stats';
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
  private _unlistedDataSources: string[];


  /** colors */
  private $szGrey = '#434447';
  //private colorPalette = ['#081fad', 'lightblue', this.$szGrey, '#6b486b', '#a05d56', '#d0743c', '#ff8c00'];
  private _colorPalette: string[];

  /* @internal used to override auto-generated colors with user value */
  private _colors: string[];
  /** sets the colors used in chart */
  @Input() public set colors(value: string[]) {
    this._colors = value;
    // if already have data need to update colors

  };

  /** values for these datasources are hidden from view */
  @Input() public set ignore(value: string[] | string) {
    if(isValueTypeOfArray(value)) {
      // string array
      this._unlistedDataSources = value as string[];
    } else if((value as string).indexOf(',') > -1) {
      // multiple string values
      this._unlistedDataSources = (value as string).split(',')
    } else {
      // assume single string??
      this._unlistedDataSources = [(value as string)];
    }
    if(this._unlistedDataSources && this._unlistedDataSources.length > 0) {
      // remove any whitespace and uppercase everything
      this._unlistedDataSources = this._unlistedDataSources.map((dsCode) => {
        return dsCode.replaceAll(' ','').trim().toUpperCase();
      })
    }
  }
  private _orderBy: 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc'; 
  @Input() public set orderBy(value: 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc') { 
    this._orderBy = value;
  }

  //private color: any;
  private _pendingLoadColor: string;    /** if unset will be pulled from position 200 of auto generated colors */
  private _unnamedRecordsColor: string; /** if unset will be pulled from last position of auto generated colors */


  /* donut chart properties */
  private donutWidth: number;
  private donutHeight: number;
  private donutSvg: any;     // TODO replace all `any` by the right type
  private donutRadius: number;
  private arc: any;
  private pie: any;

  /** event emitters */
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
  /**
   * emmitted when the entity data to display has been changed.
   */
  @Output('dataChanged')
  dataChanged: Subject<SzRecordCountDataSource[]> = new Subject<SzRecordCountDataSource[]>();
  
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
    let retVal = this._dataSourceCounts;
    if(this._unlistedDataSources && this._unlistedDataSources.length > 0) {
      // hand back datasource counts minus the unlisted items
      retVal = this._dataSourceCounts.filter((ds) => {
        return this._unlistedDataSources.indexOf(ds.dataSourceCode) === -1;
      });
    }
    // sort
    if(this._orderBy) {
      retVal = this.sortBy(retVal, this._orderBy);
    }
    return retVal;
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
    if(this._unlistedDataSources && this._unlistedDataSources.length > 0) {
      // hand back datasource counts minus the unlisted items
      let retVal = new Map(this._dataSourceCountsByCode);
      this._unlistedDataSources.forEach((dsCode)=>{
        if(retVal.has(dsCode)) { retVal.delete(dsCode); }
      })
      return retVal;
    }
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
    ).subscribe({
      next: (recordCounts: SzRecordCountDataSource[])=>{
        console.log(`got counts: `, recordCounts);
        if(this._dataSourceCounts && this._dataSources) {
          this.dataChanged.next(this._dataSourceCounts);
        }
      },
      error: (err) => {
        this.exception.next(err);
      }
    });
    // get data sources
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe((dataSources: SzDataSourcesResponseData)=>{
      console.log(`got data sources: `, dataSources);
      this._dataSources = dataSources;
      if(this._dataSources && this._dataSources.dataSources) {
        //this._colorPalette = this.autoGenerateColorPallete(this._dataSources.dataSources.length);
        console.log(`autogenerated colors: `, this._colorPalette, this._colors);
      }
      if(this._dataSourceCounts && this._dataSources) {
        this.dataChanged.next(this._dataSourceCounts);
      }
    });

    // only execute draw once we have the data
    this.dataChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (data) => {
        this.initDonut()
        this.renderDonut(data);
      },
      error: (err) => {
        this.exception.next(err);
      }
    }); 
    
  }

  /** ---------------------------------------- methods and subs --------------------------------------- */
  private renderDonut(data?: SzRecordCountDataSource[]) {

    console.log(`render donut: `, data);

    /** sub-routine for getting fill color */
    /*let getD3ColorByDataSource = (d) => {
      let retVal;
      let dataSourceCode = d.data ? d.data.dataSourceCode : undefined;
      //console.log(`getColorByDataSource()`, dataSourceCode);
      let colorVal = this.getColorByDataSourceCode(dataSourceCode);
      if(colorVal) {
        // wrap value in css hsl value
        retVal = colorVal;
        //retVal = 'hsl('+ colorVal +', 100%, 50%, 56%)';
      }
      if(dataSourceCode === 'BIG-COMPANY') {
        console.warn(`D3 color for "BIG-COMPANY" is ${colorVal}`, this._colorPalette, this._colors);
      }
      return retVal;
    }*/

    const dataAndUnloaded = data.slice(0);
    if (this._totalPendingRecordCount > 0) {
      /*const unloadedSummary = new SourceSummary();
      unloadedSummary.dataSource = 'Pending Load';
      unloadedSummary.recordCount = this.pendingRecordCount;
      dataAndUnloaded.push(unloadedSummary);*/
    }

    if(!this.pie){
      // this.initDonutSvg has not run yet
      return;
    }

    const g = this.donutSvg.selectAll('.arc')
      .data(this.pie(dataAndUnloaded))
      .enter().append('g')
        .attr('class', 'arc')
      .append('path')
        .attr('d', this.arc)
        .style('fill', (d) => d.data.color );

    g.each(function (d, i) {
      const ele = d3.select(this);
      // light blue gets a lighter stroke(looks weird dark)
      const sAlpha = i === 0 ? '0.8' : '0.3';

      ele.style('stroke', '#000')
      .style('stroke-width', '1px')
      .style('stroke-opacity', sAlpha);
    });
  }

  private initDonut() {
    this.donutSvg = d3.select('svg.donut-chart');
    if (!this.donutSvg) { console.warn('no donut svg'); return; }
    if (this.donutSvg.empty && this.donutSvg.empty()) { console.warn('donut already rendered'); return; }
    
    this.donutSvg.selectAll('*').remove();
    this.donutWidth   = +this.donutSvg.attr('width');
    this.donutHeight  = +this.donutSvg.attr('height');
    this.donutRadius  = Math.min(this.donutWidth, this.donutHeight) / 2;

    // pretty pixies
    const defs = d3.select('svg').append("defs");
    const filter = defs.append("filter")
    .attr("id", "dropshadow")
    .attr("color-interpolation-filters", "sRGB");

    // Glow
    const glow = filter.append("feComponentTransfer")
    .attr("in", "SourceAlpha");
    // Alpha
    glow.append("feFuncA")
    .attr("type", "linear")
    .attr("slope", "0.5");
    // Shadow
    filter.append("feGaussianBlur")
    //.attr("in", "SourceAlpha")
    .attr("stdDeviation", 4)
    .attr("result", "blur");
    filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 2)
    .attr("dy", 5)
    .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    // Normally a scale maps from a domain to a range.  You would specify the domain here with the range.
    // scaleOrdinal maps from discrete value to discrete value.  This allows the domain to be generated from the data as it's processed.
    
    /*this.color = d3Scale.scaleOrdinal()
      .range(this._colorPalette);
    //  .range(this.getColors());*/

    this.arc = d3Shape.arc()
      .outerRadius(this.donutRadius - 10)
      .innerRadius(this.donutRadius - 40);

    this.pie = d3Shape.pie()
      .padAngle(.015)
      .value((d: any) => d.recordCount);

    // for some reason donutWidth comes back as NaN when in background on new ds add
    if ( !Number.isNaN(this.donutWidth / 2) && !Number.isNaN(this.donutHeight / 2) ) {
      this.donutSvg = d3.select('svg.donut-chart')
        .append('g')
        .attr('transform', 'translate(' + this.donutWidth / 2 + ',' + this.donutHeight / 2 + ')')
        .attr("filter", "url(#dropshadow)");
    }
  }

  private getDataSourceRecordCounts(): Observable<SzRecordCountDataSource[]> {
    //let retObsSub = new BehaviorSubject<SzRecordCountDataSource[]>(undefined);
    //let retVal    = retObsSub.asObservable();
    return this.dataMartService.getCountStatistics().pipe(
      map((response)=> {
        console.info(`SzRecordStatsDonutChart.getDataSources(): response: `, response);
        if(response && response.data) {
          this.extendData(response.data);

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

  /*getLastColorIndex() {
    return this._colorPalette.length;
  }
  getColorAtIndex(index: number) {
    let retVal = "green";
    if(this._colorPalette && this._colorPalette[index]) {
      retVal = this._colorPalette[index];
      //retVal = 'hsl('+ this._colorPalette[index] +', 100%, 50%, 56%)';
    }
    return retVal;
    //return 'hsl('+ this.getHslColorAtIndex(index) +', 100%, 50%)';
    //return this._colorPalette && this._colorPalette.length > index ? `'hsl(${ this._colorPalette[index] }, 100%, 50%)'` : "'green'";
  }
  getHslColorAtIndex(index: number) {
    return this._colorPalette && this._colorPalette[index] ? this._colorPalette[index] : 0;
  }*/

  sortBy(value: SzRecordCountDataSource[], by: 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc') {
    let retVal = value;
    if(value && value.sort && by) {
      switch(by) {
        case 'alphaasc':
          retVal = retVal.sort((a,b)=>{
            return a.dataSourceCode.toUpperCase() > b.dataSourceCode.toUpperCase() ? 1 : -1;
          });
          break;
        case 'alphadesc':
          retVal = retVal.sort((a,b)=>{
            return a.dataSourceCode.toUpperCase() < b.dataSourceCode.toUpperCase() ? 1 : -1;
          });
          break;
        case 'countasc':
          retVal = retVal.sort((a,b)=>{
            return a.recordCount < b.recordCount ? 1 : -1;
          });
          break;
        case 'countdesc':
          retVal = retVal.sort((a,b)=>{
            return a.recordCount < b.recordCount ? -1 : 1;
          });
          break;
      }
    }
    return retVal;
  }

  /*getColorByDataSourceCode(dataSourceCode: string) {
    let retVal;
    if(this._dataSourceCountsByCode.has(dataSourceCode)) {
      // ds exists, get color code
      let indexOfDS = this.sortBy(this._dataSourceCounts, this._orderBy).findIndex((ds) => ds.dataSourceCode === dataSourceCode);
      let colorsMinusHidden = this.colorPalletteMinusHiddenDataSources;
      if(colorsMinusHidden && colorsMinusHidden.length > 0 && colorsMinusHidden[indexOfDS]) {
        //retVal = this._colorPalette[indexOfDS];
        retVal = colorsMinusHidden[indexOfDS];
      }
      //console.log(`got fill color "${retVal}" for "${dataSourceCode}"`);
    } else {
      //console.warn(`"${dataSourceCode}"S not found in ds codes`);
    }
    return retVal;
  }*/

  extendData(data: SzStatCountsForDataSources) {
    if(data) {
      this.addColorsToData(data.dataSourceCounts);
    }
  }

  addColorsToData(data: SzRecordCountDataSource[]) {
    let numOfColors     = data.length;
    const initialColor  = 1;
    const increment     = 360 / numOfColors;
    const colors        = [];
    for (let i = 0; i < numOfColors; i++) {
      let _colorNum   = Math.round((initialColor + (i * increment)) % 360);
      let _colorStyle = (this._colors && this._colors.length >= i && this._colors[i]) ? this._colors[i] : 'hsl('+ _colorNum +', 100%, 50%, 56%)';
      colors.push(_colorStyle);
    }
    data = data.map((ds, ind)=>{
      ds.color = ds.color ? ds.color : colors[ind];
      return ds;
    })
    return data
  }

  /*autoGenerateColorPallete(num: number) {
    //const initialColor = Math.floor(Math.random() * 360);
    const initialColor = 1;
    const increment = 360 / num;
    const hsls = [];
    for (let i = 0; i < num; i++) {
      let _colorNum   = Math.round((initialColor + (i * increment)) % 360);
      let _colorStyle = (this._colors && this._colors.length >= i && this._colors[i]) ? this._colors[i] : 'hsl('+ _colorNum +', 100%, 50%, 56%)';
      hsls.push(_colorStyle);
    }
    return hsls;
  }*/
}