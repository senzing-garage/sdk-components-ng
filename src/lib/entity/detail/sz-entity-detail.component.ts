import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SzSearchService } from '../../services/sz-search.service';
import { tap, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';
import { SzEntityDetailGraphComponent } from './sz-entity-detail-graph/sz-entity-detail-graph.component';

import { SzPrefsService } from '../../services/sz-prefs.service';
import { parseBool } from '../../common/utils';

/**
 * The Entity Detail Component.
 * Generates a complex detail page from input parameters.
 *
 * @example <!-- (Angular) -->
 * <sz-entity-detail
 *   [showGraphMatchKeys]="true"
 *   (entityIdChanged)="entityChangedHandler($event)"
 *   [entityId]="currentlySelectedEntityId"></sz-entity-detail>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-entity-detail
 *   show-graph-match-keys="true"
 *   entity-id="1002"></sz-wc-entity-detail>
 *
 * @example <!-- (WC) by DOM -->
 * <sz-wc-entity-detail id="sz-ent-detail"></sz-wc-entity-detail>
 * <script>
 * document.getElementById('sz-ent-detail').entityId = 1002;
 * document.getElementById('sz-ent-detail').addEventListener('entityIdChanged', (entId) => { console.log('entity id changed!', entId); })
 * </script>
 */
@Component({
  selector: 'sz-entity-detail',
  templateUrl: './sz-entity-detail.component.html',
  styleUrls: ['./sz-entity-detail.component.scss']
})
export class SzEntityDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _entityId: number;
  private entityDetailJSON: string = "";
  private _requestDataOnIdChange = true;

  public entity: SzEntityData;

  // layout enforcers
  /** @internal */
  public _layoutEnforcers: string[] = [''];
  /** @internal */
  public _forceLayout = false;
  /**
   * Takes a collection or a single value of layout enum css classnames to pass
   * to all children components. this value overrides auto-responsive css adjustments.
   *
   * @example forceLayout='layout-narrow'
   *
   * @memberof SzEntityDetailComponent
   */
  @Input() public set forceLayout(value: string | string[]) {
    if(value){
      this._forceLayout = true;
      if(typeof value == 'string'){
        if(value.indexOf(',') > -1){
          this._layoutEnforcers = value.split(',');
        } else {
          this._layoutEnforcers = [value];
        }
      } else {
        this._layoutEnforcers = value;
      }
    }

  }
  /**
   * update prefs values when setter values change.
   * useful when you have multiple component instances but not
   * all of them should be setting prefs state.
   */
  private _updatePrefsOnChange: boolean = true;
  /**
   * update prefs values when setter values change.
   * useful when you have multiple component instances but not
   * all of them should be setting prefs state. OR if you have a specific
   * instance that shouldnt be updating pref state.
   */
  @Input() set updatePrefsOnChange(value: boolean) {
    this._updatePrefsOnChange = value;
  }

  // data views
  _discoveredRelationships: SzRelatedEntity[];
  _disclosedRelationships: SzRelatedEntity[];
  _possibleMatches: SzRelatedEntity[];
  _matches: SzEntityRecord[];

  // show | hide specific sections
  private _showGraphSection: boolean = true;
  private _showMatchesSection: boolean = true;
  private _showPossibleMatchesSection: boolean = true;
  private _showPossibleRelationshipsSection: boolean = true;
  private _showDisclosedSection: boolean = true;
  // collapse or expand specific setions
  private _graphSectionCollapsed: boolean = true;
  private _recordsSectionCollapsed: boolean = false;
  private _possibleMatchesSectionCollapsed: boolean = false;
  private _possibleRelationshipsSectionCollapsed: boolean = false;
  private _disclosedRelationshipsSectionCollapsed: boolean = false;

  /** used for print and pdf support, allows fetching DOM HTMLElement */
  @ViewChild('nativeElementRef') nativeElementRef: ElementRef;
  public get nativeElement(): HTMLElement {
    return this.nativeElementRef.nativeElement;
  }
  @ViewChild(SzEntityDetailGraphComponent)
  public graphComponent: SzEntityDetailGraphComponent;

  /**
   * emitted when the component begins a request for an entities data.
   * @returns entityId of the request being made.
   */
  @Output() requestStart: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when a search is done being performed.
   * @returns the result of the entity request OR an Error object if something went wrong.
   */
  @Output() requestEnd: EventEmitter<SzEntityData|Error> = new EventEmitter<SzEntityData|Error>();
  /**
   * emitted when a search encounters an exception
   * @returns error object.
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();
  /**
   * emmitted when the entity data to display has been changed.
   */
  @Output('dataChanged')
  dataChanged: Subject<SzEntityData> = new Subject<SzEntityData>();
  /**
   * emmitted when the entity id has been changed.
   */
  @Output('entityIdChanged')
  entityIdChanged: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when the user right clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphContextMenuClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityDblClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphPopOutClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphScrollWheelEvent: EventEmitter<any> = new EventEmitter<any>();
  /**
   * Allow users to scroll to zoom the graph area
   */
  @Input() graphAllowScrollingZoom: boolean = false;

  /** what position the pop-out icon should be displayed
   * ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left')
  */
  @Input() graphPopOutIconPosition = 'bottom-left';
  /** show the small 'show match keys' control in the bottom right */
  @Input() graphShowMatchKeyControl = true;
  /** show the pop-out icon control */
  @Input() graphShowPopOutIcon = false;
  /** show the pop-out icon control */
  @Input() graphShowFiltersControl = false;

  /**
   * set the entity data directly, instead of via entityId lookup.
   */
  @Input('data')
  public set entityData(value: SzEntityData) {
    this.entity = value;
    this.onEntityDataChanged();
  }
  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set entityId(value: number) {
    const _hasChanged = (value !== this._entityId) ? true : false;
    this._entityId = value;
    // safety check
    if(_hasChanged && this._requestDataOnIdChange) { this.onEntityIdChange(); }
  }

  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphSection(value: any) {
    this._showGraphSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showGraphSection !== this._showGraphSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showGraphSection = this._showGraphSection;
    }
  }
  public get showGraphSection(): any {
    return this._showGraphSection;
  }
    /**
   * show or hide the "Records" section.
   */
  @Input()
  public set showMatchesSection(value: any) {
    this._showMatchesSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showMatchesSection !== this._showMatchesSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showMatchesSection = this._showMatchesSection;
    }
  }
  public get showMatchesSection(): any {
    return this._showMatchesSection;
  }
    /**
   * show or hide the "Possible Matches" section.
   */
  @Input()
  public set showPossibleMatchesSection(value: any) {
    this._showPossibleMatchesSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showPossibleMatchesSection !== this._showPossibleMatchesSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showPossibleMatchesSection = this._showPossibleMatchesSection;
    }
  }
  public get showPossibleMatchesSection(): any {
    return this._showPossibleMatchesSection;
  }
    /**
   * show or hide the "Possible Relationships" section.
   */
  @Input()
  public set showPossibleRelationshipsSection(value: any) {
    this._showPossibleRelationshipsSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showPossibleRelationshipsSection !== this._showPossibleRelationshipsSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showPossibleRelationshipsSection = this._showPossibleRelationshipsSection;
    }
  }
  public get showPossibleRelationshipsSection(): any {
    return this._showPossibleRelationshipsSection;
  }
    /**
   * show or hide the "Disclosed Relationships" section.
   */
  @Input()
  public set showDisclosedSection(value: any) {
    this._showDisclosedSection = parseBool(value);
    // update pref from setter
    if(this.prefs.entityDetail.showDisclosedSection !== this._showDisclosedSection && this._updatePrefsOnChange){
      this.prefs.entityDetail.showDisclosedSection = this._showDisclosedSection;
    }
  }
  public get showDisclosedSection(): any {
    return this._showDisclosedSection;
  }


  /** there is a use case where we dont want to show name data, like when it's already listing names in the headers */
  private _showBestNameOnlyInMatchesSection               = false;
  private _showBestNameOnlyInDisclosedSection             = this._showBestNameOnlyInMatchesSection;
  private _showBestNameOnlyInPossibleMatchesSection       = this._showBestNameOnlyInMatchesSection;
  private _showBestNameOnlyInPossibleRelationshipsSection = this._showBestNameOnlyInMatchesSection;
  private _showNameDataInMatchesSection                   = true;
  private _showNameDataInDisclosedSection                 = this._showNameDataInMatchesSection;
  private _showNameDataInPossibleMatchesSection           = this._showNameDataInMatchesSection;
  private _showNameDataInPossibleRelationshipsSection     = this._showNameDataInMatchesSection;
  private _showOtherDataInMatchesSection                  = false;
  private _showOtherDataInDisclosedSection                = this._showOtherDataInMatchesSection;
  private _showOtherDataInPossibleMatchesSection          = this._showOtherDataInMatchesSection;
  private _showOtherDataInPossibleRelationshipsSection    = this._showOtherDataInMatchesSection;

  @Input()
  public set showBestNameOnlyInMatchesSection(value: any)                 { this._showBestNameOnlyInMatchesSection = parseBool(value);}
  public get showBestNameOnlyInMatchesSection(): any                      { return this._showBestNameOnlyInMatchesSection; }
  @Input()
  public set showBestNameOnlyInDisclosedSection(value: any)               { this._showBestNameOnlyInDisclosedSection = parseBool(value);}
  public get showBestNameOnlyInDisclosedSection(): any                    { return this._showBestNameOnlyInDisclosedSection; }
  @Input()
  public set showBestNameOnlyInPossibleMatchesSection(value: any)         { this._showBestNameOnlyInPossibleMatchesSection = parseBool(value);}
  public get showBestNameOnlyInPossibleMatchesSection(): any              { return this._showBestNameOnlyInPossibleMatchesSection; }
  @Input()
  public set showBestNameOnlyInPossibleRelationshipsSection(value: any)   { this._showBestNameOnlyInPossibleRelationshipsSection = parseBool(value);}
  public get showBestNameOnlyInPossibleRelationshipsSection(): any        { return this._showBestNameOnlyInPossibleRelationshipsSection; }

  @Input()
  public set showNameDataInMatchesSection(value: any)                     { this._showNameDataInMatchesSection = parseBool(value);}
  public get showNameDataInMatchesSection(): any                          { return this._showNameDataInMatchesSection; }
  @Input()
  public set showNameDataInDisclosedSection(value: any)                   { this._showNameDataInDisclosedSection = parseBool(value);}
  public get showNameDataInDisclosedSection(): any                        { return this._showNameDataInDisclosedSection; }
  @Input()
  public set showNameDataInPossibleMatchesSection(value: any)             { this._showNameDataInPossibleMatchesSection = parseBool(value);}
  public get showNameDataInPossibleMatchesSection(): any                  { return this._showNameDataInPossibleMatchesSection; }
  @Input()
  public set showNameDataInPossibleRelationshipsSection(value: any)       { this._showNameDataInPossibleRelationshipsSection = parseBool(value);}
  public get showNameDataInPossibleRelationshipsSection(): any            { return this._showNameDataInPossibleRelationshipsSection; }

  @Input()
  public set showOtherDataInMatchesSection(value: any)                    { this._showOtherDataInMatchesSection = parseBool(value);}
  public get showOtherDataInMatchesSection(): any                         { return this._showOtherDataInMatchesSection; }
  @Input()
  public set showOtherDataInDisclosedSection(value: any)                  { this._showOtherDataInDisclosedSection = parseBool(value);}
  public get showOtherDataInDisclosedSection(): any                       { return this._showOtherDataInDisclosedSection; }
  @Input()
  public set showOtherDataInPossibleMatchesSection(value: any)            { this._showOtherDataInPossibleMatchesSection = parseBool(value);}
  public get showOtherDataInPossibleMatchesSection(): any                 { return this._showOtherDataInPossibleMatchesSection; }
  @Input()
  public set showOtherDataInPossibleRelationshipsSection(value: any)      { this._showOtherDataInPossibleRelationshipsSection = parseBool(value);}
  public get showOtherDataInPossibleRelationshipsSection(): any           { return this._showOtherDataInPossibleRelationshipsSection; }

  /**
   * collapse or expand the "At a Glance" section.
   */
  @Input()
  public set graphSectionCollapsed(value: any) {
    this._graphSectionCollapsed = parseBool(value);
  }
  public get graphSectionCollapsed(): any {
    return this._graphSectionCollapsed;
  }
    /**
   * show or hide the "Records" section.
   */
  @Input()
  public set recordsSectionCollapsed(value: any) {
    this._recordsSectionCollapsed = parseBool(value);
  }
  public get recordsSectionCollapsed(): any {
    return this._recordsSectionCollapsed;
  }
    /**
   * show or hide the "Possible Matches" section.
   */
  @Input()
  public set possibleMatchesSectionCollapsed(value: any) {
    this._possibleMatchesSectionCollapsed = parseBool(value);
  }
  public get possibleMatchesSectionCollapsed(): any {
    return this._possibleMatchesSectionCollapsed;
  }
    /**
   * show or hide the "Possible Relationships" section.
   */
  @Input()
  public set possibleRelationshipsSectionCollapsed(value: any) {
    this._possibleRelationshipsSectionCollapsed = parseBool(value);
  }
  public get possibleRelationshipsSectionCollapsed(): any {
    return this._possibleRelationshipsSectionCollapsed;
  }
    /**
   * show or hide the "Disclosed Relationships" section.
   */
  @Input()
  public set disclosedRelationshipsSectionCollapsed(value: any) {
    this._disclosedRelationshipsSectionCollapsed = parseBool(value);
  }
  public get disclosedRelationshipsSectionCollapsed(): any {
    return this._disclosedRelationshipsSectionCollapsed;
  }

  public _graphTitle: string = "Relationships at a Glance";
  /**
   * graph section title
   */
  @Input()
  public set graphTitle(value: string) {
    this._graphTitle = value;
  }
  /**
   * graph section title
   */
  public get graphTitle() {
    return this._graphTitle;
  }

  public _showGraphMatchKeys: boolean = true;
  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphMatchKeys(value: any) {
    this._showGraphMatchKeys = parseBool(value);
  }
  /**
   * whether or not the graph component is displaying match keys
   */
  public get showGraphMatchKeys() {
    if(this.graphComponent && this.graphComponent.graphControlComponent && this.graphComponent.graphControlComponent.showLinkLabels) {
      return this.graphComponent.graphControlComponent.showLinkLabels;
    } else {
      return this._showGraphMatchKeys;
    }
  }


  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set requestDataOnIdChange(value: any) {
    this._requestDataOnIdChange = parseBool(value);
  }

  /**
   * Gets the data in the model shape used by the relationship network graph.
   */
  public get graphData() {
    if(!this.entity || this.entity == null) {
      return;
    }
    return {
      resolvedEntity: this.entity.resolvedEntity,
      relatedEntities: this.entity.relatedEntities
    };
  }

  /**
   * Get the entity Id of the current entity being displayed.
   */
  public get entityId(): number {
    return this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.entityId ? this.entity.resolvedEntity.entityId : this._entityId;
  }

  /**
   * A list of the search results that are matches.
   * @readonly
   */
  public get matches(): SzEntityRecord[] {
    return this.entity && this.entity.resolvedEntity.records ? this.entity.resolvedEntity.records : undefined;
  }
  /**
   * A list of the search results that are possible matches.
   *
   * @readonly
   */
  public get possibleMatches(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   */
  public get discoveredRelationships(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   */
  public get disclosedRelationships(): SzRelatedEntity[] {

    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    }) : undefined;
  }

  constructor(
    private searchService: SzSearchService,
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // show or hide sections based on pref change
    if(this._updatePrefsOnChange){
      // if were not saving prefs then do not initialize with values
      this.showGraphSection = this.prefs.entityDetail.showGraphSection;
      this.showMatchesSection = this.prefs.entityDetail.showMatchesSection;
      this.showPossibleMatchesSection = this.prefs.entityDetail.showPossibleMatchesSection;
      this.showPossibleRelationshipsSection = this.prefs.entityDetail.showPossibleRelationshipsSection;
      this.showDisclosedSection = this.prefs.entityDetail.showDisclosedSection;
    }
    // get and listen for prefs change
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => this._updatePrefsOnChange ),
    ).subscribe( this.onPrefsChange.bind(this) );
  }


  ngAfterViewInit() {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    // show or hide sections based on pref change
    this.showGraphSection = prefs.showGraphSection;
    this.showMatchesSection = prefs.showMatchesSection;
    this.showPossibleMatchesSection = prefs.showPossibleMatchesSection;
    this.showPossibleRelationshipsSection = prefs.showPossibleRelationshipsSection;
    this.showDisclosedSection = prefs.showDisclosedSection;

    // collapse or expand specific setions
    this.graphSectionCollapsed = prefs.graphSectionCollapsed;
    this.recordsSectionCollapsed = prefs.recordsSectionCollapsed;
    this.possibleMatchesSectionCollapsed = prefs.possibleMatchesSectionCollapsed;
    this.possibleRelationshipsSectionCollapsed = prefs.possibleRelationshipsSectionCollapsed;
    this.disclosedRelationshipsSectionCollapsed = prefs.disclosedRelationshipsSectionCollapsed;

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  /**
   * after entity data has been changed, regenerate the filtered lists.
   *  matches, possible matches, possible relationships, and disclosed relationships.
   */
  private onEntityDataChanged() {
    // doing the set on these manually because pulling directly from setter(s)
    // causes render change cycle to break mem and hammer redraw
    if(this.entity && this.entity.resolvedEntity.records) this._matches = this.entity.resolvedEntity.records;
    if(this.entity && this.entity.relatedEntities.filter) this._possibleMatches = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    });
    if(this.entity && this.entity.relatedEntities.filter) this._discoveredRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    });
    if(this.entity && this.entity.relatedEntities.filter) this._disclosedRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    });
    // redraw graph on entity change
    if(this.graphComponent && this.graphComponent.reload) {
      this.graphComponent.reload(this.entityId);
    }
    this.dataChanged.next(this.entity);
  }

  /**
   * internal handler for when a entity record displayed inside of widget is
   * clicked on.
   */
  public onEntityRecordClick(entityId: number): void {
    this.entityId = entityId;
  }
  /**
   * proxies internal graph component entity click to "graphEntityClick" event.
   */
  public onGraphEntityClick(event: any) {
    this.graphEntityClick.emit(event);
  }
  /**
   * proxies internal graph component entity double click to "graphEntityDblClick" event.
   */
  public onGraphEntityDblClick(event: any) {
    this.graphEntityDblClick.emit(event);
  }
  /**
   * proxies internal graph component entity right-click to "graphContextMenuClick" event.
   */
  public onGraphRightClick(event: any) {
    this.graphContextMenuClick.emit(event);
  }
  /**
   * proxies internal graph component pop-out click to "graphPopOutClick" event.
   */
  public onGraphPopoutClick(event: any) {
    this.graphPopOutClick.emit(event);
  }

  public onSectionCollapsedChange(prefsKey: string, isCollapsed: boolean) {
    // console.log('SzEntityDetailComponent.onSectionCollapsedChange: ', prefsKey, isCollapsed);
    if( prefsKey && this.prefs.entityDetail) {
      this.prefs.entityDetail[prefsKey] = isCollapsed;
    }
    /*
    private _graphSectionCollapsed: boolean = true;
    private _recordsSectionCollapsed: boolean = false;
    private _possibleMatchesSectionCollapsed: boolean = false;
    private _possibleRelationshipsSectionCollapsed: boolean = false;
    private _disclosedRelationshipsSectionCollapsed: boolean = false;
    */
  }

  /**
   * when entityId property is changed, request the data from the api
   * and display the result.
   *
   * @memberof SzEntityDetailComponent
   */
  public onEntityIdChange() {
    this.entityIdChanged.emit(this._entityId);

    if (this._entityId) {
      this.requestStart.emit(this._entityId);

      this.searchService.getEntityById(this._entityId, true).
      pipe(
        tap(res => console.log('SzSearchService.getEntityById: ' + this._entityId, res))
      ).
      subscribe((entityData: SzEntityData) => {
        // console.log('sz-entity-detail.onEntityIdChange: ', entityData);
        this.entityDetailJSON = JSON.stringify(entityData, null, 4);
        this.entity = entityData;
        this.onEntityDataChanged();
        this.requestEnd.emit( entityData );
        this.dataChanged.next( entityData );
      }, (err)=> {
        this.requestEnd.emit( err );
        this.exception.next( err );
      });
    }
  }

}
