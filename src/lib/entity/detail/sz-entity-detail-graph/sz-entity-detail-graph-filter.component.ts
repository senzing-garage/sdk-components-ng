import { Component, HostBinding, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../../services/sz-datasources.service';
import { tap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph-filter',
  templateUrl: './sz-entity-detail-graph-filter.component.html',
  styleUrls: ['./sz-entity-detail-graph-filter.component.scss']
})
export class SzEntityDetailGraphFilterComponent implements OnInit, OnDestroy {
  isOpen: boolean = true;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  @Input() maxDegreesOfSeparation: number = 1;
  @Input() maxEntities: number = 20;
  @Input() buildOut: number = 1;
  @Input() dataSourceColors: any = {};
  @Input() dataSourcesFiltered: string[] = [];
  @Input() queriedEntitiesColor: string;
  public _datasources: string[] = [];
  public _showLinkLabels = true;
  @Input() public set showLinkLabels(value){
    this._showLinkLabels = value;
  }
  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @Input() sectionTitles = [
    'Filters',
    'Filter by Source',
    'Colors by Source',
    'Color by: '
  ];


  @Output() public optionChanged = new EventEmitter<{name: string, value: any}>();

  // form and form groups
  filterByDataSourcesForm: FormGroup;
  colorsByDataSourcesForm: FormGroup;
  slidersForm: FormGroup;
  colorsMiscForm: FormGroup;

  constructor(
    public prefs: SzPrefsService,
    public datasources: SzDataSourcesService,
    private formBuilder: FormBuilder
  ) {
    this.prefs.graph.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );

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
    this.colorsMiscForm = this.formBuilder.group({
      'queriedEntitiesColor': this.queriedEntitiesColor
    });
  }

  public get filterByDataSourcesData() {
    return <FormArray>this.filterByDataSourcesForm.get('datasources');
  }
  public get colorsByDataSourcesData() {
    return <FormArray>this.colorsByDataSourcesForm.get('datasources');
  }

  onDsFilterChange() {
    const filteredDataSourceNames = this.filterByDataSourcesForm.value.datasources
      .map((v, i) => v ? null : this._datasources[i])
      .filter(v => v !== null);
    // update filters pref
    this.prefs.graph.dataSourcesFiltered = filteredDataSourceNames;
    console.log('onDsFilterChange: ', filteredDataSourceNames, this.prefs.graph.dataSourcesFiltered);
  }
  onDsColorChange() {
    const coloredDataSourceNames = this.colorsByDataSourcesForm.value.datasources
      .map((v, i) => {
        const hasColor = v ? true : false;
        return v ? {'key': this._datasources[i], 'value': v} : null;
      })
      .filter(v => v !== null);

      coloredDataSourceNames.forEach( (pair) => {
        this.dataSourceColors[pair.key] = pair.value;
      })
    // update colors pref
    console.log('onDsColorChange: ', this.dataSourceColors, coloredDataSourceNames);
  }

  onIntParameterChange(prefName, value) {
    console.log('onIntParameterChange('+ prefName +'): ', value);
    if(this.prefs.graph[prefName] !== undefined) {
      this.prefs.graph[prefName] = parseInt(value, 10);
    }
  }

  onColorParameterChange(prefName, value) {
    console.log('onColorParameterChange('+ prefName +'): ', value);
    try {
      this.prefs.graph[prefName] = value;
    } catch(err) {}
  }


  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    console.log('@senzing/sdk-components-ng/sz-entity-detail-graph-filter.onPrefsChange(): ', prefs, this.prefs.graph);
    this._showLinkLabels = prefs.showMatchKeys;
    this.maxDegreesOfSeparation = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;
    this.buildOut = prefs.buildOut;
    this.dataSourceColors = prefs.dataSourceColors;
    this.dataSourcesFiltered = prefs.dataSourcesFiltered;
    this.queriedEntitiesColor = prefs.queriedEntitiesColor;
    // update view manually (for web components redraw reliability)
    //this.cd.detectChanges();
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // get datasources
    // then create filter and color control lists
    this.getDataSources().subscribe((dataSrc: string[]) => {
      console.log('got data from api request', dataSrc);
      this._datasources = dataSrc;
      // init form controls for filter by datasource
      this._datasources.forEach((o, i) => {
        const dsFilterVal = this.dataSourcesFiltered.indexOf(o) >= 0;
        const dsColorVal  = this.dataSourceColors[o];

        const control1 = new FormControl(dsFilterVal); // if first item set to true, else false
        const control2 = new FormControl(dsColorVal); // color value if any
        // add control for filtered by list
        (this.filterByDataSourcesForm.controls.datasources as FormArray).push(control1);
        // add control for colored by list
        (this.colorsByDataSourcesForm.controls.datasources as FormArray).push(control2);
      });
    })
  }

  public getDataSources() {
    return this.datasources.listDataSources();
  }

  public changeOption(optName: string, value: any): void {
    this.optionChanged.emit({'name': optName, 'value': value});
  }
  public toggleBoolOption(optName: string, event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    this.optionChanged.emit({'name': optName, value: _checked});
  }
}
