import { Component, HostBinding, Input, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService, SzSdkPrefsModel } from '../services/sz-prefs.service';
import { SzDataSourcesService } from '../services/sz-datasources.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SzDataSourceComposite } from '../models/data-sources';
import { SzMatchKeyComposite } from '../models/graph';
import { sortDataSourcesByIndex, parseBool, sortMatchKeysByIndex } from '../common/utils';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example <!-- (Angular) -->
 * <sz-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-graph-filter>
 *
 * @example <!-- (WC) -->
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
  isOpen: boolean = true;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** private list of datasource records augmented by SzDataSourceComposite shape 
   * @internal
  */
  private _dataSources: SzDataSourceComposite[]       = [];
  private _matchKeys: SzMatchKeyComposite[]           = [];

  /** private list of SzDataSourceComposite as stored in local storage 
   * @internal
  */
  private _dataSourceColors: SzDataSourceComposite[]  = [];

  @Input() maxDegreesOfSeparation: number = 1;
  @Input() showMaxDegreesOfSeparation: boolean = false;
  @Input() maxEntities: number = 20;
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
  private _showMatchKeysFilters: boolean = true;
  @Input() public set showMatchKeyFilters(value: boolean | string) {
    this._showMatchKeysFilters = parseBool(value);    
  }
  public get showMatchKeyFilters(): boolean | string {
    return this._showMatchKeysFilters;
  }
  @Input() dataSourcesFiltered: string[] = [];
  @Input() matchKeysIncluded: string[] = [];
  @Input() queriedEntitiesColor: string;

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

  /** get list of  "SzDataSourceComposite" reflecting datasources pulled from API and augmented with state information in shape of "SzDataSourceComposite". ordered ASC by "index" */
  public get matchKeys(): SzDataSourceComposite[] {
    let retVal: SzMatchKeyComposite[] = this._matchKeys;
    retVal = sortMatchKeysByIndex(retVal);
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
  /** titles that are displayed for each section in component */
  @Input() sectionTitles = [
    'Filters',
    'Filter by Source',
    'Colors by Source',
    'Color by: ',
    'Filter by Match Key'
  ];

  @HostBinding('class.showing-link-labels') public get showingLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @HostBinding('class.not-showing-link-labels') public get hidingLinkLabels(): boolean {
    return !this._showLinkLabels;
  }

  // ------------------------------------  getters and setters --------------------------

  /** get data from reactive form control array */
  public get filterByDataSourcesData() {
    return <FormArray>this.filterByDataSourcesForm.get('datasources');
  }
  /** get data from reactive form control array */
  public get filterByMatchKeysData() {
    return <FormArray>this.filterByMatchKeysForm.get('matchkeys');
  }

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
  filterByDataSourcesForm: FormGroup;
  filterByMatchKeysForm: FormGroup;
  /** the form group for colors by datasource list */
  colorsByDataSourcesForm: FormGroup;
  /** the form group for maxDegreesOfSeparation, maxEntities, buildOut parameter sliders */
  slidersForm: FormGroup;
  /** the form group for colors by other characteristics */
  colorsMiscForm: FormGroup;

  constructor(
    public prefs: SzPrefsService,
    public dataSourcesService: SzDataSourcesService,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef
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
      datasources: new FormArray([])
    });
    // filter by matchkeys
    this.filterByMatchKeysForm = this.formBuilder.group({
      matchkeys: new FormArray([])
    });
        
    // colors by datasources
    this.colorsByDataSourcesForm = this.formBuilder.group({
      datasources: new FormArray([])
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
  /** handler for when a filter by datasouce value in the "filterByDataSourcesForm" has changed */
  onMkFilterChange(mkValue: string, evt?) {
    const includedMatchKeyNames = this.filterByMatchKeysForm.value.matchkeys
      .map((v, i) => v ? this.matchKeys[i].name :  null)
      .filter(v => v !== null);
    // update filters pref    
    this.prefs.graph.matchKeysIncluded = includedMatchKeyNames;
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onMkFilterChange',this.prefs.graph.matchKeysIncluded);
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
    try {
      this.prefs.graph[prefName] = value;
    } catch(err) {}
  }
  /** handler method for when a basic bool pref should be toggled */
  public onCheckboxPrefToggle(optName: string, event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    //console.log('@senzing/sdk-components-ng/SzEntityDetailGraphFilterComponent.onCheckboxPrefToggle: ', _checked, optName, event);
    this.optionChanged.emit({'name': optName, value: _checked});
  }
  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    this._showLinkLabels = prefs.showMatchKeys;
    this.maxDegreesOfSeparation = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;
    this.buildOut = prefs.buildOut;
    this.dataSourceColors = prefs.dataSourceColors;
    this.dataSourcesFiltered = prefs.dataSourcesFiltered;
    this.matchKeysIncluded = prefs.matchKeysIncluded;
    this.queriedEntitiesColor = prefs.queriedEntitiesColor;
    //console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onPrefsChange(): ', prefs, this.dataSourceColors);
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
        const control1 = new FormControl(dsFilterVal); // if first item set to true, else false
        // add control for filtered by list
        (this.filterByDataSourcesForm.controls['datasources'] as FormArray).push(control1);
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
        const control1 = new FormControl(mkFilterVal); // if first item set to true, else false
        // add control for filtered by list
        (this.filterByMatchKeysForm.controls['matchkeys'] as FormArray).push(control1);
      });
    }
  }


  /** helper method for retrieving list of datasources */
  public getDataSources() {
    return this.dataSourcesService.listDataSources();
  }
  /** if "showDataSources" array is specified, check that string name is present in list */
  public shouldDataSourceBeDisplayed( dsName: string) {
    return (this.showDataSources && this.showDataSources.length > 0) ? (this.showDataSources.indexOf( dsName ) > -1) : true;
  }
  /** if "showMatchKeys" array is specified, check that string name is present in list */
  public shouldMatchKeyBeDisplayed( mkName: string) {
    return (this.showMatchKeys && this.showMatchKeys.length > 0) ? (this.showMatchKeys.indexOf( mkName ) > -1) : true;
  }
  
}
