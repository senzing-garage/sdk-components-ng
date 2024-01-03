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
 * <sz-record-counts-donut (dataSourceClick)="onDataSourceClick($event)"></sz-record-counts-donut>
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

  private _dataSourceCounts: SzRecordCountDataSource[];
  private _dataSourceCountsByCode: Map<string, SzRecordCountDataSource>;
  private _dataSources: SzDataSourcesResponseData;
  private _totalEntityCount: number;
  private _totalPendingRecordCount: number;
  private _totalRecordCount: number;
  private _totalUnmatchedRecordCount: number;
  private _unlistedDataSources: string[];
  private _limitToNumber: number;
  /* @internal used to override auto-generated colors with user value */
  private _colors: string[];
  /** @internal possible values for sort order of list are 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc' */
  private _orderBy: 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc'; 
  /* donut chart properties */
  /** @internal width of svg */
  private donutWidth: number;
  /** @internal height of svg */
  private donutHeight: number;
  /** @internal d3 ref to svg */
  private donutSvg: any;     // TODO replace all `any` by the right type
  /** @internal radius of svg */
  private donutRadius: number;
  /** @internal d3 ref to arc */
  private arc: any;
  /** @internal d3 ref to pie */
  private pie: any;
  /** @internald3 tooltip selection */
  private _tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

  /** ------------------------------------ event emitters/inputs ------------------------------------ */
  /** sets the colors used in chart */
  @Input() public set colors(value: string[]) {
    this._colors = value;
    // if already have data need to update colors

  };
  /**
   * emmitted when the entity data to display has been changed.
   */
  @Output('dataChanged')
  dataChanged: Subject<SzRecordCountDataSource[]> = new Subject<SzRecordCountDataSource[]>();
  /**
   * emitted when the user clicks a datasource arc node.
   * @returns object with various datasource and ui properties.
   */
  @Output() dataSourceClick: EventEmitter<SzRecordCountDataSource> = new EventEmitter<SzRecordCountDataSource>();
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
  @Input() public set limitToNumber(value: number | string) {
    this._limitToNumber = parseNumber(value);
  }
  /** sort the vertical list. possible values for sort order of list are 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc' */
  @Input() public set orderBy(value: 'alphadesc' | 'alphaasc' | 'countdesc' | 'countasc') { 
    this._orderBy = value;
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
  
  /** -------------------------------------- getters and setters -------------------------------------- */

  get totalEntityCount(): number {
    return this._totalEntityCount;
  }
  get totalRecordCount(): number {
    return this._totalRecordCount;
  }
  get totalUnmatchedRecordCount(): number {
    return this._totalUnmatchedRecordCount;
  }
  get totalPendingRecordCount(): number {
    return this._totalPendingRecordCount;
  }
  get totalDataSources(): number {
    let retVal = (this._dataSourceCountsByCode.size) ? this._dataSourceCountsByCode.size : 0;
    return retVal;
  }
  /*
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
  }*/

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
    // limit top results
    if(this._limitToNumber > 0) {
      retVal = retVal.slice(0, this._limitToNumber);
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
      this._dataSources = dataSources;
      if(this._dataSourceCounts && this._dataSources) {
        this.dataChanged.next(this._dataSourceCounts);
      }
    });

    // only execute draw once we have the data
    this.dataChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (data) => {
        //console.log('counted totals', this.getTotalsFromCounts(data));
        this.initDonut()
        this.renderDonut(data);
      },
      error: (err) => {
        this.exception.next(err);
      }
    });
    // listend for datasource clicks
    this.dataSourceClick.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((d)=>{
      console.log('data source clicked', d);
    })
    
  }

  /** --------------------------------------- methods and subs -------------------------------------- */
    /** -------------------------------------- drawing methods -------------------------------------- */

    static arcTooltipText(d: any) {
      let retVal = `<strong>${d.data.dataSourceCode}</strong>: ${d.data.recordCount} record`+(d.data.recordCount !== 1 ? 's':''); ;
      return retVal;
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

      // Make the tooltip visible when mousing over nodes.
      this._tooltip = d3.select("body")
      .append("div")
      .attr("class", "sz-donut-chart-tooltip")
      .style("opacity", 0);

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
    
    private renderDonut(data?: SzRecordCountDataSource[]) {
      console.log(`render donut: `, data);
      let removedItems = (this._limitToNumber > 0) ? data.splice(this._limitToNumber): [];
      if(this._limitToNumber > 0) {
        // show total unlisted as single item
        removedItems = data.splice(this._limitToNumber);
      }
      const dataSourcesToDisplay = data.slice(0);
      // unmatched/singletons
      if (this._totalUnmatchedRecordCount) {
        const unMatchedSummary: SzRecordCountDataSource = {
          dataSourceCode: 'Unmatched',
          entityCount: 0,
          recordCount: this._totalUnmatchedRecordCount
        }
        dataSourcesToDisplay.push(unMatchedSummary);
      }
      // pending load
      if (this._totalPendingRecordCount > 0) {
        const unMatchedSummary: SzRecordCountDataSource = {
          dataSourceCode: 'Pending Load',
          entityCount: 0,
          recordCount: this._totalPendingRecordCount
        }
        dataSourcesToDisplay.push(unMatchedSummary);
      }

      if(!this.pie){
        // this.initDonutSvg has not run yet
        return;
      }
      // sub for attaching event handlers to node(s)
      let attachEventListenersToNodes   = (_nodes, _tooltip, _scope?: any) => {
        _scope  = _scope ? _scope : this;
        // Make the tooltip visible when mousing over nodes. 
        if(_nodes && _nodes.on) {
          _nodes.on('mouseover.tooltip', function (event, d, j) {
            _tooltip.transition()
              .duration(300)
              .style("opacity", 1)
            _tooltip.html(SzRecordStatsDonutChart.arcTooltipText(d))
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY + 10) + "px");
          })
          .on("mouseout.tooltip", function (event, d) {
            _tooltip.transition()
              .duration(100)
              .style("opacity", 0);
          })
          .on('click', this.onArcClick.bind(_scope))
        }
      }
      let detachEventListeners  = (_nodes) => {
        if(_nodes && _nodes.on) {
          _nodes.on('mouseover.tooltip', null)
          .on("mouseout.tooltip", null)
          .on('click', null)
        }
      }

      const g = this.donutSvg.selectAll('.arc')
        .data(this.pie(dataSourcesToDisplay))
        .enter().append('g')
          .attr('class', 'arc');
      let arcPaths = g.append('path')
          .attr('d', this.arc)
          .attr('class', (d) => { 
            if(d.data.dataSourceCode === 'unmatched'){
              return 'item-unmatched';
            }
            if(d.data.dataSourceCode === 'pending load'){
              return 'item-pending';
            }
            return 'item-'+ (d.data && d.data.dataSourceCode && d.data.dataSourceCode.toLowerCase ? d.data.dataSourceCode.toLowerCase() : 'unknown');
          })
          .style('fill', (d) => d.data.color );

      // attach event listeners to arc elements
      attachEventListenersToNodes(arcPaths, this._tooltip, this);
    }

    /** ---------------------------------- data transform methods ----------------------------------- */
    
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
      // we want the colors to respect the sort order
      if(this._orderBy) {
        let sortedData    = this.sortBy(data, this._orderBy);
        sortedData.forEach((sdata, ind) => {
          sdata.color = sdata.color ? sdata.color : colors[ind];
        });
      } else {
        data = data.map((ds, ind)=>{
          ds.color = ds.color ? ds.color : colors[ind];
          return ds;
        });
      }
      return data
    }
    extendData(data: SzStatCountsForDataSources) {
      if(data) {
        this.addColorsToData(data.dataSourceCounts);
      }
    }

    public getDataSourceName(dsCode: string) {
      if(this._dataSources) {
        if(this._dataSources[dsCode] && this._dataSources[dsCode].dataSourceName) {
          return this._dataSources[dsCode].dataSourceName
        } 
      }
      return dsCode
    }
    private getDataSourceRecordCounts(): Observable<SzRecordCountDataSource[]> {
      return this.dataMartService.getLoadedStatistics().pipe(
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
            if(response.data.totalUnmatchedRecordCount) {
              this._totalUnmatchedRecordCount = response.data.totalUnmatchedRecordCount
            }
            if(response.data.dataSourceCounts && response.data.dataSourceCounts.length > 0){
              this.dataSourceCounts = response.data.dataSourceCounts;
            }
          }
          return this.dataSourceCounts;
        })
      );
    }
    private getDataSources(): Observable<SzDataSourcesResponseData> {
      return this.dataSourcesService.listDataSourcesDetails();
    }
    getTotalsFromCounts(data: SzRecordCountDataSource[]): { totalEntityCount: number, totalRecordCount: number, totalUnmatchedRecordCount: number} 
    {
      let retVal = 0;
      let recordTotals    = 0;
      let entityTotals    = 0;
      let unmatchedTotals = 0;
      if(data && data.forEach) {
        data.forEach((element) => {
          recordTotals    = recordTotals + element.recordCount;
          entityTotals    = entityTotals + element.entityCount;
          unmatchedTotals = unmatchedTotals + element.unmatchedRecordCount;
        });
      }
      return {
        totalEntityCount: entityTotals,
        totalRecordCount: recordTotals,
        totalUnmatchedRecordCount: unmatchedTotals
      };
    }

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
              return a.recordCount < b.recordCount ? -1 : 1;
            });
            break;
          case 'countdesc':
            retVal = retVal.sort((a,b)=>{
              return a.recordCount < b.recordCount ? 1 : -1;
            });
            break;
        }
      }
      return retVal;
    }

  // ----------------------------------------- event handlers -----------------------------------------
  
  /**
   * handler for when a arc node is clicked.
   * proxies to synthetic event "dataSourceClick"
   * @param event
   */
  onArcClick(ptrEvent: PointerEvent, evtData: any) {
    if(evtData && ptrEvent.pageX && ptrEvent.pageY) {
      evtData.eventPageX = (ptrEvent.pageX);
      evtData.eventPageY = (ptrEvent.pageY);
    }
    console.log('Arc clicked for datasource: ', evtData);
    this.dataSourceClick.emit(evtData.data as SzRecordCountDataSource);
  }
  /**
   * handler for when a datasource name is clicked.
   * proxies to synthetic event "dataSourceClick"
   * @param event
   */
  public onDataSourceDetailClick(data: SzRecordCountDataSource) {
    // emit event that can be listed for
    this.dataSourceClick.emit(data);
  }
}