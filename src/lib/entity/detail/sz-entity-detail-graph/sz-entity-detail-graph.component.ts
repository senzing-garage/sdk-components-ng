import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType,
  SzEntityNetworkData
} from '@senzing/rest-api-client-ng';

import { SzEntityDetailGraphControlComponent } from './sz-entity-detail-graph-control.component';
import { SzNetworkGraphInputs } from '../../../models/network-graph-inputs';
import { SzRelationshipNetworkComponent, NodeFilterPair } from '@senzing/sdk-graph-components';
import { sortDataSourcesByIndex } from '../../../common/utils';
import { SzDataSourceComposite } from '../../../models/data-sources';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph',
  templateUrl: './sz-entity-detail-graph.component.html',
  styleUrls: ['./sz-entity-detail-graph.component.scss']
})
export class SzEntityDetailGraphComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public isOpen: boolean = true;

  /**
   * Observeable stream for the event that occurs when the graph is
   * rendered for the first time.
   * TODO: remove in next 0.0.7 sdk-graph-components release
   */
  private _graphComponentRenderCompleted: Subject<boolean> = new Subject<boolean>();
  private _graphComponentRendered = false;
  /**
   * list of datasources with color and order information
   * @internal
   */
  private _dataSourceColors: SzDataSourceComposite[] = [];

  /**
   * @internal
   */
  @ViewChild(SzRelationshipNetworkComponent) graphNetworkComponent: SzRelationshipNetworkComponent;

  @Input() public title: string = "Relationships at a Glance";

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   * @deprecated
  */
  private _data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   * @deprecated
  */
  @Input() public set data(value: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }) {
    this._data = value;
    if(value && value.resolvedEntity) {
      this._graphIds = [ value.resolvedEntity.entityId ];
    }
  }

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   *
   * @deprecated
  */
  public get data(): {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  } {
    return this._data;
  }

  public _showMatchKeys = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
  }
  private _openInNewTab: boolean = false;
  /** whether or not to open entity clicks in new tab */
  @Input() public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
  }
  public _openInSidePanel = false;
  /** whether or not to open entity clicks in side drawer */
  @Input() public set openInSidePanel(value: boolean) {
    this._openInSidePanel = value;
  }
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 1;
  @Input() maxEntities: number = 20;
  @Input() buildOut: number = 1;
  /** array of datasources with color and order information */
  @Input() public set dataSourceColors(value: SzDataSourceComposite[]) {
    this._dataSourceColors  = value;
  }
  /** array of datasources with color and order information. ordered ASC by index property */
  public get dataSourceColors(): SzDataSourceComposite[] {
    let retVal: SzDataSourceComposite[] = this._dataSourceColors;
    retVal = sortDataSourcesByIndex(retVal);
    return retVal;
  };
  @Input() dataSourcesFiltered: string[] = [];
  @Input() showPopOutIcon: boolean = false;
  @Input() showFiltersControl: boolean = false;
  @Input() filterControlPosition: string = 'bottom-left';
  @Input() filterWidth: number;
  private neverFilterQueriedEntityIds: boolean = true;
  public filterShowDataSources: string[];
  private _showMatchKeyControl: boolean = true;
  @Input() set showMatchKeyControl(value: boolean | string) {
    if((value as string) == 'true' || (value as string) == 'True' || (value as string) == 'false' || (value as string) == 'False') {
      switch((value as string).toLowerCase()) {
        case 'true':
          value = true;
          break;
        case 'false':
          value = false;
          break;
      }
    }
    this._showMatchKeyControl = (value as boolean);
  }
  get showMatchKeyControl(): boolean | string {
    return this._showMatchKeyControl;
  }
  private _showZoomControl: boolean = true;
  /** the whether or not the zoom control is shown */
  @Input() set showZoomControl(value: boolean | string) {
    if((value as string) == 'true' || (value as string) == 'True' || (value as string) == 'false' || (value as string) == 'False') {
      switch((value as string).toLowerCase()) {
        case 'true':
          value = true;
          break;
        case 'false':
          value = false;
          break;
      }
    }
    this._showZoomControl = (value as boolean);
  }
  /** the whether or not the zoom control is shown */
  get showZoomControl(): boolean | string {
    return this._showZoomControl;
  }
  private _popOutIconPosition: string = 'bottom-left';
  /** the position of the pop-out icon ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left') */
  @Input() public set popOutIconPosition(value: string){
    this._popOutIconPosition = value;
    console.log('popOutIconPosition: '+ value, this._zoomControlPosition);
    if(value == 'top-left' && this._zoomControlPosition == 'top-left') {
      // move zoom control to bottom-right
      this._zoomControlPosition = 'bottom-right';
      console.log('popOutIconPosition: '+ value, this._zoomControlPosition);
    }
  }
  /** the position of the pop-out icon ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left') */
  public get popOutIconPosition(): string {
    return this._popOutIconPosition;
  }
  @Input() public queriedEntitiesColor;

  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  get expanded(): boolean {
    return this.isOpen;
  }
  private _zoomControlPosition = 'top-left';
  /** the position of the zoom control ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left') */
  @Input() public set zoomControlPosition(value: string){
    this._zoomControlPosition = value;
  }
  /** the position of the zoom control ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left') */
  public get zoomControlPosition(): string {
    return this._zoomControlPosition;
  }

  private _graphZoom = 75;
  /** get current zoom level */
  public get graphZoom(): number {
    return this._graphZoom;
  }
  /** current zoom level */
  public set graphZoom(value: number) {
    this._graphZoom = value;
  }

  @Input() public captureMouseWheel: boolean = true;
  @Output() public scrollWheelEvent: EventEmitter<WheelEvent> = new EventEmitter<WheelEvent>()

  @HostBinding('class.open') get cssClssOpen() { return this.expanded; }
  @HostBinding('class.closed') get cssClssClosed() { return !this.expanded; }
  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  @ViewChild(SzEntityDetailGraphControlComponent) graphControlComponent: SzEntityDetailGraphControlComponent;
  @ViewChild(SzRelationshipNetworkComponent) graph : SzRelationshipNetworkComponent;

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /** @internal */
  private _requestStarted: Subject<boolean> = new Subject<boolean>();
  /** @internal */
  private _requestComplete: Subject<boolean> = new Subject<boolean>();
  /** @internal */
  private _renderComplete: Subject<boolean> = new Subject<boolean>();
  /** @internal */
  private _requestNoResults: Subject<boolean> = new Subject<boolean>();
  /**
   * Observeable stream for the event that occurs when a network
   * request is initiated
   */
  @Output() public requestStarted: EventEmitter<boolean> = new EventEmitter<boolean>();
  /**
   * Observeable stream for the event that occurs when a network
   * request is completed
   */
  @Output() public requestComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
  /**
   * Observeable stream for the event that occurs when a draw
   * operation is completed
   */
  @Output() public renderComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
  /**
   * Observeable stream for the event that occurs when a
   * request completed but has no results
   */
  @Output() public requestNoResults: EventEmitter<boolean> = new EventEmitter<boolean>();
  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() noResults: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() popoutClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityDblClick: EventEmitter<any> = new EventEmitter<any>();

  _inputs: SzNetworkGraphInputs;

  private _graphIds: number[];
  @Input() public set graphIds(value: number[]) {
    const _oVal = this._graphIds;
    this._graphIds = value;
    // only reload graph if value has changed
    if(_oVal !== value){
      // console.log('set graphIds: ', this._graphIds, typeof this.graphIds, value, typeof value);
      this.reload( this._graphIds );
    }
  }
  public get graphIds(): number[] | undefined {
    return this._graphIds;
  }

  /** toggle collapsed/expanded state of graph */
  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
    if(this.expanded !== !this.prefs.entityDetail.graphSectionCollapsed) {
      this.prefs.entityDetail.graphSectionCollapsed = !this.expanded;
    }
  }

  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityClick(event: any) {
    this.entityClick.emit(event);
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityDblClick(event: any) {
    this.entityDblClick.emit(event);
  }

  /** event is emitted when the collection of datasources present in graph dislay */
  @Output() dataSourcesChange: EventEmitter<any> = new EventEmitter<string[]>();
  /** event is emitted when the graph components data is updated or loaded */
  @Output() dataLoaded: EventEmitter<SzEntityNetworkData> = new EventEmitter<SzEntityNetworkData>();

  /**
   * on data received by api request and mapped to
   * component input format model. when data has been loaded
   * and parsed build list of distinct datasource names
   * from data.
  */
  public onGraphDataLoaded(inputs: SzNetworkGraphInputs) {
    if(inputs.data && inputs.data.entities) {
      this.filterShowDataSources = SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(inputs.data);
      this.dataSourcesChange.emit( SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(inputs.data) );
    }
    if(inputs.data) {
      this.dataLoaded.emit( inputs.data );
    }
    console.log('onGraphDataLoaded: ', inputs);
  }
  /**
   * handler for when the user performs a mouse wheel scroll event
   */
  public onGraphScrollEvent(evt: Event) {
    //this.scrollWheelEvent.emit(evt);
  }

  /** when scale of graph changes, store value for control indicators */
  public onGraphZoom(value) {
    this._graphZoom = value;
  }
  
  public zoomIn() {
    this.graph.zoomIn();
  }
  public zoomOut() {
    this.graph.zoomOut();
  }
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "contextMenuClick" event.
   * automatically adds the container ele page x/y to relative svg x/y for total x/y offset
   */
  public onRightClick(event: any) {
    if(this.graphContainerEle && this.graphContainerEle.nativeElement) {
      interface evtModel {
        address?: string
        entityId?: number
        iconType?: string;
        index?: number;
        isCoreNode?: false;
        isQueriedNode?: false;
        name?: string;
        orgName?: string;
        phone?: string;
        x?: number;
        y?: number;
        expandable: boolean;
        removable: boolean;
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: evtModel = Object.assign({}, event);

      evtSynth.expandable = this.graph.canExpandNode(evtSynth.entityId);
      evtSynth.removable = this.graph.canRemoveNode(evtSynth.entityId);

      // change x/y to include element relative offset
      evtSynth.x = (Math.floor(pos.x) + Math.floor(event.x));
      evtSynth.y = (Math.floor(pos.y) + Math.floor(event.y));
      //console.warn('onRightClick: ', pos, event);
      this.contextMenuClick.emit( evtSynth );
    }
  }
  /** publish an "popoutClick" event on icon click, pass the entityIds as arg */
  public onPopOutClick(event?: any) {
    // publish event
    this.popoutClick.emit(this.graphIds);
  }

  public onOptionChange(event: {name: string, value: any}) {
    console.log('onOptionChange: ', event);
    switch(event.name) {
      case 'showLinkLabels':
        this.showMatchKeys = event.value;
        break;
    }
  }
  /**
   * Older style data passing, comes from the SzNetworkInputs->XMLHTTPRequest->mutation->event
   * @deprecated
   */
  onNetworkLoaded(inputs: SzNetworkGraphInputs) {
    this._inputs = inputs;
  }
  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // graph prefs
    // NOTE: I had a "debounceTime" in the pipe throttle
    // change intervals, but the reality is no one is gonna be sitting
    // there incrementing prefchange values constantly. if that becomes a problem
    // add it back
    this.prefs.graph.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );

    // entity prefs
    /*
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (prefs: any) => {
      let changedStateOnZero = false;
      if(prefs.hideGraphWhenZeroRelations && this.data && this.data.relatedEntities.length == 0){
        this.isOpen = false;
        changedStateOnZero = true;
      } else if(this.data && this.data.relatedEntities.length == 0 && this.isOpen == false) {
        this.isOpen = true;
        changedStateOnZero = true;
      }
      if(!changedStateOnZero) {
        if(!prefs.graphSectionCollapsed !== this.isOpen){
          // sync up
          this.isOpen = !prefs.graphSectionCollapsed;
        }
      }
    });
    */

    // keep track of whether or not the graph has been rendered
    // this is to get around publishing a new 0.0.7 sdk-graph-components
    // for a simple bugfix to the "rendered" property. There is a property called
    // "rendered" in the component but its not wired in to the lifecycle properly
    if(this.graphNetworkComponent){
      this.graphNetworkComponent.requestStarted.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        // console.log('[GRAPH] requestStarted', args);
        this.requestStarted.emit(args);
      });
      this.graphNetworkComponent.requestComplete.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        this.requestComplete.emit(args);
      });
      this.graphNetworkComponent.renderComplete.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
          // console.log('[GRAPH] renderComplete', args);
        this.renderComplete.emit(args);
      });
      this.graphNetworkComponent.requestNoResults.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        this.requestNoResults.emit(args);
        this.noResults.emit(args);
      });
      this.graphNetworkComponent.onDataLoaded.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
          // console.log('[GRAPH] onDataLoaded', args);
      });

      this.graphNetworkComponent.renderComplete.pipe(
        takeUntil(this.unsubscribe$),
        takeUntil(this._graphComponentRenderCompleted)
      ).subscribe( (ren: boolean) => {
        this._graphComponentRendered = true;
        this._graphComponentRenderCompleted.next(true);
      });
    }
  }
  /**
   * when the graph component returns no results on its data response
   * this handler is invoked.
   * @param data
   */
  public onNoResults(data: any) {
    // when set to autocollapse on no results
    // collapse tray
    if(this.prefs.entityDetail.hideGraphWhenZeroRelations){
      this.isOpen = false;
    }
  }

  /**
   * initiates a redraw of the graph canvas inside the component
   */
  public reload(entityIds?: string | number | number[] ): void {
    if(this.graph && this.graph.reload && this._graphComponentRendered) {
      this.graph.reload(entityIds);
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph.onPrefsChange(): ', prefs, this.prefs.graph);
    let queryParamChanged = false;
    if(this.maxDegrees != prefs.maxDegreesOfSeparation ||
      this.maxEntities != prefs.maxEntities ||
      this.buildOut != prefs.buildOut){
      // only params that factor in to the API call
      // should trigger full redraw
      queryParamChanged = true;
    }
    this._showMatchKeys = prefs.showMatchKeys;
    this.maxDegrees = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;
    this.buildOut = prefs.buildOut;
    this.dataSourceColors = prefs.dataSourceColors;
    this.dataSourcesFiltered = prefs.dataSourcesFiltered;
    this.neverFilterQueriedEntityIds = prefs.neverFilterQueriedEntityIds;
    this.queriedEntitiesColor = prefs.queriedEntitiesColor;
    if(this.graphNetworkComponent && queryParamChanged) {
      // update graph with new properties
      this.graphNetworkComponent.maxDegrees = this.maxDegrees;
      this.graphNetworkComponent.maxEntities = this.maxEntities;
      this.graphNetworkComponent.buildOut = this.buildOut;
      if(this._graphComponentRendered){
        //console.log('re-rendering graph');
        this.reload( this._graphIds );
      }
    }

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
  // ----------------------  special built-ins for applying colors and filters to nodes in datasources ---------------

  /** function used to generate entity node fill colors from those saved in preferences */
  public get entityNodecolorsByDataSource(): NodeFilterPair[] {
    let _ret = [];
    if(this.dataSourceColors && this.dataSourceColors.reverse) {
      _ret = this.dataSourceColors.reverse().map((dsVal: SzDataSourceComposite) => {
        return {
          selectorFn: this.isEntityNodeInDataSource.bind(this, dsVal.name),
          modifierFn: this.setEntityNodeFillColor.bind(this, dsVal.color),
          selectorArgs: dsVal.name,
          modifierArgs: dsVal.color
        };
      });
    } else if(this.dataSourceColors) {
      // somethings not right, maybe old format
      console.warn('datasource colors not in correct format', this.dataSourceColors);
    }
    //console.warn('entityNodecolorsByDataSource: ', _ret);
    return _ret;
  }
  /** get the list of filters to apply to inner graph component */
  public get entityNodeFilterByDataSource(): NodeFilterPair[] {
    let _ret = [];
    if(this.dataSourcesFiltered) {
      if( this.graph && this.graph.isD3) {
        _ret = this.dataSourcesFiltered.map( (_name) => {
          return {
            selectorFn: this.isEntityNodeInDataSource.bind(this, _name),
            selectorArgs: _name
          };
        });

      } else if (this.graph && this.graph.isKeyLines) {
        // keylines filter is selection inverted
        _ret = [{
          selectorFn: this.isEntityNodeNotInDataSources.bind(this, this.dataSourcesFiltered),
          selectorArgs: this.dataSourcesFiltered
        }];
      }
    } else {
      //console.log('entityNodeFilterByDataSource: ',this._lastFilterConfig, JSON.stringify(_ret));
    }
    return _ret;
  }
  /** get an array of NodeFilterPair to use for highlighting certain graph nodes specific colors */
  public get entityNodeColors(): NodeFilterPair[] {
    const _ret = this.entityNodecolorsByDataSource;
    if( this.queriedEntitiesColor && this.queriedEntitiesColor !== undefined){
      // add special color for active/primary nodes
      _ret.push( {
        selectorFn: this.isEntityNodeInQuery.bind(this),
        modifierFn: this.setEntityNodeFillColor.bind(this, this.queriedEntitiesColor),
        selectorArgs: this.graphIds,
        modifierArgs: this.queriedEntitiesColor
      } );
    }
    return _ret;
  }
  /** used by "entityNodecolorsByDataSource" getter to query nodes as belonging to a datasource */
  private isEntityNodeInDataSource(dataSource, nodeData) {
    // console.log('fromOwners: ', nodeData);
    const _retVal = false;
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return false;
    } else {
      if(nodeData && nodeData.dataSources && nodeData.dataSources.indexOf){
        return nodeData.dataSources.indexOf(dataSource) >= 0;
      } else if (nodeData && nodeData.d && nodeData.d.dataSources && nodeData.d.dataSources.indexOf) {
        return nodeData.d.dataSources.indexOf(dataSource) >= 0;
      } else {
        return false;
      }
    }
  }
  private isEntityNodeInDataSources(dataSources, nodeData) {
    // console.log('fromOwners: ', nodeData);
    console.log('isEntityNodeInDataSources: ', dataSources, nodeData);
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return false;
    } else {
      if(nodeData && nodeData.dataSources && nodeData.dataSources.indexOf){
        // D3 filter query
        return (nodeData.dataSources.some( (dsName) => {
          return dataSources.indexOf(dsName) > -1;
        }));
      } else if (nodeData && nodeData.d && nodeData.d.dataSources && nodeData.d.dataSources.indexOf) {
        return (nodeData.d.dataSources.some( (dsName) => {
            return dataSources.indexOf(dsName) > -1;
        }));
      } else {
        return false;
      }
    }
  }
  private isEntityNodeNotInDataSources(dataSources, nodeData) {
    //console.log('isEntityNodeNotInDataSources: ', dataSources, nodeData);
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return false;
    } else {
      if(nodeData && nodeData.dataSources && nodeData.dataSources.indexOf){
        // D3 filter query
        return !(nodeData.dataSources.some( (dsName) => {
          return dataSources.indexOf(dsName) > -1;
        }));
      } else if (nodeData && nodeData.d && nodeData.d.dataSources && nodeData.d.dataSources.indexOf) {
        return !(nodeData.d.dataSources.some( (dsName) => {
            return dataSources.indexOf(dsName) > -1;
        }));
      } else {
        return false;
      }
    }
  }
  /** checks to see if entity node is one of the primary entities queried for*/
  private isEntityNodeInQuery(nodeData) {
    if(this.graphIds){
      const _dataEntityId = (nodeData && nodeData.d && nodeData.d.entityId) ? (nodeData && nodeData.d && nodeData.d.entityId) : nodeData.entityId ;
      return (_dataEntityId) ? this.graphIds.indexOf( _dataEntityId ) >= 0 : false;
    } else {
      return false;
    }
  }
  /** used by "entityNodecolorsByDataSource" getter to set fill color of nodes in a nodelist */
  private setEntityNodeFillColor(color, nodeList, scope) {
    if (nodeList && nodeList.style) {
      nodeList.style('fill', color);
    } else if ( scope && nodeList instanceof Array && nodeList.every && nodeList.every( (nodeItem) => nodeItem.type === 'node')) {
      const modifierList = nodeList.map((item) => {
        return { id: item.id, c: color };
      });
      if (scope && scope.setProperties) {
        scope.setProperties(modifierList);
      }
    } else {
      console.warn('cannot modify');
    }
  }
}
