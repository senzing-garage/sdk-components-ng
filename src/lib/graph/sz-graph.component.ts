import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SzEntityData, SzEntityIdentifier, SzEntityNetworkData } from '@senzing/rest-api-client-ng';
import { SzGraphControlComponent } from './sz-graph-control.component';
import { SzGraphNodeFilterPair, SzEntityNetworkMatchKeyTokens, SzMatchKeyTokenComposite, SzNetworkGraphInputs, SzMatchKeyTokenFilterScope } from '../models/graph';
import { SzRelationshipNetworkComponent } from './sz-relationship-network/sz-relationship-network.component';
import { parseBool, parseSzIdentifier, sortDataSourcesByIndex } from '../common/utils';
import { SzDataSourceComposite } from '../models/data-sources';
import { SzCSSClassService } from '../services/sz-css-class.service';

/**
 * Embeddable Graph Component
 * used to display a entity and its network relationships
 * to other entities visually.
 *
 * Optionally can display a embedded filter control to allow user
 * to change the components parameters of this component.
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-graph
          filterWidth="320"
          [graphIds]="graphIds"
          [showPopOutIcon]="false"
          [showMatchKeyControl]="false"
          [showFiltersControl]="false"
          [filterControlPosition]="'top-right'"
          (entityClick)="onGraphEntityClick($event)"
          [showLinkLabels]="true"
      ></sz-graph>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-graph
          filter-width="320"
          graph-ids="1,1001,1002"
          show-pop-out-icon="false"
          show-match-key-control="false"
          show-filters-control="false"
          filter-control-position="top-right"
          show-link-labels="true"
      ></sz-wc-graph>
 *
 * @example <!-- (WC) by DOM -->
 * <sz-wc-graph id="sz-wc-standalone-graph"></sz-wc-graph>
 * <script>
 * document.getElementById('sz-wc-graph').graphIds = [1,1001,1002];
 * document.getElementById('sz-wc-graph').addEventListener('entityClick', (data) => { console.log('entity clicked on!', data); })
 * </script>
 */
@Component({
  selector: 'sz-graph',
  templateUrl: './sz-graph.component.html',
  styleUrls: ['./sz-graph.component.scss']
})
export class SzGraphComponent implements OnInit, OnDestroy {
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
  /*
  @Input() public data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }*/
  /** @internal */
  public _showLinkLabels = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set showLinkLabels(value: boolean | string) {
    this._showLinkLabels = parseBool(value);
  };
  /** @internal */
  public _suppressL1InterLinks = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set suppressL1InterLinks(value: boolean | string) {
    this._suppressL1InterLinks = parseBool(value);
  };
  /** @internal */
  private _openInNewTab: boolean = false;
  /** whether or not to open entity clicks in new tab */
  @Input() public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
  };
  /** @internal */
  public _openInSidePanel = false;
  /** whether or not to open entity clicks in side drawer */
  @Input() public set openInSidePanel(value: boolean) {
    this._openInSidePanel = value;
  };
  @Input() sectionIcon: string;
  /** maximum degrees of separation between focal entity and relationships */
  @Input() maxDegrees: number = 1;
  /** @internal */
  private _maxEntities: number = 200;
  /** maximum number of entities that can be returned in a single query */
  @Input() set maxEntities(value: number | string) {
    this._maxEntities = parseInt(value as string);
  }
  /** maximum number of entities that can be returned in a single query */
  get maxEntities(): number {
    return this._maxEntities;
  }
  /** */
  private _expandByDefaultWhenLessThan = 50;
  /** when the result of a graph query contains less than this number all initial
   * entities are displayed
   */
  @Input() public set expandByDefaultWhenLessThan(value: number | string) {
    this._expandByDefaultWhenLessThan = parseInt(value as string)
  }
  /** when the result of a graph query contains less than this number all initial
   * entities are displayed
   */
  public get expandByDefaultWhenLessThan(): number {
    return this._expandByDefaultWhenLessThan;
  }

  /** @internal */
  private _maxEntitiesFilterLimit = 200;
  /** maximum value selectable in the graph filter component */
  @Input() set maxEntitiesFilterLimit(value: number | string){ this._maxEntitiesFilterLimit = parseInt(value as string); }
  /** maximum value selectable in the graph filter component */
  get maxEntitiesFilterLimit(): number { return this._maxEntitiesFilterLimit; }
  /** @internal */
  private _unlimitedMaxEntities: boolean;
  /** @internal */
  private _unlimitedMaxScope: boolean;
  /** ignore the entity limit restriction from maxEntities */
  @Input() set unlimitedMaxEntities(value: boolean) {
    if(value === undefined) return;
    if(value !== this.prefs.graph.unlimitedMaxEntities) {
      this.prefs.graph.unlimitedMaxEntities = value;
    }
    this._unlimitedMaxEntities = value;
  }
  /** ignore the entity limit restriction from maxEntities */
  get unlimitedMaxEntities(): boolean {
    return this.prefs.graph.unlimitedMaxEntities;
  }
  /** ignore the scope limit restriction from maxEntities */
  @Input() set unlimitedMaxScope(value: boolean) {
    if(value === undefined) return;
    if(value !== this.prefs.graph.unlimitedMaxScope) {
      this.prefs.graph.unlimitedMaxScope = this._unlimitedMaxScope;
    }
    this._unlimitedMaxScope  = value;
    //this.prefs.graph.unlimitedMaxScope = value;
  }
  /** ignore the scope limit restriction from maxEntities */
  get unlimitedMaxScope(): boolean {
    return this.prefs.graph.unlimitedMaxScope;
  }
  /* @internal */
  private _buildOut: number = 1;
  /** the level of degrees from focus that the query will attempt to resolve */
  @Input() set buildOut(value: number) {
    this._buildOut = value > 0 ? value : 1;
  }
  /** the level of degrees from focus that the query will attempt to resolve */
  public get buildOut(): number {
    return this._buildOut > 0 ? this._buildOut : 1;
  }
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
  @Input() matchKeysIncluded: string[] = [];
  @Input() matchKeyTokensIncluded: string[] = [];
  @Input() matchKeyCoreTokensIncluded: string[] = [];
  /*
  private _matchKeyTokensIncluded: string[] = [];
  @Input() set matchKeyTokensIncluded(value: string[]) {
    let _applyMatchKeyTokenFilters  = false;
    if(this._matchKeyTokensIncluded && this._matchKeyTokensIncluded.length && value && value.length) {
      if(this._matchKeyTokensIncluded.length !== value.length) {
        _applyMatchKeyTokenFilters = true;
      } else {
        // value is same length
        let _oldValue = JSON.stringify(this._matchKeyTokensIncluded);
        let _newValue = JSON.stringify(value);
        if(_oldValue !== _newValue) {
          _applyMatchKeyTokenFilters = true;
        }
      }
    }
    this._matchKeyTokensIncluded = value;
    if(_applyMatchKeyTokenFilters) {
      console.log('match key tokens changed. force filter reapplication: ', this.matchKeyTokensIncluded);
      this.graph.applyIncludeFilters(this.entityMatchTokenFilter);
    } else {
      console.warn('no change in match key tokens. not updating filters..',JSON.stringify(this._matchKeyTokensIncluded), JSON.stringify(value));
    }
  }
  public get matchKeyTokensIncluded(): string[] {
    return this._matchKeyTokensIncluded;
  }*/
  
  /** @internal */
  private _showPopOutIcon = false;
  /** whether or not to show the pop-out icon */
  @Input() public set showPopOutIcon(value: boolean | string) {
    this._showPopOutIcon = parseBool(value);
  }
  /** whether or not to show the pop-out icon */
  public get showPopOutIcon(): boolean {
    return this._showPopOutIcon;
  }
  /** @internal */
  private _showFiltersControl = false;
  /** whether or not to show the filters drawer */
  @Input() public set showFiltersControl(value: boolean | string) {
    this._showFiltersControl = parseBool(value);
  }
  /** whether or not to show the filters drawer 
   * @returns boolean
  */
  public get showFiltersControl(): boolean | string {
    return this._showFiltersControl;
  }
  @Input() filterControlPosition: string = 'bottom-left';
  /** @internal */
  private _filterWidth: number;
  /** how wide the filters tray is */
  @Input() set filterWidth(value: number | string) {
    if(typeof value == 'string') {
      value = parseInt((value as string));
    }
    this._filterWidth = value;
  }
  private neverFilterQueriedEntityIds: boolean = true;
  public filterShowDataSources: string[];
  public filterShowMatchKeys: string[];
  public filterShowMatchKeyTokens: Array<SzMatchKeyTokenComposite>;
  private _showMatchKeysFilters: boolean      = true;
  private _showMatchKeyTokenFilters: boolean  = false;
  private _showMatchKeyControl: boolean       = true;
  private _showFilterTooltips: boolean        = true;

  /** whether or not to show the [ALL] | [NONE] macro token actions button */
  @Input() public showMatchKeyTokenSelectAll: boolean       = true;

  /** @internal */
  protected _showCoreMatchKeyTokenChips: boolean            = false;
  /**
   * whether or not to show only the match key token chips that apply 
   * to "core" relationships. ie if the relationship is only between 
   * the queried entity and 1 level away relationships. 
   */
  @Input() public set showCoreMatchKeyTokenChips(value: boolean | string){
    this._showCoreMatchKeyTokenChips = parseBool(value);
    if (value === true) {
      //console.log('@senzing/sdk-components-ng/sz-graph-component.showCoreMatchKeyTokenChips = '+ value);
      this.matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.CORE;
    }
  }
  /**
   * whether or not to show only the match key token chips that apply 
   * to "core" relationships. ie if the relationship is only between 
   * the queried entity and 1 level away relationships. 
   */
  public get showCoreMatchKeyTokenChips(): boolean {
    return this._showCoreMatchKeyTokenChips;
  }
  /** @internal */
  protected _showExtraneousMatchKeyTokenChips: boolean = true;
  /**
   * whether or not to show only match key token chips that apply 
   * to relationships between entities that are NOT directly related to 
   * the primary entities. ie if the relationship is only between 
   * a relatiohship between two entities that are not the primary queried 
   * entity. 
   */
  @Input() public set showExtraneousMatchKeyTokenChips(value: boolean | string) {
    this._showExtraneousMatchKeyTokenChips = parseBool(value);
    if (value === true) {
      //console.log('@senzing/sdk-components-ng/sz-graph-component.showExtraneousMatchKeyTokenChips = '+ value);
      this.matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.EXTRANEOUS;
    }
  }
  /**
   * whether or not to show only match key token chips that apply 
   * to relationships between entities that are NOT directly related to 
   * the primary entities. ie if the relationship is only between 
   * a relatiohship between two entities that are not the primary queried 
   * entity. 
   */
  public get showExtraneousMatchKeyTokenChips(): boolean {
    return this._showExtraneousMatchKeyTokenChips;
  }

  /** @internal */
  private _matchKeyTokenSelectionScope: SzMatchKeyTokenFilterScope       = SzMatchKeyTokenFilterScope.EXTRANEOUS;
  /** sets the depth of what entities are shown when they match the 
   * match key token filters. possible values are "CORE" and "EXTRANEOUS".
   * when "CORE" is selected only entities that are directly related to queried 
   * entity/entities are filtered by match key tokens. 
   * when "EXTRANEOUS" is selected ALL entities no matter how they are related 
   * are filtered by match key tokens.
   */
  @Input() public set matchKeyTokenSelectionScope(value: SzMatchKeyTokenFilterScope | string){
    if(value === undefined) return;
    if((value as string) === 'CORE') {
      this._matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.CORE;
    } else if((value as string) === 'EXTRANEOUS') {
      this._matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.EXTRANEOUS;
    } else {
      this._matchKeyTokenSelectionScope = (value as SzMatchKeyTokenFilterScope);
    }
    //console.log(`@senzing/sdk-components-ng/sz-graph-component.matchKeyTokenSelectionScope(${value} | ${(this._matchKeyTokenSelectionScope as unknown as string)})`, this._matchKeyTokenSelectionScope);
  }
  /**
   * get the value of match key token filterings scope. possible values are 
   * "CORE" and "EXTRANEOUS".
   * core means the filtering is only being applied to entities that are directly 
   * related to the primary entity/entities being displayed.
   */
  public get matchKeyTokenSelectionScope() {
    return this._matchKeyTokenSelectionScope as SzMatchKeyTokenFilterScope;
  }
  
  /** whether or not to show match keys toggle control */
  @Input() set showMatchKeyControl(value: boolean | string) {
    this._showMatchKeyControl = parseBool(value);    
  }
  get showMatchKeyControl(): boolean | string {
    return this._showMatchKeyControl;
  }
  @Input() set showMatchKeyFilters(value: boolean | string) {
    this._showMatchKeysFilters = parseBool(value);    
  }
  get showMatchKeyFilters(): boolean | string {
    return this._showMatchKeysFilters;
  }
  @Input() set showMatchKeyTokenFilters(value: boolean | string) {
    this._showMatchKeyTokenFilters = parseBool(value);    
  }
  get showMatchKeyTokenFilters(): boolean | string {
    return this._showMatchKeyTokenFilters;
  }
  @Input() set showFilterTooltips(value: boolean | string) {
    this._showFilterTooltips = parseBool(value);    
  }
  get showFilterTooltips(): boolean | string {
    return this._showFilterTooltips;
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
  @HostBinding('class.showing-link-labels') public get showingLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @HostBinding('class.not-showing-link-labels') public get hidingLinkLabels(): boolean {
    return !this._showLinkLabels;
  }
  @HostBinding('class.showing-inter-link-lines') public get showingInterLinkLines(): boolean {
    return !this._suppressL1InterLinks;
  }
  @HostBinding('class.not-showing-inter-link-lines') public get hidingInterLinkLines(): boolean {
    return this._suppressL1InterLinks;
  }
  

  @ViewChild('graphContainer') graphContainerEle: ElementRef<HTMLDivElement>;
  @ViewChild(SzGraphControlComponent) graphControlComponent: SzGraphControlComponent;
  @ViewChild(SzRelationshipNetworkComponent) graph : SzRelationshipNetworkComponent;

  /**
   * emitted when the user right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick:             EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user right clicks a link line or label between two entities
   * @returns object with various entity and ui properties.
   */
  @Output() relationshipContextMenuClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() relationshipClick:            EventEmitter<any> = new EventEmitter<any>();

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
  @Output() public renderStarted: EventEmitter<boolean> = new EventEmitter<boolean>();
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

  protected _graphIds: SzEntityIdentifier[];
  @Input() public set graphIds(value: Array<SzEntityIdentifier>) {
    const _oVal = this._graphIds;
    this._graphIds = value;
    // only reload graph if value has changed
    if(_oVal !== value){
      // console.log('set graphIds: ', this._graphIds, typeof this.graphIds, value, typeof value);
      this.reload( this._graphIds );
    }
  }
  public get graphIds(): SzEntityIdentifier[] | undefined {
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

  /** event is emitted when the collection of datasources present in graph dislay change*/
  @Output() dataSourcesChange: EventEmitter<any> = new EventEmitter<string[]>();
  /** event is emitted when the graph components data is updated or loaded */
  @Output() dataLoading: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** event is emitted when the graph components data is updated or loaded */
  @Output() dataLoaded: EventEmitter<SzEntityNetworkData> = new EventEmitter<SzEntityNetworkData>();
  /** event is emitted when the graph components data is updated or loaded */
  @Output() dataUpdated: EventEmitter<SzEntityNetworkData> = new EventEmitter<SzEntityNetworkData>();
  /** event is emitted when the collection of matchkeys present in graph dislay change */
  @Output() matchKeysChange: EventEmitter<any> = new EventEmitter<string[]>();
  /** event is emitted when the collection of matchkey tokens present in graph dislay change */
  @Output() matchKeyTokensChange: EventEmitter<any> = new EventEmitter<SzMatchKeyTokenComposite[]>();
  /** event is emitted when a graph pre-flight request is performed */
  @Output() preflightRequestComplete: EventEmitter<any> = new EventEmitter<any>();
  @Output() totalRelationshipsCountUpdated: EventEmitter<number> = new EventEmitter<number>();

  private getMatchKeyTokenComposites(data: SzEntityNetworkMatchKeyTokens): Array<SzMatchKeyTokenComposite> {
    let retVal: Array<SzMatchKeyTokenComposite> = [];
    let _derivedKeys        = Object.keys(data.DERIVED);
    let _disclosedKeys      = Object.keys(data.DISCLOSED)

    /** we use this to get the counts MINUS the core/focal entities(which are always shown) */
    let stripCoreEntityIds = (entityIds: Array<SzEntityIdentifier>): Array<SzEntityIdentifier> => {
      let _retVal = entityIds;
      if(entityIds && entityIds.filter) {
        _retVal = _retVal.filter((_eId) => {
          return  this.graphIds.indexOf( parseSzIdentifier(_eId) ) < 0;
        });
      }
      return _retVal;
    }

    // do derived first
    _derivedKeys.forEach((dKey: string) => {
      let _categoryEntityIds      = data.DERIVED[ dKey ];
      let _coreCategoryEntityIds  = data.CORE && data.CORE.DERIVED && data.CORE.DERIVED[ dKey ] ? data.CORE.DERIVED[ dKey ] : [];
      let _existingKeyPos         = retVal.findIndex((mkComposite: SzMatchKeyTokenComposite) => {
        return mkComposite.name === dKey;
      })
      if(_existingKeyPos < 0) { 
        retVal.push({
          derived: true,
          disclosed: false,
          name: dKey,
          count: stripCoreEntityIds(_categoryEntityIds).length,
          coreCount: stripCoreEntityIds(_coreCategoryEntityIds).length,
          entityIds: _categoryEntityIds,
          coreEntityIds: _coreCategoryEntityIds
        })
      } else {
        // check if it's a core entity
        retVal[_existingKeyPos].coreEntityIds = retVal[_existingKeyPos].coreEntityIds.concat(_coreCategoryEntityIds);
        retVal[_existingKeyPos].entityIds     = retVal[_existingKeyPos].entityIds.concat(_categoryEntityIds);
        retVal[_existingKeyPos].coreCount     = retVal[_existingKeyPos].coreEntityIds.length;
        retVal[_existingKeyPos].count         = retVal[_existingKeyPos].entityIds.length;
      }
    });
    // do disclosed
    _disclosedKeys.forEach((dKey: string) => {
      let _categoryEntityIds      = data.DISCLOSED[ dKey ];
      let _coreCategoryEntityIds  = data.CORE && data.CORE.DISCLOSED && data.CORE.DISCLOSED[ dKey ] ? data.CORE.DISCLOSED[ dKey ] : [];
      let _existingKeyPos         = retVal.findIndex((mkComposite: SzMatchKeyTokenComposite) => {
        return mkComposite.name === dKey;
      })
      if(_existingKeyPos < 0) { 
        retVal.push({
          derived: false,
          disclosed: true,
          name: dKey,
          count: stripCoreEntityIds(_categoryEntityIds).length,
          coreCount: stripCoreEntityIds(_coreCategoryEntityIds).length,
          entityIds: _categoryEntityIds,
          coreEntityIds: _coreCategoryEntityIds
        })
      } else {
        retVal[_existingKeyPos].coreEntityIds = retVal[_existingKeyPos].coreEntityIds.concat(_coreCategoryEntityIds);
        retVal[_existingKeyPos].entityIds     = retVal[_existingKeyPos].entityIds.concat(_categoryEntityIds);
        retVal[_existingKeyPos].coreCount     = retVal[_existingKeyPos].coreEntityIds.length;
        retVal[_existingKeyPos].count         = retVal[_existingKeyPos].entityIds.length;
      }
    });
    return retVal;
  }

  /**
   * on data received by api request and mapped to
   * component input format model. when data has been loaded
   * and parsed build list of distinct datasource names
   * from data.
  */
  public onGraphDataLoaded(inputs: SzNetworkGraphInputs) {
    if(inputs.data && inputs.data.entities) {
      this.filterShowDataSources  = SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(inputs.data);
      let _matchKeyTokens         = SzRelationshipNetworkComponent.getMatchKeyTokensFromEntityData(inputs.data, this.graphIds);
      let matchKeyTokens          = this.getMatchKeyTokenComposites( _matchKeyTokens );
      this.dataSourcesChange.emit( SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(inputs.data) );
      this.clearMatchKeyFilters();
      this.matchKeysChange.emit( SzRelationshipNetworkComponent.getMatchKeysFromEntityNetworkData(inputs.data) )
      this.matchKeyTokensChange.emit( matchKeyTokens );
    }
    if(inputs.data) {
      this.dataLoaded.emit( inputs.data );
    }
  }
  /**
   * when new data has been added to the initial data request
   * through ad-hoc expansion or some other process this handler 
   * is invokes to build list of distinct match key tokens and datasource names
   * from data.
  */
  public onGraphDataUpdated(data: any) {
    if(data && data.entities) { 
      this.filterShowDataSources  = SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(data);
      let _matchKeyTokens         = SzRelationshipNetworkComponent.getMatchKeyTokensFromEntityData(data, this.graphIds);
      let matchKeyTokens          = this.getMatchKeyTokenComposites( _matchKeyTokens );
      this.dataSourcesChange.emit( SzRelationshipNetworkComponent.getDataSourcesFromEntityNetworkData(data) );
      this.matchKeysChange.emit( SzRelationshipNetworkComponent.getMatchKeysFromEntityNetworkData(data) )
      this.matchKeyTokensChange.emit( matchKeyTokens );
      console.log('onGraphDataUpdated: ', _matchKeyTokens, this.filterShowMatchKeyTokens, data);
    }
    if(data) {
      this.dataUpdated.emit( data );
    }
  }

  /** when scale of graph changes, store value for control indicators */
  public onGraphZoom(value) {
    this._graphZoom = value;
  }
  /** zoom in to the graph */
  public zoomIn() {
    this.graph.zoomIn();
  }
  /** zoom out of the graph */
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
        iconType?: string
        index?: number
        isCoreNode?: false
        isQueriedNode?: false
        name?: string
        orgName?: string
        phone?: string
        x?: number
        y?: number
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
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "relationshipContextMenuClick" event.
   * @internal
   */
  public onLinkRightClick(event: any) {
    this.relationshipContextMenuClick.emit( event );
  }
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "relationshipClick" event.
   * @internal
   */
  public onLinkClick(event: any) {
    this.relationshipClick.emit( event );
  }

  /** publish an "popoutClick" event on icon click, pass the entityIds as arg */
  public onPopOutClick(event?: any) {
    // publish event
    this.popoutClick.emit(this.graphIds);
  }

  public onOptionChange(event: {name: string, value: any}) {
    switch(event.name) {
      case 'showLinkLabels':
        this.showLinkLabels = event.value;
        break;
      case 'suppressL1InterLinks':
        this.suppressL1InterLinks = event.value;
        break;
    }
  }

  /** when match keys are loaded in graph view, this handler is invoked to 
   * transfer to filters component list 
   */
  onMatchKeysChange(data: string[]) {
    this.filterShowMatchKeys = data;
  }

  /** when match keys are loaded in graph view, this handler is invoked to 
   * transfer to filters component list 
   */
   onMatchKeyTokensChange(data: SzMatchKeyTokenComposite[]) {
    this.filterShowMatchKeyTokens = data;
  }
  /** when a pre-flight data request is performed this handler is invoked */
  onPreflightRequestComplete(data: any) {
    //console.warn('onPreflightRequestComplete: ', data);
    if(this.maxEntities !== data.maxEntities) {
      this.maxEntities            = data.maxEntities;
      this._maxEntitiesFilterLimit = data.maxEntities;
    }
  }
  onTotalRelationshipsCountUpdated(count: number) {
    if(this.maxEntities !== count) {
      this.maxEntities              = count;
      this._maxEntitiesFilterLimit  = count;
    }
    this.totalRelationshipsCountUpdated.emit(count);
  }

  onDataLoaded(data) {
    console.log('onDataLoaded: ', data);
  }

  onRenderStarted(state) {
    console.log('[STANDALONE GRAPH] onRenderStarted', state);
    this.renderStarted.emit(state);
  }
  onRenderCompleted(state) {
    console.log('[STANDALONE GRAPH] onRenderCompleted', state);
    this.renderComplete.emit(state);
  }
  onRequestCompleted(state) {
    console.log('[STANDALONE GRAPH] onRequestCompleted', state);
    this.renderComplete.emit(state);
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private cssClassesService: SzCSSClassService
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

    // listen for match key changes
    this.matchKeysChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onMatchKeysChange.bind(this) )
    this.matchKeyTokensChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onMatchKeyTokensChange.bind(this) )

    // keep track of whether or not the graph has been rendered
    // this is to get around publishing a new 0.0.7 sdk-graph-components
    // for a simple bugfix to the "rendered" property. There is a property called
    // "rendered" in the component but its not wired in to the lifecycle properly
    if(this.graphNetworkComponent){
      this.graphNetworkComponent.requestStarted.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        //console.log('[STANDALONE GRAPH] requestStarted', args);
        this.requestStarted.emit(args);
      });
      this.graphNetworkComponent.requestComplete.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        //console.log('[STANDALONE GRAPH] requestComplete', args);
        this.requestComplete.emit(args);
      });
      this.graphNetworkComponent.renderComplete.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        //console.log('[STANDALONE GRAPH] renderComplete', args);
        this.renderComplete.emit(args);
      });
      this.graphNetworkComponent.noResults.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        this.requestNoResults.emit(args);
        this.noResults.emit(args);
      });
      this.graphNetworkComponent.onDataLoaded.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
          //console.log('[STANDALONE GRAPH] onDataLoaded', args);
          this.dataLoaded.emit(args.data);
      });
      this.graphNetworkComponent.onDataRequested.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        this.dataLoading.emit(args);
      })
      this.graphNetworkComponent.onPreflightRequestComplete.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (args) => {
        this.preflightRequestComplete.emit(args);
      })

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
  public reload(entityIds?: string | number | SzEntityIdentifier | SzEntityIdentifier[] ): void {
    if(this.graph && this.graph.reload && this._graphComponentRendered) {
      this.graph.reload(entityIds);
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: SzGraphPrefs) {
    //console.log('@senzing/sdk-components-ng/sz-graph-component.onPrefsChange(): ', prefs, this.prefs.graph.toJSONObject());
    let queryParamChanged = false;
    let _oldQueryParams = {maxDegrees: this.maxDegrees, maxEntities: this.maxEntities, buildOut: this.buildOut, unlimitedMaxEntities: this.unlimitedMaxEntities, unlimitedMaxScope: this.unlimitedMaxScope};
    let _newQueryParams = {maxDegrees: prefs.maxDegreesOfSeparation, maxEntities: prefs.maxEntities, buildOut: prefs.buildOut, unlimitedMaxEntities: prefs.unlimitedMaxEntities, unlimitedMaxScope: prefs.unlimitedMaxScope};
    if(
      this.maxDegrees != prefs.maxDegreesOfSeparation || 
      this.unlimitedMaxEntities != prefs.unlimitedMaxEntities || 
      (this.graphNetworkComponent && this.graphNetworkComponent.noMaxEntitiesLimit != prefs.unlimitedMaxEntities) ||
      (
        this.maxEntities != prefs.maxEntities &&
        (
          (this.unlimitedMaxEntities != prefs.unlimitedMaxEntities) || 
          !this.unlimitedMaxEntities
        )
      ) ||
      this.buildOut != prefs.buildOut
    ){
      // only params that factor in to the API call
      // should trigger full redraw
      queryParamChanged = true;

      /*
      console.warn('@senzing/sdk-components-ng/sz-graph-component.onPrefsChange(): query parameter changed!!!',
      this.maxDegrees != prefs.maxDegreesOfSeparation,
      this.maxEntities != prefs.maxEntities, // it's this one triggering when it shouldn't
      this.maxEntities, 
      prefs.maxEntities,
      this.buildOut != prefs.buildOut, 
      this.buildOut, prefs.buildOut, 
      prefs.unlimitedMaxEntities
      );*/
    }
    this.showLinkLabels               = prefs.showLinkLabels;
    this.maxDegrees                   = prefs.maxDegreesOfSeparation;

    // if we have "color" UI prefs add them here
    if(this.graphContainerEle && this.graphContainerEle.nativeElement){
      if(prefs.linkColor) {
        this.graphContainerEle.nativeElement.style.setProperty('--sz-graph-link-line-color', prefs.linkColor);
      }
      if(prefs.indirectLinkColor) {
        this.graphContainerEle.nativeElement.style.setProperty('--sz-graph-link-line-non-focused-color', prefs.indirectLinkColor);
      }
      if(prefs.focusedEntitiesColor) {
        this.graphContainerEle.nativeElement.style.setProperty('--sz-graph-focused-entity-color', prefs.focusedEntitiesColor);
      }
      if(prefs.queriedEntitiesColor) {
        this.graphContainerEle.nativeElement.style.setProperty('--sz-graph-queried-entity-color', prefs.queriedEntitiesColor);
      }
      if(prefs.dataSourceColors && prefs.dataSourceColors.sort) {
        let sorted = Array.from(prefs.dataSourceColors)
        .sort((dsColorEntry1: SzDataSourceComposite, dsColorEntry2: SzDataSourceComposite) => {
          let retVal = dsColorEntry1.index > dsColorEntry2.index ? -1 : (dsColorEntry1.index < dsColorEntry2.index) ? 1 : 0 ;
          return retVal;
        })
        .forEach((dsColorEntry: SzDataSourceComposite) => {
          this.cssClassesService.setStyle(`.sz-node-ds-${dsColorEntry.name.toLowerCase()}`, "fill", dsColorEntry.color);
          this.cssClassesService.setStyle(`.sz-node-ds-${dsColorEntry.name.toLowerCase()} .sz-graph-node-icon`, "fill", dsColorEntry.color);
        })
      }
    }

    if(!prefs.unlimitedMaxEntities) {
      this.maxEntities                = prefs.maxEntities;
    }
    if(!prefs.unlimitedMaxScope) {
      this.buildOut                   = prefs.buildOut;
    }
    this._suppressL1InterLinks        = prefs.suppressL1InterLinks;
    this.unlimitedMaxEntities         = prefs.unlimitedMaxEntities;
    this.unlimitedMaxScope            = prefs.unlimitedMaxScope;
    this.dataSourceColors             = prefs.dataSourceColors;
    this.dataSourcesFiltered          = prefs.dataSourcesFiltered;
    this.matchKeysIncluded            = prefs.matchKeysIncluded;
    this.matchKeyTokensIncluded       = prefs.matchKeyTokensIncluded;
    this.matchKeyCoreTokensIncluded   = prefs.matchKeyCoreTokensIncluded
    this.neverFilterQueriedEntityIds  = prefs.neverFilterQueriedEntityIds;
    // always keep selection scope in sync
    if(this._matchKeyTokenSelectionScope !== prefs.matchKeyTokenSelectionScope) {
      this._matchKeyTokenSelectionScope = prefs.matchKeyTokenSelectionScope;
    }
    if(prefs.queriedEntitiesColor && prefs.queriedEntitiesColor !== undefined && prefs.queriedEntitiesColor !== null) {
      this.queriedEntitiesColor = prefs.queriedEntitiesColor;
    }
    if(this.graphNetworkComponent && queryParamChanged) {
      // update graph with new properties
      this.graphNetworkComponent.maxDegrees           = this.maxDegrees;
      this.graphNetworkComponent.maxEntities          = this.maxEntities;
      this.graphNetworkComponent.buildOut             = this.buildOut;
      this.graphNetworkComponent.noMaxEntitiesLimit   = this.unlimitedMaxEntities;
      this.graphNetworkComponent.noMaxScopeLimit      = this.unlimitedMaxScope;
      if(this._graphComponentRendered){
        console.log('re-rendering graph');
        this.reload( this._graphIds );
      } else {
        //console.log('prefs changed but none of them require re-query.', _oldQueryParams, _newQueryParams, queryParamChanged);
      }
    } else {
      //console.log('prefs changed but no requery', _oldQueryParams, _newQueryParams, queryParamChanged, this._graphComponentRendered);
    }

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
  // ----------------------  special built-ins for applying colors and filters to nodes in datasources ---------------

  /** function used to generate entity node fill colors from those saved in preferences */
  public get entityNodecolorsByDataSource(): SzGraphNodeFilterPair[] {
    let _ret = [];
    if(this.dataSourceColors && this.dataSourceColors.reverse) {
      _ret = this.dataSourceColors.reverse().map((dsVal: SzDataSourceComposite) => {
        return {
          selectorFn: this.isEntityNodeInDataSource.bind(this, true, dsVal.name),
          modifierFn: this.setEntityNodeFillColor.bind(this, dsVal.color),
          selectorArgs: dsVal.name,
          modifierArgs: dsVal.color
        };
      });
    } else if(this.dataSourceColors) {
      // somethings not right, maybe old format
      console.warn('datasource colors not in correct format', this.dataSourceColors);
    }
    return _ret;
  }
  /** get the list of filters to apply to inner graph component */
  public get entityNodeFilters(): SzGraphNodeFilterPair[] {
    let _ret = [];
    if(this.dataSourcesFiltered) {
      if( this.graph && this.graph.isD3) {
        _ret = this.dataSourcesFiltered.map( (_name) => {
          return {
            selectorFn: this.isEntityNodeInDataSource.bind(this, false, _name),
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
    /*
    if(this.matchKeysIncluded) {
      let matchKeyFilters = this.matchKeysIncluded.map((_name) => {
        return {
          selectorFn: this.isMatchKeyInEntityNode.bind(this, _name),
          selectorArgs: _name
        };
      });
      _ret = _ret.concat(matchKeyFilters);
    }*/
    return _ret;
  }
  public get entityMatchFilter(): SzGraphNodeFilterPair {
    let _ret: SzGraphNodeFilterPair;
    if(this.matchKeysIncluded && this.showMatchKeyFilters) {
      //let matchKeyFilters = this.matchKeysIncluded.map((_name) => {
        _ret = {
          selectorFn: this.isMatchKeyInEntityNode.bind(this, this.matchKeysIncluded),
          selectorArgs: this.matchKeysIncluded
        };
      //});
    }
    return _ret;
  }

  public get entityMatchTokenFilter(): SzGraphNodeFilterPair {
    let _ret: SzGraphNodeFilterPair;
    if(this.matchKeyTokensIncluded && this.showMatchKeyTokenFilters) {
      _ret = {
        selectorFn: this.isMatchKeyTokenInEntityNode.bind(this, this.matchKeyCoreTokensIncluded, this.matchKeyTokensIncluded),
        selectorArgs: [this.matchKeyCoreTokensIncluded, this.matchKeyTokensIncluded]
      };
    }
    return _ret;
  }
  

  /** get an array of SzGraphNodeFilterPair to use for highlighting certain graph nodes specific colors */
  public get entityNodeColors(): SzGraphNodeFilterPair[] {
    const _ret = this.entityNodecolorsByDataSource;
    if( this.queriedEntitiesColor && this.queriedEntitiesColor !== undefined && this.queriedEntitiesColor !== null){
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
  protected isEntityNodeInDataSource(isColorQuery, dataSource, nodeData) {
    const _retVal = false;
    const _hasActiveEntColorSet = ( this.queriedEntitiesColor && this.queriedEntitiesColor !== undefined && this.queriedEntitiesColor !== null) ? true : false;

    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0 && 
    ((isColorQuery && _hasActiveEntColorSet) || !isColorQuery)){
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
  protected isEntityNodeInDataSources(dataSources, nodeData) {
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
  protected isEntityNodeNotInDataSources(dataSources, nodeData) {
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
  
  /** @internal */
  private clearMatchKeyFilters() {
    if(this.prefs.graph) {
      // clear out any saved match key filters
      let _previousGraphPrefs = Object.assign({}, this.prefs.graph.toJSONObject());
      this.prefs.graph.bulkSet = true;
      this.prefs.graph.matchKeyCoreTokensIncluded = [];
      this.prefs.graph.matchKeyTokensIncluded     = [];
      this.prefs.graph.bulkSet = false;
      this.prefs.graph.matchKeysIncluded          = [];
      //console.warn('clearMatchKeyFilters()', _previousGraphPrefs, this.prefs.graph.toJSONObject())
    }
  }

  private isMatchKeyInEntityNode(matchKeys?, nodeData?) {
    let retVal = false;
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return true;
    } else {
      if(nodeData && nodeData.relationshipMatchKeys && nodeData.relationshipMatchKeys.indexOf){
        // D3 filter query 
        retVal = (nodeData.relationshipMatchKeys.some( (mkName) => {
          return matchKeys.indexOf(mkName) > -1;
        }));
      }
    }
    //console.log('isMatchKeyInEntityNode: ', matchKeys, nodeData, retVal);
    return retVal;
  }
  private isMatchKeyTokenInEntityNode(coreMatchKeyTokens?, matchKeyTokens?, nodeData?) {

    let retVal = false;
    if(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0){
      return true;
    } else if(coreMatchKeyTokens && this._matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.CORE) {
      if(coreMatchKeyTokens && coreMatchKeyTokens.length === 0) {
        // just hide everything that is 1 lvl deep
        //if(nodeData && (nodeData.isRelatedToPrimaryEntity || nodeData.relatedToPrimaryEntityDirectly || nodeData.isPrimaryEntity) && nodeData.relationshipMatchKeyTokens && nodeData.relationshipMatchKeyTokens.indexOf) {
        if(nodeData && (nodeData.isRelatedToPrimaryEntity || nodeData.relatedToPrimaryEntityDirectly || nodeData.isPrimaryEntity) && nodeData.coreRelationshipMatchKeyTokens && nodeData.coreRelationshipMatchKeyTokens.indexOf) {
          retVal = false;
        } else {
          retVal = true;
        }
        // and show everything else
      } else if(nodeData && (nodeData.isRelatedToPrimaryEntity || nodeData.relatedToPrimaryEntityDirectly || nodeData.isPrimaryEntity) && nodeData.coreRelationshipMatchKeyTokens && nodeData.coreRelationshipMatchKeyTokens.indexOf){
        // D3 filter query 
        retVal = (nodeData.coreRelationshipMatchKeyTokens.some( (tokenName) => {
          return coreMatchKeyTokens.indexOf(tokenName) > -1;
        }));
        //console.log(`isMatchKeyTokenInEntityNode: checking for "${coreMatchKeyTokens}"? ${retVal}`, nodeData.relationshipMatchKeyTokens, );
        //return true;
      } else if(nodeData.relatedToPrimaryEntityDirectly === false) {
        // if it's not directly related to core BUT we're in core match key
        // filtering mode the UI will have no way to select for it
        // and if we're expanding out it will look like nothing happened on expand
        retVal = true;
      }
    } else {
      if(nodeData && nodeData.relationshipMatchKeyTokens && nodeData.relationshipMatchKeyTokens.indexOf){
        // D3 filter query 
        retVal = (nodeData.relationshipMatchKeyTokens.some( (tokenName) => {
          return matchKeyTokens.indexOf(tokenName) > -1;
        }));
        //console.log(`isMatchKeyTokenInEntityNode: checking for "${matchKeyTokens}"? ${retVal}`, nodeData.relationshipMatchKeyTokens);
        //return true;
      }
    }
    /*
    console.log(`isMatchKeyTokenInEntityNode #last: 
    ${(this.neverFilterQueriedEntityIds && this.graphIds.indexOf( nodeData.entityId ) >= 0)} | 
    ${coreMatchKeyTokens ? true : false} | 
    (${this._matchKeyTokenSelectionScope}  ${(coreMatchKeyTokens && this._matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.CORE) ? true : false}) | 
    ${(coreMatchKeyTokens && coreMatchKeyTokens.length === 0)} | 
    ${(nodeData && (nodeData.isRelatedToPrimaryEntity || nodeData.relatedToPrimaryEntityDirectly || nodeData.isPrimaryEntity) && nodeData.relationshipMatchKeyTokens && nodeData.relationshipMatchKeyTokens.indexOf) ? true : false}`, 
    coreMatchKeyTokens, 
    matchKeyTokens, 
    nodeData, 
    retVal);
    */
    return retVal;
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
      // check to see if we can sub-select "circle" filler
      let _icoEnc = nodeList.select('.sz-graph-icon-enclosure');
      if(_icoEnc) {
        _icoEnc.style('fill', color);
      }
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
  /** can a specific entity node be removed from canvas */
  public canRemoveNode(entityId: SzEntityIdentifier) {
    //console.log(`@senzing/sdk-components-ng/sz-graph-component.canRemoveNode: `, entityId);
    return this.graph.canRemoveNode(entityId);
  }
  /** does a specific entity have hidden relationships and are they collapsed */
  public canExpandNode(entityId: SzEntityIdentifier) {
    //console.log(`@senzing/sdk-components-ng/sz-graph-component.canExpandNode: `, entityId);
    return this.graph.canExpandNode(entityId);
  }
  /** 
   * remove single node and any directly related nodes that are 
   * only related to the entity specified.
   */
  public removeNode(entityId: SzEntityIdentifier) {
    console.log(`@senzing/sdk-components-ng/sz-graph-component.removeNode: `, entityId);
    this.graph.removeNode(entityId);
  }
  /** hide all visible(expanded) entities related to a specific entity
   * that are themselves not related to any other visible entities
   */
  public collapseNode(entityId: SzEntityIdentifier) {
    console.log(`@senzing/sdk-components-ng/sz-graph-component.collapseNode: `, entityId);
    this.graph.collapseNode(entityId);
  }
  /** show any entities that are related to a specific entity that are 
   * currently not on the canvas
   */
  public expandNode(entityId: SzEntityIdentifier) {
    console.log(`@senzing/sdk-components-ng/sz-graph-component.expandNode: `, entityId);
    this.graph.expandNode(entityId);
  }
}
