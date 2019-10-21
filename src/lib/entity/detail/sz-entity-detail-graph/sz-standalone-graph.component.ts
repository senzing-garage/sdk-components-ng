import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';
import { SzEntityDetailGraphControlComponent } from './sz-entity-detail-graph-control.component';
import { SzEntityDetailGraphFilterComponent } from './sz-entity-detail-graph-filter.component';
import { SzRelationshipNetworkComponent, NodeFilterPair } from '@senzing/sdk-graph-components';
/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-standalone-graph',
  templateUrl: './sz-standalone-graph.component.html',
  styleUrls: ['./sz-standalone-graph.component.scss']
})
export class SzStandaloneGraphComponent implements OnInit, OnDestroy {
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
   * @internal
   */
  @ViewChild(SzRelationshipNetworkComponent) graphNetworkComponent: SzRelationshipNetworkComponent;

  @Input() public title: string = "Relationships at a Glance";
  /*
  @Input() public data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }*/
  public _showMatchKeys = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
  };
  private _openInNewTab: boolean = false;
  /** whether or not to open entity clicks in new tab */
  @Input() public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
  };
  public _openInSidePanel = false;
  /** whether or not to open entity clicks in side drawer */
  @Input() public set openInSidePanel(value: boolean) {
    this._openInSidePanel = value;
  };
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 1;
  @Input() maxEntities: number = 20;
  @Input() buildOut: number = 1;
  @Input() dataSourceColors: any = {};
  @Input() dataSourcesFiltered: string[] = [];
  @Input() showPopOutIcon: boolean = false;
  @Input() showFiltersControl: boolean = false;
  @Input() filterControlPosition: string = 'bottom-left';
  private neverFilterQueriedEntityIds: boolean = true;
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
  /** the position of the pop-out icon ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left') */
  @Input() popOutIconPosition: string = 'bottom-left';
  @Input() public queriedEntitiesColor;

  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  get expanded(): boolean {
    return this.isOpen;
  }

  //@HostBinding('class.open') get cssClssOpen() { return this.expanded; };
  //@HostBinding('class.closed') get cssClssClosed() { return !this.expanded; };
  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  @ViewChild(SzEntityDetailGraphControlComponent) graphControlComponent: SzEntityDetailGraphControlComponent;
  @ViewChild(SzRelationshipNetworkComponent) graph : SzRelationshipNetworkComponent;

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

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

  private _graphIds: number[];
  @Input() public set graphIds(value: number[]) {
    let _oVal = this._graphIds;
    let _valChanged = false;
    this._graphIds = value;
    // only reload graph if value has changed
    if(_oVal !== value){
      console.log('set graphIds: ', this._graphIds, typeof this.graphIds, value, typeof value);
      this.reload();
    }
  };
  public get graphIds(): number[] | undefined {
    return this._graphIds;
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
        iconType?: string
        index?: number
        isCoreNode?: false
        isQueriedNode?: false
        name?: string
        orgName?: string
        phone?: string
        x?: number
        y?: number
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: evtModel = Object.assign({}, event);
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
    switch(event.name) {
      case 'showLinkLabels':
        this.showMatchKeys = event.value;
        break;
    }
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
    })
    */

    // keep track of whether or not the graph has been rendered
    // this is to get around publishing a new 0.0.7 sdk-graph-components
    // for a simple bugfix to the "rendered" property. There is a property called
    // "rendered" in the component but its not wired in to the lifecycle properly
    if(this.graphNetworkComponent){
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
  public reload(): void {
    if(this.graph && this.graph.reload && this._graphComponentRendered) {
      this.graph.reload();
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    //console.log('@senzing/sdk-components-ng/sz-standalone-graph.onPrefsChange(): ', prefs, this.prefs.graph);
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
        this.reload();
      }
    }

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
  // ----------------------  special built-ins for applying colors and filters to nodes in datasources ---------------

  /** function used to generate entity node fill colors from those saved in preferences */
  public get entityNodecolorsByDataSource(): NodeFilterPair[] {
    var _ret = [];
    if(this.dataSourceColors) {
      var _keys = Object.keys(this.dataSourceColors);
      _ret = _keys.map( (_key) => {
        var _color = this.dataSourceColors[_key];
        return {
          selectorFn: this.isEntityNodeInDataSource.bind(this, _key),
          modifierFn: this.setEntityNodeFillColor.bind(this, _color)
        }
      })
    }
    return _ret;
  }
  /** get the list of filters to apply to inner graph component */
  public get entityNodeFilterByDataSource(): NodeFilterPair[] {
    var _ret = [];
    if(this.dataSourcesFiltered) {
      _ret = this.dataSourcesFiltered.map( (_name) => {
        return {
          selectorFn: this.isEntityNodeInDataSource.bind(this, _name)
        }
      })
    }
    return _ret;
  }
  /** get an array of NodeFilterPair to use for highlighting certain graph nodes specific colors */
  public get entityNodeColors(): NodeFilterPair[] {
    var _ret = this.entityNodecolorsByDataSource;
    if( this.queriedEntitiesColor && this.queriedEntitiesColor !== undefined){
      // add special color for active/primary nodes
      _ret.push( {
        selectorFn: this.isEntityNodeInQuery.bind(this),
        modifierFn: this.setEntityNodeFillColor.bind(this, this.queriedEntitiesColor)
      } );
    }
    return _ret;
  }
  /** used by "entityNodecolorsByDataSource" getter to query nodes as belonging to a datasource */
  private isEntityNodeInDataSource(dataSource, nodeData) {
    // console.log('fromOwners: ', nodeData);
    let _retVal = false;
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return false;
    } else {
      if(nodeData && nodeData.dataSources && nodeData.dataSources.indexOf){
        return nodeData.dataSources.indexOf(dataSource) >= 0;
      } else {
        return false;
      }
    }
  }
  /** checks to see if entity node is one of the primary entities queried for*/
  private isEntityNodeInQuery(nodeData) {
    if(this.graphIds){
      return this.graphIds.indexOf( nodeData.entityId ) >= 0;
    } else {
      return false;
    }
  }
  /** used by "entityNodecolorsByDataSource" getter to set fill color of nodes in a nodelist */
  private setEntityNodeFillColor(color, nodeList) {
    if(nodeList && nodeList.style){
      nodeList.style('fill', color);
    }
  }
}
