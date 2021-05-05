import { Component, HostBinding, Input, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService, SzSdkPrefsModel } from '../../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../../services/sz-datasources.service';
import { tap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example <!-- (Angular) -->
 * <sz-entity-detail-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-entity-detail-graph-filter>
 *
 * @example <!-- (WC) -->
 * <sz-wc-standalone-graph-filters id="sz-entity-detail-graph-filter"></sz-wc-standalone-graph-filters>
 * <script>
 * document.getElementById('sz-wc-standalone-graph-filters').addEventListener('optionChanged', function(data) { console.log('filter(s) changed', data); });
 * </script>
 */
@Component({
  selector: 'sz-entity-detail-graph-filter',
  templateUrl: './sz-entity-detail-graph-filter.component.html',
  styleUrls: ['./sz-entity-detail-graph-filter.component.scss']
})
export class SzEntityDetailGraphFilterComponent implements OnInit, AfterViewInit, OnDestroy {
  isOpen: boolean = true;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input() maxDegreesOfSeparation: number = 1;
  @Input() showMaxDegreesOfSeparation: boolean = false;
  @Input() maxEntities: number = 20;
  @Input() showMaxEntities: boolean = true;
  @Input() buildOut: number = 1;
  @Input() buildOutMin: number = 0;
  @Input() buildOutMax: number = 5;
  @Input() showDataSources: string[];
  @Input() dataSourceColors: any = {};
  @Input() dataSourceColorsOrdered: any[] = [];
  @Input() dataSourcesFiltered: string[] = [];
  @Input() queriedEntitiesColor: string;
  public _datasources: string[] = [];
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
    'Color by: '
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
  public get colorsByDataSourcesData() {
    return <FormArray>this.colorsByDataSourcesForm.get('datasources');
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
  /** the form group for colors by datasource list */
  colorsByDataSourcesForm: FormGroup;
  /** the form group for maxDegreesOfSeparation, maxEntities, buildOut parameter sliders */
  slidersForm: FormGroup;
  /** the form group for colors by other characteristics */
  colorsMiscForm: FormGroup;

  constructor(
    public prefs: SzPrefsService,
    public datasources: SzDataSourcesService,
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
  onDsFilterChange() {
    const filteredDataSourceNames = this.filterByDataSourcesForm.value.datasources
      .map((v, i) => v ? null : this._datasources[i])
      .filter(v => v !== null);
    // update filters pref
    this.prefs.graph.dataSourcesFiltered = filteredDataSourceNames;
    //console.log('onDsFilterChange: ', filteredDataSourceNames, this.prefs.graph.dataSourcesFiltered);
  }
  /**
   * method for getting the selected pref color for a datasource 
   * by the datasource name. used for applying background color to 
   * input[type=color] to make them look fancier
   */
  getDataSourceColor(dsValue) {
    const coloredDataSourceNames = this.colorsByDataSourcesForm.value.datasources
      .map((v, i) => {
        const hasColor = v ? true : false;
        return v ? {'key': this._datasources[i], 'value': v} : null;
      })
      .filter(v => v !== null);
    
    let dsFormValMatch = coloredDataSourceNames.find( (_keyValPair) => {
      return _keyValPair.key === dsValue ? true : false;
    });
    if(dsFormValMatch) {
      return dsFormValMatch.value;
    }
    return 'transparent';
  }
  /** handler for when a color value for a source in the "colorsByDataSourcesForm" has changed */
  onDsColorChange(src?: any, evt?) {
    console.log('onDsColorChange: ', src, evt);
    // update color swatch bg color(for prettier boxes)
    if(src && src.style && src.style.setProperty){
      src.style.setProperty('background-color', src.value);
    }
  }
  onDsColorChangeOld(src?: any, evt?) {
    const coloredDataSourceNames = this.colorsByDataSourcesForm.value.datasources
      .map((v, i) => {
        const hasColor = v ? true : false;
        return v ? {'key': this._datasources[i], 'value': v} : null;
      })
      .filter(v => v !== null);

    coloredDataSourceNames.forEach( (pair) => {
      this.dataSourceColors[pair.key] = pair.value;
    });
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
    // console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onPrefsChange(): ', prefs, this.prefs.graph);
    this._showLinkLabels = prefs.showMatchKeys;
    this.maxDegreesOfSeparation = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;
    this.buildOut = prefs.buildOut;
    this.dataSourceColors = prefs.dataSourceColors;
    this.dataSourceColorsOrdered  = prefs.dataSourceColorsOrdered ? prefs.dataSourceColorsOrdered : this.dataSourceColorsOrdered;
    this.dataSourcesFiltered = prefs.dataSourcesFiltered;
    this.queriedEntitiesColor = prefs.queriedEntitiesColor;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  onColorOrderDrop(event: CdkDragDrop<string[]>) {
    console.log('onColorOrderDrop: ', event, this.dataSourceColorsOrdered.map((ds: {datasource: string, color?: string, index?: number}) => { return ds.datasource}).join(','));
    moveItemInArray(this.dataSourceColorsOrdered, event.previousIndex, event.currentIndex);
    console.log('onColorOrderDrop: ', event, this.dataSourceColorsOrdered.map((ds: {datasource: string, color?: string, index?: number}) => { return ds.datasource}).join(','));
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
  }

  ngAfterViewInit() {
    let hasZeroDsControls = (Object.keys(this.filterByDataSourcesForm.controls).length <= 0) && (Object.keys(this.colorsByDataSourcesForm.controls).length <= 0);
    if(hasZeroDsControls) {
      // try updating ds filters one more time
      this.initializeDataSourceFormControls();
    }
  }

  movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX – The Rise of Skywalker'
  ];
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  }

  /** initializes filter form controls */
  private initializeDataSourceFormControls() {
    this.getDataSources().subscribe((dataSrc: string[]) => {
      this._datasources = dataSrc;

      // init form controls for filter by datasource
      console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.initializeDataSourceFormControls(): ', dataSrc);
      this._datasources.forEach((o, i) => {
        const dsFilterVal = !(this.dataSourcesFiltered.indexOf(o) >= 0);
        const dsColorVal  = this.dataSourceColors[o];
        // check to see if value is already in "this.dataSourceColorsOrdered" array
        let indexInColoredOrderArray = this.dataSourceColorsOrdered.findIndex((item: {datasource: string, color: string, index: number }) => {
          if(item && item.datasource === o){
            return true;
          }
          return false;
        });
        if(indexInColoredOrderArray < 0) {
          // add to ds colors array
          this.dataSourceColorsOrdered.push({
            datasource: o,
            color: null
          });
        }

        const control1 = new FormControl(dsFilterVal); // if first item set to true, else false
        const control2 = new FormControl(dsColorVal); // color value if any
        // add control for filtered by list
        (this.filterByDataSourcesForm.controls.datasources as FormArray).push(control1);
        // add control for colored by list
        (this.colorsByDataSourcesForm.controls.datasources as FormArray).push(control2);
      });

    });
  }

  /** helper method for retrieving list of datasources */
  public getDataSources() {
    return this.datasources.listDataSources();
  }
  /** if "showDataSources" array is specified, check that string name is present in list */
  public shouldDataSourceBeDisplayed( dsName: string) {
    return (this.showDataSources && this.showDataSources.length > 0) ? (this.showDataSources.indexOf( dsName ) > -1) : true;
  }
}
