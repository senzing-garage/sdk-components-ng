import { Component, HostBinding, Input, OnInit, AfterViewInit, 
  OnDestroy, Output, EventEmitter, ChangeDetectorRef, ViewChild, TemplateRef, 
  ViewContainerRef } from '@angular/core';
import { SzPrefsService, SzSdkPrefsModel } from '../services/sz-prefs.service';
import { SzDataSourcesService } from '../services/sz-datasources.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, UntypedFormControl, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { SzDataSourceComposite } from '../models/data-sources';
import { SzMatchKeyComposite, SzMatchKeyTokenComposite, SzMatchKeyTokenFilterScope } from '../models/graph';
import { sortDataSourcesByIndex, parseBool, sortMatchKeysByIndex, sortMatchKeyTokensByIndex } from '../common/utils';
import { isBoolean } from '../common/utils';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-graph-filter>
 *
 * @example
 * <!-- (WC) -->
 * <sz-wc-graph-filters id="sz-graph-filter"></sz-wc-graph-filters>
 * <script>
 * document.getElementById('sz-wc-graph-filters').addEventListener('optionChanged', function(data) { console.log('filter(s) changed', data); });
 * </script>
 */
@Component({
  selector: 'sz-graph-filter',
  templateUrl: './sz-graph-filter.component.html',
  styleUrls: ['./sz-graph-filter.component.scss']
})
export class SzGraphFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * used for displaying tooltips above all other page content 
   * @internal */
  overlayRef: OverlayRef | undefined;

  isOpen: boolean = true;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** private list of datasource records augmented by SzDataSourceComposite shape 
   * @internal
  */
  private _dataSources: SzDataSourceComposite[]               = [];
  private _matchKeys: SzMatchKeyComposite[]                   = [];
  private _matchKeyTokens: SzMatchKeyTokenComposite[]         = [];

  // ----------- tooltip related
  /** @internal */
  @ViewChild('tooltip') tooltip: TemplateRef<any>;
  /** @internal */
  private _tooltipSubCloseTimer;
  /** @internal */
  private _tooltipLastMessageShown: string;
  /** @internal */
  private _showTooltips: boolean = true;
  /** whether or not to show tooltip hints */
  @Input() set showTooltips(value: boolean | string) {
    this._showTooltips = parseBool(value);
  }
  /** whether or not to show tooltip hints */
  get showTooltips(): boolean {
    return this._showTooltips;
  }

  /** private list of SzDataSourceComposite as stored in local storage 
   * @internal
  */
  private _dataSourceColors: SzDataSourceComposite[]  = [];

  @Input() maxDegreesOfSeparation: number = 1;
  @Input() showMaxDegreesOfSeparation: boolean = false;
  private _maxEntities: number = 200;
  @Input() set maxEntities(value: number | string) {
    this._maxEntities = parseInt(value as string);
  }
  get maxEntities(): number {
    return this._maxEntities;
  }
  private _maxEntitiesLimit: number = 200;
  @Input() set maxEntitiesLimit(value: number | string) {
    this._maxEntitiesLimit = parseInt(value as string);
  }
  public get maxEntitiesLimit(): number { return this._maxEntitiesLimit; }
  public get maxEntitiesValueLabel(): string {
    let retVal = this.prefs.graph.unlimitedMaxEntities ? 'unlimited' : this.maxEntities.toString();
    return retVal;
  }

  @Input() set unlimitedMaxEntities(value: boolean | string) {
    if(value === undefined) return;
    this.prefs.graph.unlimitedMaxEntities = parseBool(value);
  }
  get unlimitedMaxEntities(): boolean {
    return this.prefs.graph.unlimitedMaxEntities;
  }
  @Input() set unlimitedMaxScope(value: boolean | string) {
    if(value === undefined) return;
    if(this.prefs.graph.unlimitedMaxScope !== parseBool(value)) {
      this.prefs.graph.unlimitedMaxScope = parseBool(value);
    }
  }
  get unlimitedMaxScope(): boolean {
    return this.prefs.graph.unlimitedMaxScope;
  }
  public onMaxEntitiesValueChange(value) {
    console.log('onMaxEntitiesValueChange: ', value);
  }
  @Input() showMaxEntities: boolean = true;
  @Input() buildOut: number = 1;
  @Input() buildOutMin: number = 0;
  @Input() buildOutMax: number = 5;
  @Input() showDataSources: string[];
  @Input() public set showMatchKeys(value: string[]) {
    //console.log('showMatchKeys.set()', value, Object.keys(this.filterByMatchKeysForm.controls), (<FormArray>this.filterByMatchKeysForm.get('matchkeys')));
    if(value && value.map && value !== undefined) {
      this._matchKeys = value.map((strMatchKey: string, ind: number) => {
        return {
          'name': strMatchKey,
          'index': ind,
          'hidden': false
        }
      });
      this.initializeMatchKeysFormControls();
    }
  }
  public get showMatchKeys(): string[] {
    let retVal;
    if(this._matchKeys && this._matchKeys.length) {
      retVal = this._matchKeys.map((mkComposite) => {
        return mkComposite.name;
      });
    }
    return retVal;
  }
  @Input() public set showMatchKeyTokens(value: Array<SzMatchKeyTokenComposite>) {
    //console.log('showMatchKeyTokens.set()', value);
    if(value && value.map && value !== undefined) {
      this._matchKeyTokens = value.map((matchKeyComposite: SzMatchKeyTokenComposite, ind: number) => {
        return Object.assign(matchKeyComposite, {
          'index': ind,
          'hidden': false
        });
      });
      //this.initializeMatchKeyTokenFormControls();
    }
  }
  public get showMatchKeyTokens(): Array<SzMatchKeyTokenComposite> {
    let retVal;
    if(this._matchKeyTokens && this._matchKeyTokens.length) {
      retVal = this._matchKeyTokens.map((mkComposite) => {
        return mkComposite.name;
      });
    }
    return retVal;
  }
  private _showMatchKeysFilters: boolean = true;
  @Input() public set showMatchKeyFilters(value: boolean | string) {
    this._showMatchKeysFilters = parseBool(value);    
  }
  public get showMatchKeyFilters(): boolean | string {
    return this._showMatchKeysFilters;
  }
  private _showMatchKeyTokenFilters: boolean = true;
  @Input() public set showMatchKeyTokenFilters(value: boolean | string) {
    this._showMatchKeyTokenFilters = parseBool(value);    
  }
  public get showMatchKeyTokenFilters(): boolean | string {
    return this._showMatchKeyTokenFilters;
  }
  /** @internal */
  private _matchKeyTokenSelectionScope: SzMatchKeyTokenFilterScope = SzMatchKeyTokenFilterScope.EXTRANEOUS;
  /** @internal */
  private _onMatchKeyTokenSelectionScopeChange        = new Subject<SzMatchKeyTokenFilterScope>();
  /** when the user changes the scope of the match keys selected this event is published */
  public onMatchKeyTokenSelectionScopeChange          = this._onMatchKeyTokenSelectionScopeChange.asObservable();
  /** when the user changes the scope of the match keys selected this event is published */
  @Output() public matchKeyTokenSelectionScopeChanged = new EventEmitter<SzMatchKeyTokenFilterScope>();

  /** sets the depth of what entities are shown when they match the 
   * match key token filters. possible values are "CORE" and "EXTRANEOUS".
   * when "CORE" is selected only entities that are directly related to queried 
   * entity/entities are filtered by match key tokens. 
   * when "EXTRANEOUS" is selected ALL entities no matter how they are related 
   * are filtered by match key tokens.
   */
  @Input() public set matchKeyTokenSelectionScope(value: SzMatchKeyTokenFilterScope | string) {
    switch((value as string)) {
      case 'CORE':
        this._matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.CORE;
        break;
      case 'EXTRANEOUS':
        this._matchKeyTokenSelectionScope = SzMatchKeyTokenFilterScope.EXTRANEOUS;
        break;
      default:
        // assume it's already cast correctly
        this._matchKeyTokenSelectionScope = (value as SzMatchKeyTokenFilterScope);
    }
    console.log(`@senzing/sdk-components-ng/sz-graph-filter.matchKeyTokenSelectionScope(${value} | ${(this._matchKeyTokenSelectionScope as unknown as string)})`, this._matchKeyTokenSelectionScope);
  }
  /**
   * get the value of match key token filterings scope. possible values are 
   * "CORE" and "EXTRANEOUS".
   * core means the filtering is only being applied to entities that are directly 
   * related to the primary entity/entities being displayed.
   */
  public get matchKeyTokenSelectionScope(): SzMatchKeyTokenFilterScope | string {
    return this._matchKeyTokenSelectionScope;
  }
  public get isMatchKeyTokenSelectionScopeCore(): boolean {
    return this._matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.CORE ? true : false;
  }

  @Input() public showMatchKeyTokenSelectAll: boolean       = true;
  private _showCoreMatchKeyTokenChips: boolean       = false;
  @Input() public set showCoreMatchKeyTokenChips(value: boolean) {
    this._showCoreMatchKeyTokenChips = value;
    console.log(`@senzing/sdk-components-ng/sz-graph-filter.showCoreMatchKeyTokenChips(${value})`, this._showCoreMatchKeyTokenChips);
  }
  public get showCoreMatchKeyTokenChips(): boolean {
    return this._showCoreMatchKeyTokenChips;
  }
  @Input() public showExtraneousMatchKeyTokenChips: boolean = true;

  @Input() dataSourcesFiltered: string[]        = [];
  @Input() matchKeysIncluded: string[]          = [];
  @Input() matchKeyTokensIncluded: string[]     = [];
  @Input() matchKeyCoreTokensIncluded: string[] = [];
  @Input() queriedEntitiesColor: string;
  @Input() linkColor: string;
  @Input() indirectLinkColor: string;

  /** 
   * set the internal list of datasource colors from local storage or input value
   * and update any changed members also present in "_dataSources" with 
   * current properties
   */
  @Input() set dataSourceColors(value: SzDataSourceComposite[]) {
    // update value
    this._dataSourceColors  = value;
    // update any values in composites list
    if(this._dataSources && this._dataSources.map) {
      let tempDsFull = this._dataSources.map( (dsVal: SzDataSourceComposite) => {
        // check to see if datasource has entry in value
        let dsColorValueByName = value.find((dsColorValue: SzDataSourceComposite) => {
          return dsColorValue.name === dsVal.name;
        })
        if(dsColorValueByName) {
          dsVal.color = dsColorValueByName.color;
          dsVal.index = dsColorValueByName.index; // pull this out once we make this more granular
        }
        return dsVal;
      });
      this._dataSources = tempDsFull;
    }
  }
  /** get list of  "SzDataSourceComposite" reflecting current state of datasource colors and order. ordered ASC by "index" */
  get dataSourceColors(): SzDataSourceComposite[] {
    let retVal: SzDataSourceComposite[] = this._dataSources;
    retVal = sortDataSourcesByIndex(retVal);
    return retVal;
  }
  /** get list of  "SzDataSourceComposite" reflecting datasources pulled from API and augmented with state information in shape of "SzDataSourceComposite". ordered ASC by "index" */
  public get dataSources(): SzDataSourceComposite[] {
    let retVal: SzDataSourceComposite[] = this._dataSources;
    retVal = sortDataSourcesByIndex(retVal);
    return retVal;
  }
  /** get list of  "SzDataSourceComposite" reflecting match keys pulled from API and augmented with state information in shape of "SzDataSourceComposite". ordered ASC by "index" */
  public get matchKeys(): SzMatchKeyComposite[] {
    let retVal: SzMatchKeyComposite[] = this._matchKeys;
    retVal = sortMatchKeysByIndex(retVal);
    return retVal;
  }
  /** get list of  "SzDataSourceComposite" reflecting datasources pulled from API and augmented with state information in shape of "SzDataSourceComposite". ordered ASC by "index" */
  public get matchKeyTokens(): SzMatchKeyTokenComposite[] {
    let retVal: SzMatchKeyTokenComposite[] = this._matchKeyTokens;
    retVal = sortMatchKeyTokensByIndex(retVal);
    return retVal;
  }
  public get matchKeyCoreTokens(): SzMatchKeyTokenComposite[] {
    let retVal: SzMatchKeyTokenComposite[] = this._matchKeyTokens.filter((mkComposite) => {
      return mkComposite.coreCount > 0;
    });
    retVal = sortMatchKeyTokensByIndex(retVal);
    return retVal;
  }

  /** show match keys */
  public _showLinkLabels = true;
  @Input() public set showLinkLabels(value){
    this._showLinkLabels = value;
  }
  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  /** show match keys */
  public _suppressL1InterLinks = true;
  @Input() public set suppressL1InterLinks(value){
    this._suppressL1InterLinks = value;
  }
  public get suppressL1InterLinks(): boolean {
    return this._suppressL1InterLinks;
  }

  /** titles that are displayed for each section in component */
  @Input() sectionTitles = [
    'Filters',
    'Filter by Source',
    'Link Colors',
    'Colors by Source',
    'Focused Entity: ',
    'Filter by Match Key',
    'Filter by Match Key'
  ];

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

  // ------------------------------------  getters and setters --------------------------

  /** get data from reactive form control array */
  public get filterByDataSourcesData() {
    return <UntypedFormArray>this.filterByDataSourcesForm.get('datasources');
  }
  /** get data from reactive form control array */
  public get filterByMatchKeysData() {
    return <UntypedFormArray>this.filterByMatchKeysForm.get('matchkeys');
  }
  /** get data from reactive form control array */
  /*
  public get filterByMatchKeyTokenData() {
    return <FormArray>this.filterByMatchKeyTokensForm.get('matchkeytokens');
  }*/

  // --------------------------------- event emmitters and subjects ----------------------
  /**
   * emmitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public prefsChange: EventEmitter<SzSdkPrefsModel> = new EventEmitter<SzSdkPrefsModel>();
  /** inheirited from "SzEntityDetailGraphControlComponent" code. wanted it to be interchangeable */
  @Output() public optionChanged = new EventEmitter<{name: string, value: any}>();

  // ------------------------------ forms, form groups, and handlers ---------------------
  /** the form group for the filters by datasource list */
  filterByDataSourcesForm: UntypedFormGroup;
  filterByMatchKeysForm: UntypedFormGroup;
  //filterByMatchKeyTokensForm: FormGroup;
  /** the form group for colors by datasource list */
  colorsByDataSourcesForm: UntypedFormGroup;
  /** the form group for maxDegreesOfSeparation, maxEntities, buildOut parameter sliders */
  slidersForm: UntypedFormGroup;
  /** the form group for colors by other characteristics */
  colorsMiscForm: UntypedFormGroup;

  constructor(
    public prefs: SzPrefsService,
    public dataSourcesService: SzDataSourcesService,
    private formBuilder: UntypedFormBuilder,
    private cd: ChangeDetectorRef,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
  ) {
    // ----- initialize form control groups ------
    // sliders
    this.slidersForm = this.formBuilder.group({
      'buildOut': [this.buildOut, Validators.max(5)],
      'maxEntities': [this.maxEntities, Validators.max(99)],
      'maxDegreesOfSeparation': [this.maxDegreesOfSeparation, Validators.max(5)]
    });

    // filter by datasources
    this.filterByDataSourcesForm = this.formBuilder.group({
      datasources: new UntypedFormArray([])
    });
    // filter by matchkeys
    this.filterByMatchKeysForm = this.formBuilder.group({
      matchkeys: new UntypedFormArray([])
    });
    // filter by match keys tags
    /*
    this.filterByMatchKeyTokensForm = this.formBuilder.group({
      matchkeytokens: new FormArray([])
    });*/
    // colors by datasources
    this.colorsByDataSourcesForm = this.formBuilder.group({
      datasources: new UntypedFormArray([])
    });
    // other colors
    this.queriedEntitiesColor =  this.prefs.graph.queriedEntitiesColor;
    this.colorsMiscForm = this.formBuilder.group({
      'queriedEntitiesColor': this.queriedEntitiesColor
    });
  }

  // --------------------------------- start event handlers -----------------------

  /** handler for when a filter by datasouce value in the "filterByDataSourcesForm" has changed */
  onDsFilterChange(dsValue: string, evt?) {
    const filteredDataSourceNames = this.filterByDataSourcesForm.value.datasources
      .map((v, i) => v ? null : this.dataSources[i].name)
      .filter(v => v !== null);
    // update filters pref
    this.prefs.graph.dataSourcesFiltered = filteredDataSourceNames;
  }
  /** handler for when a filter by match key value in the "filterByMatchKeysForm" has changed */
  onMkFilterChange(mkValue: string, evt?) {
    const includedMatchKeyNames = this.filterByMatchKeysForm.value.matchkeys
      .map((v, i) => v ? this.matchKeys[i].name :  null)
      .filter(v => v !== null);
    // update filters pref    
    this.prefs.graph.matchKeysIncluded = includedMatchKeyNames;
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onMkFilterChange',this.prefs.graph.matchKeysIncluded);
  }
  onMkTagFilterToggle( mkName: string ) {
    let _matchKeyTokensIncludedMemCopy: string[] = [];
    if(this.matchKeyTokensIncluded && this.matchKeyTokensIncluded.length) {
      let _matchKeyTokensIncludedMemCopy = [].concat(this.matchKeyTokensIncluded);

      let _existingKeyPos = _matchKeyTokensIncludedMemCopy.indexOf(mkName);
      if(_existingKeyPos > -1 && _matchKeyTokensIncludedMemCopy[_existingKeyPos]) {
        // remove from position
        _matchKeyTokensIncludedMemCopy.splice(_existingKeyPos,1);
        this.prefs.graph.matchKeyTokensIncluded = _matchKeyTokensIncludedMemCopy;
        console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onMkTagFilterToggle: removed ${mkName} from cloud value`,_matchKeyTokensIncludedMemCopy);
      } else {
        // add to included token list
        _matchKeyTokensIncludedMemCopy.push( mkName );
        this.prefs.graph.matchKeyTokensIncluded = _matchKeyTokensIncludedMemCopy;
        console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onMkTagFilterToggle: added ${mkName} to cloud value`,_matchKeyTokensIncludedMemCopy);
      }
    } else {
      // add to included token list
      _matchKeyTokensIncludedMemCopy.push( mkName );
      this.prefs.graph.matchKeyTokensIncluded = _matchKeyTokensIncludedMemCopy;
      console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onMkTagFilterToggle: added ${mkName} to cloud value`,_matchKeyTokensIncludedMemCopy);
    }
  }
  onCoreMkTagFilterToggle( mkName: string ) { 
    let _matchKeyTokensIncludedMemCopy: string[] = [];
    if(this.matchKeyCoreTokensIncluded && this.matchKeyCoreTokensIncluded.length) {
      let _matchKeyTokensIncludedMemCopy = [].concat(this.matchKeyCoreTokensIncluded);
      // pull any other items out of the values 
      // IF the values are not in the current tag cloud
      let _matchKeyCoreTokens        = this.matchKeyCoreTokens.map((mkTok) => mkTok.name);
      _matchKeyTokensIncludedMemCopy = _matchKeyTokensIncludedMemCopy.filter((mkStr: string) => {
        return (_matchKeyCoreTokens.indexOf(mkStr) > -1) ? true : false;
      });
      // now that we have a clean array see if the current value has 
      // an existing position
      let _existingKeyPos = _matchKeyTokensIncludedMemCopy.indexOf(mkName);
      console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onCoreMkTagFilterToggle: checking if "${mkName}" is in existing items: ${_matchKeyTokensIncludedMemCopy}`, _existingKeyPos);
      if(_existingKeyPos > -1 && _matchKeyTokensIncludedMemCopy[_existingKeyPos]) {
        // remove from position
        _matchKeyTokensIncludedMemCopy.splice(_existingKeyPos,1);
        this.prefs.graph.matchKeyCoreTokensIncluded = _matchKeyTokensIncludedMemCopy;
        console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onCoreMkTagFilterToggle: removed ${mkName} from cloud value`,_matchKeyTokensIncludedMemCopy);
      } else {
        // add to included token list
        _matchKeyTokensIncludedMemCopy.push( mkName );
        this.prefs.graph.matchKeyCoreTokensIncluded = _matchKeyTokensIncludedMemCopy;
        console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onCoreMkTagFilterToggle: addeded ${mkName}(${_existingKeyPos}) to cloud value`,_matchKeyTokensIncludedMemCopy);
      }
    } else {
      console.log(`matchKeyCoreTokensIncluded: ${this.matchKeyCoreTokensIncluded}`);
      // add to included token list
      _matchKeyTokensIncludedMemCopy.push( mkName );
      this.prefs.graph.matchKeyCoreTokensIncluded = _matchKeyTokensIncludedMemCopy;
      console.log(`@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onCoreMkTagFilterToggle: added ${mkName} to cloud value`,_matchKeyTokensIncludedMemCopy, this.matchKeyCoreTokensIncluded);
    }
  }

  /**
   * display a new tooltip using the template portal
   * @internal
   */
  onShowTooltip(message: string, event: any) {
    if(!this.showTooltips) { return false; }
    let messageAlreadyShowing = this._tooltipLastMessageShown && this._tooltipLastMessageShown == message ? true : false;

    // if message is different immediately close last tooltip
    if(!messageAlreadyShowing) {
      this.hideTooltip();
    }
    // store new value
    this._tooltipLastMessageShown = message;

    if(this._tooltipSubCloseTimer) {
      // timer already exists, just adding time to it
      clearTimeout(this._tooltipSubCloseTimer);
    }
    this._tooltipSubCloseTimer  = setTimeout(this.hideTooltip.bind(this), 2500);

    if(messageAlreadyShowing || this.overlayRef) {
      // if message already showing no need to create new overlay
      // this.overlayRef should be undefined if old overlay cleared out
      return false;
    }

    //let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    const positionStrategy = this.overlay.position().global();
    //positionStrategy.top(Math.ceil(event.eventPageY - scrollY)+'px');
    //positionStrategy.left(Math.ceil(event.eventPageX)+'px');
    positionStrategy.top(Math.ceil(event.y - 50)+'px'); // the reason this is - pos is to avoid a mouseout/over flicker bug from the bubble stealing focus
    positionStrategy.left(Math.ceil(event.x)+'px');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.tooltip, this.viewContainerRef, {
      $implicit: message
    }));

    return false;
  }

  /**
   * hides visible tooltip 
   * @internal 
   */
  hideTooltip(message?: string) {
    if(!this.showTooltips) { return false; }
    if(message && this._tooltipLastMessageShown && message === this._tooltipLastMessageShown) {
      // this is the exact same message being currently displayed
      return false;
    }
    if (this.overlayRef) {
      this.overlayRef.addPanelClass('fade-out');
      // we want to give the animation time to finish 
      // before fading out
      setTimeout(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = undefined;
        }
        this._tooltipLastMessageShown = undefined;
      }, 150)
    }
    return false;
  }

  /**
   * method for getting the selected pref color for a datasource 
   * by the datasource name. used for applying background color to 
   * input[type=color] to make them look fancier
   */
  getDataSourceColor(dsValue: string) {
    let retVal = null;
    if(this._dataSources && this._dataSources.find){
      let dsObj = this._dataSources.find((_ds: SzDataSourceComposite) => {
        return _ds.name === dsValue;
      });
      if(dsObj && dsObj.color) {
        retVal = dsObj.color;
      }
    }
    return retVal;
  }
  /** handler for when a color value for a source in the "colorsByDataSourcesForm" has changed */
  onDsColorChange(dsValue: string, src?: any, evt?) {
    // update color value in array
    if(this._dataSources) {
      let _dsIndex = this._dataSources.findIndex((dsVal: SzDataSourceComposite) => {
        return dsVal.name === dsValue;
      });
      if(_dsIndex && this._dataSources && this._dataSources[ _dsIndex ]) {
        this._dataSources[ _dsIndex ].color = src.value;
      }
    }
    // update color swatch bg color(for prettier boxes)
    if(src && src.style && src.style.setProperty){
      src.style.setProperty('background-color', src.value);
    }
    // update colors pref
    if( this.prefs && this.prefs.graph) {
      // there is some sort of mem reference clone issue
      // forcing update seems to fix it
      this.prefs.graph.dataSourceColors = this.dataSourceColors;
    }
  }
  /** handler for when an integer pref value has changed. ie: buildOut  */
  onIntParameterChange(prefName, value) {
    if(this.prefs.graph[prefName] !== undefined) {
      this.prefs.graph[prefName] = parseInt(value, 10);
    }
  }
  public getValueFromEventTarget(event): any {
    if(event.target && (event.target as HTMLInputElement).value !== undefined) {
      return (event.target as HTMLInputElement).value;
    }
    return undefined;
  }
  /** handler for when an string color pref value has changed. ie: queriedEntitiesColor  */
  onColorParameterChange(prefName, value) {
    console.log('onColorParameterChange: ', prefName, value, this.prefs.graph.suppressL1InterLinks);
    try {
      this.prefs.graph[prefName] = value;
      if(prefName === 'queriedEntitiesColor'){
        this.prefs.graph.focusedEntitiesColor
      }
    } catch(err) {}
  }
  /** handler method for when a basic bool pref should be toggled */
  public onCheckboxPrefToggle(optName: string, event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    } else if (isBoolean(event)) {
      _checked = (event as boolean);
    }
    console.log('@senzing/sdk-components-ng/SzEntityDetailGraphFilterComponent.onCheckboxPrefToggle: ', optName, _checked, event);
    this.prefs.graph[optName] = parseBool(_checked);
    this.optionChanged.emit({'name': optName, value: _checked});
  }
  /** when the user selects either the scope or entity limit "unlimited" checkboxes
   * this handler is invoked to set the appropriate preferences.
   */
  public onMaxUnlimitedChange(prefKey: string, value: boolean) {
    //console.log('onMaxUnlimitedChange: ', value);
    if(this.prefs.graph[ prefKey ] !== value) {   // prevents recursive change evt loops
      this.prefs.graph[ prefKey ] = value;
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    this._showLinkLabels        = prefs.showLinkLabels;
    this._suppressL1InterLinks  = prefs.suppressL1InterLinks
    this.maxDegreesOfSeparation = prefs.maxDegreesOfSeparation;
    this.maxEntities            = prefs.maxEntities;
    this.buildOut               = prefs.buildOut;
    this.dataSourceColors       = prefs.dataSourceColors;
    this.dataSourcesFiltered    = prefs.dataSourcesFiltered;
    this.matchKeysIncluded      = prefs.matchKeysIncluded;
    this.matchKeyTokensIncluded = prefs.matchKeyTokensIncluded;
    this.matchKeyCoreTokensIncluded = prefs.matchKeyCoreTokensIncluded;
    this.queriedEntitiesColor   = prefs.queriedEntitiesColor;
    this.linkColor              = prefs.linkColor;
    this.indirectLinkColor      = prefs.indirectLinkColor;
    this.matchKeyTokenSelectionScope  = prefs.matchKeyTokenSelectionScope;
    //this._matchKeyTokenSelectionScope = prefs.matchKeyTokenSelectionScope;

    console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onPrefsChange(): ', prefs, this.dataSourceColors);
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  /** 
   * when user changes the order of a color by dragging it to 
   * a different position in list update internal list "index"
   * values and save state to prefs.
   */
  onColorOrderDrop(event: CdkDragDrop<string[]>) {
    let displayedList = this.dataSourceColors;
    if(displayedList && displayedList.filter) {
      displayedList = displayedList.filter((dsVal: SzDataSourceComposite) => {
        return this.shouldDataSourceBeDisplayed(dsVal.name);
      });
    }
    let existingItem    = displayedList[event.previousIndex];
    let itemAtPosition  = displayedList[event.currentIndex];
    if(event && event.item && event.item.data) {
      if(existingItem && event.item.data !== existingItem.name) {
        let _existingByName = this._dataSources.find( (_ds: SzDataSourceComposite) => {
          return _ds.name === event.item.data;
        });        
      }
    }
    // now update index values after slicing array
    let newArray              = this.dataSourceColors;
    // value of "0" means they moved up. value of "1" means they moved down
    let direction             = event.currentIndex < event.previousIndex ? 0 : 1;
    // we se this here because it will be bumped if we reference during loop
    let newIndex              = itemAtPosition.index;
    newArray = newArray.map((_dsVal: SzDataSourceComposite) => {
      if(direction === 0){
        // moved up
        if(_dsVal.name !== existingItem.name) {
          if(_dsVal.index >= itemAtPosition.index) {
            // add "1" to index
            _dsVal.index  = _dsVal.index + 1;
          }
        } else {
          // is item
          _dsVal.index = newIndex;
        }
      } else if(direction === 1) {
        //moved down
        if(_dsVal.name !== existingItem.name) {
          if(_dsVal.index <= itemAtPosition.index) {
            // subtract "1" from index
            _dsVal.index  = _dsVal.index - 1;
          }
        } else {
          // is item
          _dsVal.index = newIndex;
        }
      }
      return _dsVal;
    });
    //let _sortedNewArray       = sortDataSourcesByIndex(newArray);
    //console.log("direction? "+ direction +" | item slice: ", newArray, _sortedExistingArray, _sortedNewArray);
    //console.log('onColorOrderDrop: ', event, newArray);
  }

  /** toggle all available match key tokens on or off */
  onSelectAllMatchKeyTokens(selectAll: boolean) {
    /**
     * @TODO something about changing this is causing a new 
     * graph data request. Need to fix this.
     */
    console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onSelectAllMatchKeyTokens: ', selectAll);
    if(this.showCoreMatchKeyTokenChips) {
      this.prefs.graph.matchKeyCoreTokensIncluded = selectAll ? this.matchKeyCoreTokens.map((token: SzMatchKeyTokenComposite) => { return token.name; }) : [];
    } else if(this.prefs.graph.matchKeyCoreTokensIncluded && this.prefs.graph.matchKeyCoreTokensIncluded.length > 0) {
      // clear out old value
      this.prefs.graph.matchKeyCoreTokensIncluded = [];
    }
    if(this.showExtraneousMatchKeyTokenChips) {
      this.prefs.graph.matchKeyTokensIncluded = selectAll ? this.matchKeyTokens.map((token: SzMatchKeyTokenComposite) => { return token.name; }) : [];
    } else if(this.prefs.graph.matchKeyTokensIncluded && this.prefs.graph.matchKeyTokensIncluded.length > 0) {
        // clear out old value
        this.prefs.graph.matchKeyTokensIncluded = [];
    }
  }
  /** when the user toggles the match key tokens scope control this 
   * handler is invoked to copy all selections from one mode to the 
   * other and update the preferences with the new values.
  */
  public onMatchKeyCoreModeToggle(isCoreMode: any) {
    if(!isCoreMode && (this._matchKeyTokenSelectionScope !== SzMatchKeyTokenFilterScope.EXTRANEOUS)) {
      // copy over any selected chips from 
      let _matchKeyTokens = this.matchKeyTokens.map((mkToken) => mkToken.name);
      let _matchKeyTokensIncludedMemCopy = new Set([].concat(this.matchKeyCoreTokensIncluded));
      let _filteredList = [].concat(..._matchKeyTokensIncludedMemCopy).filter((strVal) => {
        return _matchKeyTokens.indexOf(strVal) > -1 ? true : false;
      });
      this.prefs.graph.matchKeyTokensIncluded = _filteredList;
      //console.log('onMatchKeyCoreModeToggle1: ', this.matchKeyTokens, [].concat(..._matchKeyTokensIncludedMemCopy), this.prefs.graph.matchKeyTokensIncluded);
    } else if(isCoreMode && (this._matchKeyTokenSelectionScope !== SzMatchKeyTokenFilterScope.CORE)) {
      // copy any items from extra to core 
      // IF the items exist in core
      let _matchKeyCoreTokens = this.matchKeyCoreTokens.map((mkToken) => mkToken.name);
      let _matchKeyCoreTokensIncludedMemCopy = new Set([].concat(this.matchKeyCoreTokensIncluded, this.matchKeyTokensIncluded));
      this.prefs.graph.matchKeyCoreTokensIncluded = [].concat(..._matchKeyCoreTokensIncludedMemCopy).filter((strVal) => {
        return _matchKeyCoreTokens.indexOf(strVal) > -1 ? true : false;
      });
      //console.log('onMatchKeyCoreModeToggle2: ', _matchKeyCoreTokensIncludedMemCopy, this.prefs.graph.matchKeyTokensIncluded);
    }
    //this._matchKeyTokenSelectionScope = (!isCoreMode) ? SzMatchKeyTokenFilterScope.EXTRANEOUS : SzMatchKeyTokenFilterScope.CORE;
    this.prefs.graph.matchKeyTokenSelectionScope = (!isCoreMode) ? SzMatchKeyTokenFilterScope.EXTRANEOUS : SzMatchKeyTokenFilterScope.CORE;
    this._onMatchKeyTokenSelectionScopeChange.next( this._matchKeyTokenSelectionScope );
  }
  /** this event handler proxies the internal "_onMatchKeyTokenSelectionScopeChange" event 
   * the the public "matchKeyTokenSelectionScopeChanged" event emitter.
   */
  private onMatchKeyTokenSelectionScopeChanged(scope: SzMatchKeyTokenFilterScope) {
    console.log('onMatchKeyTokenSelectionScopeChanged: ', scope);
    
    // now emit events
    this.optionChanged.emit({name: 'matchKeyTokenFilterScope', value: scope});
    this.matchKeyTokenSelectionScopeChanged.emit(scope);
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // bind prefs changes to handler
    this.prefs.graph.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );

    // when the user changes the scope of the match key token filtering
    this.onMatchKeyTokenSelectionScopeChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(this.onMatchKeyTokenSelectionScopeChanged.bind(this));

    // get datasources
    // then create filter and color control lists
    this.initializeDataSourceFormControls();
    this.initializeMatchKeysFormControls();
  }

  ngAfterViewInit() {
    let hasZeroDsControls = (Object.keys(this.filterByDataSourcesForm.controls).length <= 0) && (Object.keys(this.colorsByDataSourcesForm.controls).length <= 0);
    //let hasZeroMkControls = (Object.keys(this.filterByMatchKeysForm.controls).length <= 0);

    if(hasZeroDsControls) {
      // try updating ds filters one more time
      this.initializeDataSourceFormControls();
    }
    this.initializeMatchKeysFormControls();
  }

  /** initializes filter form controls */
  private initializeDataSourceFormControls() {
    this.getDataSources().subscribe((dataSrc: string[]) => {
      // lets create a quick lookup map
      let _datasourceColorsMap  = {};
      if(this._dataSourceColors && this._dataSourceColors.forEach) {
        this._dataSourceColors.forEach((_dsObj: SzDataSourceComposite) => {
          _datasourceColorsMap[ _dsObj.name ] = _dsObj;
        });
      }
      // now lets make sure that the current local _dataSources var
      // is up to date with what came from the api
      this._dataSources = dataSrc.map((_dsStr: string) => {
        let retVal = {
          name: _dsStr,
          index: 0
        };
        // check to see if we have entry for this in prefs
        // if we do use the state meta data from that(index, color, etc)
        if( _datasourceColorsMap && _datasourceColorsMap[ _dsStr ]) {
          retVal  = _datasourceColorsMap[ _dsStr ];
        }
        return retVal;
      });
      // init form controls for filter by datasource      
      this.dataSources.forEach((o, i) => {
        const dsFilterVal = !(this.dataSourcesFiltered.indexOf(o.name) >= 0);
        const control1 = new UntypedFormControl(dsFilterVal); // if first item set to true, else false
        // add control for filtered by list
        (this.filterByDataSourcesForm.controls['datasources'] as UntypedFormArray).push(control1);
      });

    });
  }

  private removeAllMatchKeyControls() {
    while(this.filterByMatchKeysData.length > 0){
      this.filterByMatchKeysData.removeAt(this.filterByMatchKeysData.length - 1);
    }
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.removeAllMatchKeyControls: ', this.filterByMatchKeysData, this.matchKeysIncluded);
  }

  private initializeMatchKeysFormControls() {
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.initializeMatchKeysFormControls: ', this.matchKeys, this.showMatchKeys, this.matchKeysIncluded);
    if(this.matchKeys) {
      // remove old controls
      this.removeAllMatchKeyControls();

      // init form controls for filter by match keys
      this.matchKeys.forEach((o, i) => {
        const mkFilterVal = (this.matchKeysIncluded.indexOf(o.name) >= 0);
        const control1 = new UntypedFormControl(mkFilterVal); // if first item set to true, else false
        // add control for filtered by list
        (this.filterByMatchKeysForm.controls['matchkeys'] as UntypedFormArray).push(control1);
      });
    }
  }

  /** helper method for retrieving list of datasources */
  public getDataSources() {
    return this.dataSourcesService.listDataSources();
  }
  /** if "showDataSources" array is specified, check that string name is present in list */
  public shouldDataSourceBeDisplayed( dsName: string) {
    return (this.showDataSources && this.showDataSources !== undefined && this.showDataSources.length !== undefined) ? (this.showDataSources.indexOf( dsName ) > -1) : true;
  }
  /** if "showMatchKeys" array is specified, check that string name is present in list */
  public shouldMatchKeyBeDisplayed( mkName: string) {
    return (this.showMatchKeys && this.showMatchKeys.length > 0) ? (this.showMatchKeys.indexOf( mkName ) > -1) : true;
  }
  public isMatchKeyTokenSelected( mkName: string ) {
    let retVal = false;
    if(this.matchKeyTokensIncluded && this.matchKeyTokensIncluded.length > 0) {
      retVal = this.matchKeyTokensIncluded.indexOf(mkName) > -1 ? true : false;
      //console.log(`#${mkName} in selected match keys? ${retVal}`, this.matchKeyTokensIncluded.indexOf(mkName), this.matchKeysIncluded);
    } else {
      //console.log(`#${mkName} not found in selected match keys: `, this.matchKeyTokensIncluded);
    }
    return retVal;
  }
  public isMatchKeyCoreTokenSelected( mkName: string ) {
    let retVal = false;
    if(this.matchKeyCoreTokensIncluded && this.matchKeyCoreTokensIncluded.length > 0) {
      retVal = this.matchKeyCoreTokensIncluded.indexOf(mkName) > -1 ? true : false;
      //console.log(`#${mkName} in selected match keys? ${retVal}`, this.matchKeyTokensIncluded.indexOf(mkName), this.matchKeysIncluded);
    } else {
      //console.log(`#${mkName} not found in selected match keys: `, this.matchKeyTokensIncluded);
    }
    return retVal;
  }
  /** if "showMatchKeys" array is specified, check that string name is present in list */
  public shouldMatchKeyTokenBeDisplayed( mkName: string) {
    //console.log(`show "${mkName}" filter?`, this.showMatchKeyTokens);
    return true;
    return (this.showMatchKeyTokens && this.showMatchKeyTokens.length > 0) ? (this.showMatchKeyTokens.findIndex( (mkCat)=> { return mkCat.name === mkName; } ) > -1) : true;
  }
  /** function for shortening the match key token badge counts notation */
  public getMKBadgeCount(count: number): string {
    let retVal = (count && count > 0) ? (count as unknown as string) : '0';
    if (count >= 1000) {
      retVal = (Math.round((count / 1000) * 10) / 10)+'K';
    }
    return retVal;
  }
  
}
