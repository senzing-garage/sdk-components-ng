import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, merge, timer } from 'rxjs';
import { takeUntil, debounce } from 'rxjs/operators';
import { SzDataSourceComposite } from '../models/data-sources';
import { SzSearchHistoryFolio, SzSearchHistoryFolioItem, SzSearchParamsFolio } from '../models/folio';
import { AdminStreamAnalysisConfig, AdminStreamConnProperties, AdminStreamLoadConfig } from '../models/data-admin';
import { SzMatchKeyTokenFilterScope } from '../models/graph';
import { SzCrossSourceSummaryCategoryType, SzCrossSourceSummaryCategoryTypeToMatchLevel } from '../models/stats';
import { areArrayMembersEqual } from '../common/utils';

//import { Configuration as SzRestConfiguration, ConfigurationParameters as SzRestConfigurationParameters } from '@senzing/rest-api-client-ng';

/**
 * preferences bus base class. provides common methods for
 * publishing and responding to value changes. bulk-set and get.
 *
 * used by {@link SzSearchFormPrefs}, {@link SzSearchResultsPrefs}, {@link SzEntityDetailPrefs}, {@link SzGraphPrefs}
 */
export class SzSdkPrefsBase {
  /** during a bulk property set, set this to true to
   * not publish change events on every single value change
   */
  public bulkSet: boolean = false;
  /**
   * behavior subject that can be subscribed to for change
   * notifications.
   */
  public prefsChanged:  BehaviorSubject<any> = new BehaviorSubject<any>(this.toJSONObject());
  /**
   * subject that can be subscribed to for INDIVIDUAL value change
   * notifications.
   */
  public prefChanged:   Subject<{name: string, value: any}> = new Subject<{name: string, value: any}>();

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  jsonKeys = [];
  typemap  = {};

  // ------------------ methods

  /** get shallow JSON copy of object state. properties are filtered by members of {@link jsonKeys} */
  public toJSONObject(event?: any) {
    const retObj = {};
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        if( this[k] !== undefined){
          try{
            retObj[k] = ( this[k] && this[k].toJSONObject ) ? this[k].toJSONObject() : this[k];
          } catch (err) {
            // console.warn('attempted to get prefVal, but pref unset. ', err)
          };
        }
      });
    }
    // if an event is passed in add it to the json
    if(event) {
      retObj['event'] = event;
    }
    return retObj;
  }
  /** populate values by calling setters with the same names as json keys */
  public fromJSONObject(value: string) {
    this.bulkSet = true;
    let _isChanged = false;
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        if( value[k] !== undefined ){
          try{
            this[k] = (value[k] && value[k].fromJSONObject ) ? value[k].fromJSONObject() : value[k];
            _isChanged = true;
          } catch (err) {
            // console.warn('attempted to get prefVal, but pref unset. ', err)
          };
        }
      });
    }
    this.bulkSet = false;
    if(_isChanged){
      this.prefsChanged.next( this.toJSONObject() );
    }
  }
  /** get object state representation as a string */
  public toJSONString(): string {
    return JSON.stringify(this.toJSONObject());
  }
  /** gets an array of all public json properties and their types */
  public getPublicPropertiesSchema() {
    const retObj = {};
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        retObj[k] = (this.typemap && this.typemap[k]) ? this.typemap[k] : typeof this[k];
      });
    }
    return retObj;
  }
}

/**
 * Data Mart related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * DataMart related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.datamart.datasource1 = 'MYDS_NAME';
 *
 * @example
 * this.prefs.datamart.prefsChanged.subscribe( (prefs) => { console.log('datamart pref change happened.', prefs); })
 */
export class SzDataMartPrefs extends SzSdkPrefsBase {
  // private vars
  /** @internal */
  private _dataSource1: string = undefined;
  private _dataSource2: string = undefined;
  private _defaultDataSource1: string = undefined;
  private _defaultDataSource2: string = undefined;
  private _defaultMatchLevel: number = undefined;
  private _defaultStatType: SzCrossSourceSummaryCategoryType = undefined;
  private _rememberSelectedDataSources: boolean = true;
  private _sampleDataSource1: string = undefined;
  private _sampleDataSource2: string = undefined;
  private _samplePageSize: number = 100;
  private _sampleSize: number = 100;
  private _sampleStatType: SzCrossSourceSummaryCategoryType;
  private _sampleMatchLevel: number;
  private _showAllColumns: boolean = false;
  private _showDiagramHeader: boolean = true;
  private _showMatchKeyFiltersOnSelect: boolean = true;
  private _truncateDataTableCellLines: number | boolean = true;
  private _wrapDataTableCellLines: boolean = true;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'dataSource1',
    'dataSource2',
    'defaultDataSource1',
    'defaultDataSource2',
    'defaultMatchLevel',
    'defaultStatType',
    'rememberSelectedDataSources',
    'sampleDataSource1',
    'sampleDataSource2',
    'sampleMatchLevel',
    'samplePageSize',
    'sampleSize',
    'sampleStatType',
    'showAllColumns',
    'showDiagramHeader',
    'showMatchKeyFiltersOnSelect',
    'truncateDataTableCellLines',
    'wrapDataTableCellLines'
  ]
  // -------------- getters and setters
  /** first datasource to use in the datamart stats queries */
  public get dataSource1(): string {
    return this._dataSource1;
  }
  /** first datasource to use in the datamart stats queries */
  public set dataSource1(value: string) {
    this._dataSource1 = value;
    if(this._rememberSelectedDataSources) { this._defaultDataSource1 = value; }
    if(!this.bulkSet) this.prefChanged.next({name: 'dataSource1', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** first datasource to use in the datamart stats queries */
  public get dataSource2(): string {
    return this._dataSource2;
  }
  /** first datasource to use in the datamart stats queries */
  public set dataSource2(value: string) {
    this._dataSource2 = value;
    if(this._rememberSelectedDataSources) { this._defaultDataSource2 = value; }
    if(!this.bulkSet) this.prefChanged.next({name: 'dataSource2', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** first datasource to use as the default in datamart stats queries */
  public get defaultDataSource1(): string {
    return this._defaultDataSource1;
  }
  /** first datasource to use as the default in datamart stats queries */
  public set defaultDataSource1(value: string) {
    this._defaultDataSource1 = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'defaultDataSource1', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** second datasource to use as the default in datamart stats queries */
  public get defaultDataSource2(): string {
    return this._defaultDataSource2;
  }
  /** second datasource to use as the default in datamart stats queries */
  public set defaultDataSource2(value: string) {
    this._defaultDataSource2 = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'defaultDataSource2', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** first datasource to use in the datamart stats queries */
  public get defaultMatchLevel(): number {
    return this._defaultMatchLevel;
  }
  /** first datasource to use in the datamart stats queries */
  public set defaultMatchLevel(value: number) {
    this._defaultMatchLevel = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'defaultMatchLevel', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** first datasource to use in the datamart stats queries */
  public get defaultStatType(): SzCrossSourceSummaryCategoryType {
    return this._defaultStatType;
  }
  /** first datasource to use in the datamart stats queries */
  public set defaultStatType(value: SzCrossSourceSummaryCategoryType) {
    this._defaultStatType = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'defaultStatType', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** if true and there are values for "dataSource1" and/or "dataSource2" then the datatable will
   * default to these previous values */
  public get rememberSelectedDataSources(): boolean {
    return this._rememberSelectedDataSources;
  }
  /** if true and there are values for "dataSource1" and/or "dataSource2" then the datatable will
   * default to these previous values */
  public set rememberSelectedDataSources(value: boolean) {
    this._rememberSelectedDataSources = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'rememberSelectedDataSources', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  /** first datasource to use in the datamart sampling stats queries */
  public get sampleDataSource1(): string {
    return this._sampleDataSource1;
  }
  /** first datasource to use in the datamart sampling stats queries */
  public set sampleDataSource1(value: string) {
    this._sampleDataSource1 = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'sampleDataSource1', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** second datasource to use in the datamart sampling stats queries */
  public get sampleDataSource2(): string {
    return this._sampleDataSource2;
  }
  /** second datasource to use in the datamart sampling stats queries */
  public set sampleDataSource2(value: string) {
    this._sampleDataSource2 = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'sampleDataSource2', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** sample match level parameter to use in stats queries */
  public get sampleMatchLevel(): number {
    return this._sampleMatchLevel;
  }
  /** sample match level parameter to use in stats queries */
  public set sampleMatchLevel(value: number) {
    this._sampleMatchLevel = value;
    if(this._rememberSelectedDataSources) { this._defaultMatchLevel = value; }
    if(!this.bulkSet) this.prefChanged.next({name: 'sampleMatchLevel', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** sample page size parameter to use in stats queries */
  public get samplePageSize(): number {
    return this._samplePageSize;
  }
  /** sample page size parameter to use in stats queries */
  public set samplePageSize(value: number) {
    this._samplePageSize = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'samplePageSize', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** samplesize parameter to use in stats queries */
  public get sampleSize(): number {
    return this._sampleSize;
  }
  /** samplesize parameter to use in stats queries */
  public set sampleSize(value: number) {
    this._sampleSize = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'sampleSize', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** sample stat type enum member value*/
  public get sampleStatType(): SzCrossSourceSummaryCategoryType {
    return this._sampleStatType;
  }
  /** sample stat type enum member value*/
  public set sampleStatType(value: SzCrossSourceSummaryCategoryType) {
    this._sampleStatType = value;
    if(this._rememberSelectedDataSources) { this._defaultStatType = value; }
    if(!this.bulkSet) this.prefChanged.next({name: 'sampleStatType', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not hidden or empty columns are shown by default */
  public get showAllColumns(): boolean {
    return this._showAllColumns;
  }
  /** whether or not hidden or empty columns are shown by default */
  public set showAllColumns(value: boolean) {
    this._showAllColumns = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'showAllColumns', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not the venn diagrams are expanded */
  public get showDiagramHeader(): boolean {
    return this._showDiagramHeader;
  }
  /** whether or not the venn diagrams are expanded */
  public set showDiagramHeader(value: boolean) {
    this._showDiagramHeader = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'showDiagramHeader', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not prompt the user to select a match key on diagram click */
  public get showMatchKeyFiltersOnSelect(): boolean {
    return this._showMatchKeyFiltersOnSelect;
  }
  /** whether or not prompt the user to select a match key on diagram click */
  public set showMatchKeyFiltersOnSelect(value: boolean) {
    this._showMatchKeyFiltersOnSelect = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'showMatchKeyFiltersOnSelect', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** truncate table cell data at X number of lines, or not at all */
  public get truncateDataTableCellLines(): boolean | number {
    return this._truncateDataTableCellLines;
  }
  /** truncate table cell data at X number of lines, or not at all */
  public set truncateDataTableCellLines(value: boolean | number) {
    this._truncateDataTableCellLines = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'truncateDataTableCellLines', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** wrap lines displayed in table cells */
  public get wrapDataTableCellLines(): boolean {
    return this._wrapDataTableCellLines;
  }
  /** wrap lines displayed in table cells */
  public set wrapDataTableCellLines(value: boolean) {
    this._wrapDataTableCellLines = value;
    if(!this.bulkSet) this.prefChanged.next({name: 'wrapDataTableCellLines', value: value});
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  /**
   * publish out a "first" real payload so that
   * subscribers get an initial payload from this subclass
   * instead of the empty superclass
   **/
  constructor(){
    super();
    this.prefsChanged.next( this.toJSONObject() );
  }
}

/**
 * search form related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * admin area related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.admin.streamConnectionProperties = {
    connected: boolean;
    clientId?: string;
    hostname: string;
    sampleSize: number;
    port?: number;
    connectionTest: boolean;
    reconnectOnClose: boolean;
 * };
 *
 * @example
 * this.prefs.searchResults.prefsChanged.subscribe( (prefs) => { console.log('search form pref change happened.', prefs); })

 */
export class SzAdminPrefs extends SzSdkPrefsBase {
  // --------------- private vars
  /** @internal */
  private _streamAnalysisConfig: AdminStreamAnalysisConfig = {
    sampleSize: 10000,
    uploadRate: -1
  };
  /** @internal */
  private _streamConnectionProperties: AdminStreamConnProperties | undefined;
  /** @internal */
  private _streamLoadConfig: AdminStreamLoadConfig = {
    autoCreateMissingDataSources: false,
    uploadRate: -1
  };
  /** @internal */
  private _useStreamingForAnalysis: boolean = false;
  /** @internal */
  private _useStreamingForLoad: boolean = false;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'streamAnalysisConfig',
    'streamConnectionProperties',
    'streamLoadConfig',
    'useStreamingForAnalysis',
    'useStreamingForLoad',
  ]

  // ------------------- getters and setters
  /** configuration parameters for doing analysis on a file stream prior to importing */
  public get streamAnalysisConfig(): AdminStreamAnalysisConfig {
    return this._streamAnalysisConfig;
  }
  /** configuration parameters for doing analysis on a file stream prior to importing */
  public set streamAnalysisConfig(value: AdminStreamAnalysisConfig) {
    this._streamAnalysisConfig = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** connection parameters defining how and where to stream to bulk-loading endpoints */
  public get streamConnectionProperties(): AdminStreamConnProperties | undefined {
    return this._streamConnectionProperties;
  }
  /** connection parameters defining how and where to stream to bulk-loading endpoints */
  public set streamConnectionProperties(value: AdminStreamConnProperties | undefined) {
    this._streamConnectionProperties = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** configuration parameters for related to importing records using the stream connection */
  public get streamLoadConfig(): AdminStreamLoadConfig {
    return this._streamLoadConfig;
  }
  /** configuration parameters for related to importing records using the stream connection */
  public set streamLoadConfig(value: AdminStreamLoadConfig) {
    this._streamLoadConfig = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not to use the streamConnectionProperties to do analysis through websocket stream. */
  public get useStreamingForAnalysis(): boolean {
    return this._useStreamingForAnalysis;
  }
  /** whether or not to use the streamConnectionProperties to do analysis through websocket stream. */
  public set useStreamingForAnalysis(value: boolean) {
    this._useStreamingForAnalysis = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not to use the streamConnectionProperties to do analysis through websocket stream. */
  public get useStreamingForLoad(): boolean {
    return this._useStreamingForLoad;
  }
  /** whether or not to use the streamConnectionProperties to do record importing through websocket stream. */
  public set useStreamingForLoad(value: boolean) {
    this._useStreamingForLoad = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  constructor(){
    super();
    /**
     * publish out a "first" real payload so that
     * subscribers get an initial payload from this subclass
     * instead of the empty superclass
     **/
    this.prefsChanged.next( this.toJSONObject() );
  }
}

/**
 * search form related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * search form related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.searchForm.allowedTypeAttributes = ['SSN_NUMBER','DRIVERS_LICENSE_NUMBER'];
 *
 * @example
 * this.prefs.searchResults.prefsChanged.subscribe( (prefs) => { console.log('search form pref change happened.', prefs); })

 */
export class SzSearchFormPrefs extends SzSdkPrefsBase {
  // --------------- private vars
  /** @internal */
  private _rememberLastSearches: number = 10;
  /** @internal */
  private _disableSearchHistory: boolean = false;
  /** @internal */
  private _savedSearches: SzSearchParamsFolio[];
  /** @internal */
  private _searchHistory: SzSearchHistoryFolio;
  private _allowedTypeAttributes: string[] = [
    'NIN_NUMBER',
    'ACCOUNT_NUMBER',
    'SSN_NUMBER',
    'SSN_LAST4',
    'DRIVERS_LICENSE_NUMBER',
    'PASSPORT_NUMBER',
    'NATIONAL_ID_NUMBER',
    'OTHER_ID_NUMBER',
    'TAX_ID_NUMBER',
    'TRUSTED_ID_NUMBER'
  ];
  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'rememberLastSearches',
    'disableSearchHistory',
    'allowedTypeAttributes',
    'savedSearches',
    'searchHistory'
  ]

  // ------------------- getters and setters
  /** remember last X searches in autofill. */
  public get rememberLastSearches(): number {
    return this._rememberLastSearches;
  }
  /** remember last X searches in autofill. */
  public set rememberLastSearches(value: number) {
    this._rememberLastSearches = value;
    if( this._searchHistory && this._searchHistory.maxItems !== value) { this._searchHistory.maxItems = value; }
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not to disable search form history drop downs. */
  public get disableSearchHistory(): boolean {
    return this._disableSearchHistory;
  }
  /** whether or not to disable search form history drop downs. */
  public set disableSearchHistory(value: boolean) {
    this._disableSearchHistory = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** get list of last searches performed. */
  public get savedSearches(): SzSearchParamsFolio[] {
    return this._savedSearches;
  }
  /** update list of last searches performed. */
  public set savedSearches(value: SzSearchParamsFolio[]) {
    this._savedSearches = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** get list of last searches performed. */
  public get searchHistory(): SzSearchHistoryFolio {
    return this._searchHistory;
  }
  /** update list of last searches performed. */
  public set searchHistory(value: SzSearchHistoryFolio) {
    this._searchHistory = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** the allowed identifier types to show in the identifier pulldown */
  public get allowedTypeAttributes(): string[] {
    return this._allowedTypeAttributes;
  }
  /** the allowed identifier types to show in the identifier pulldown */
  public set allowedTypeAttributes(value: string[]) {
    this._allowedTypeAttributes = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  constructor(){
    super();
    /**
     * publish out a "first" real payload so that
     * subscribers get an initial payload from this subclass
     * instead of the empty superclass
     **/
    this.prefsChanged.next( this.toJSONObject() );
  }

  /**
   * the search form prefs contain a folio collection that automagically update
   * when a user executes a search. Because of this additional functionality
   * the usual fromJSONObject needs to perform some special logic to initialize
   * the prefs from JSON like create class instances etc.
   */
  public override fromJSONObject(value: string) {
    this.bulkSet = true;
    let _isChanged = false;
    if (this.jsonKeys && this.jsonKeys.forEach) {
      // console.warn('SzSearchFormPrefs.fromJSONObject: ', this.jsonKeys);
      this.jsonKeys.forEach((k: string) => {
        if( value[k] !== undefined ){
          if( k === 'searchHistory'){
            // special case: takes JSON in
            // and creates SzSearchHistoryFolio with
            // items inside it
            const _searchHistoryFolio: SzSearchHistoryFolio = new SzSearchHistoryFolio();
            _searchHistoryFolio.fromJSONObject(value[k]);

            this._searchHistory = _searchHistoryFolio;
            // console.warn('SzSearchFormPrefs.fromJSONObject: _searchHistory = ', this._searchHistory);
          } else {
            try{
              this[k] = (value[k] && value[k].fromJSONObject ) ? value[k].fromJSONObject() : value[k];
              _isChanged = true;
              // console.log('SzSearchFormPrefs.fromJSONObject: "'+ k +'"', value[k].fromJSONObject());
            } catch (err) {
              // console.warn('attempted to get prefVal, but pref unset. ', err)
            };
          }
        }
      });
    }
    this.bulkSet = false;
    if(_isChanged){
      this.prefsChanged.next( this.toJSONObject() );
    }
  }
}

/**
 * search results related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * search results related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.searchResults.showOtherData = true;
 * this.prefs.searchResults.truncateOtherDataAt = 3;
 * this.prefs.searchResults.truncateIdentifierDataAt =  2;
 *
 * @example
 * this.prefs.searchResults.prefsChanged.subscribe( (prefs) => { console.log('search results pref change happened.', prefs); })
 */
export class SzSearchResultsPrefs extends SzSdkPrefsBase {
  // ------------------ private vars
  /** @internal */
  private _openInNewTab: boolean = false;
  /** @internal */
  private _showOtherData: boolean = false;
  /** @internal */
  private _showHowButton: boolean = false;
  /** @internal */
  private _showIdentifierData: boolean = false;
  /** @internal */
  private _showMatchKeys: boolean | undefined;
  /** @internal */
  private _truncateRecordsAt: number = 3;
  /** @internal */
  private _showEmbeddedGraph?: boolean = false;
  /** @internal */
  private _linkToEmbeddedGraph?: boolean = false;
  /** @internal */
  private _showCharacteristicData: boolean = false;
  /** @internal */
  private _truncateOtherDataAt: number = 3;
  /** @internal */
  private _truncateCharacteristicDataAt: number = 3;
  /** @internal */
  private _showRecordIds: boolean = false;
  /** @internal */
  private _truncateIdentifierDataAt: number = 4;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'openInNewTab',
    'showCharacteristicData',
    'showHowButton',
    'showIdentifierData',
    'showMatchKeys',
    'showOtherData',
    'truncateRecordsAt',
    'truncateOtherDataAt',
    'truncateCharacteristicDataAt',
    'showEmbeddedGraph',
    'showRecordIds',
    'linkToEmbeddedGraph',
    'truncateIdentifierDataAt'
  ];
  override typemap = {
    'openInNewTab':                 'boolean',
    'showCharacteristicData':       'boolean',
    'showHowButton':                'boolean',
    'showIdentifierData':           'boolean',
    'showMatchKeys':                'boolean',
    'showOtherData':                'boolean',
    'truncateRecordsAt':            'number',
    'truncateOtherDataAt':          'number',
    'truncateCharacteristicDataAt': 'number',
    'showEmbeddedGraph':            'boolean',
    'showRecordIds':                'boolean',
    'linkToEmbeddedGraph':          'boolean',
    'truncateIdentifierDataAt':     'number'
  }

  // -------------------- getters and setters
  /** open entity detail in new tab when link clicked */
  public get openInNewTab(): boolean {
    return this._openInNewTab;
  }
  /** open entity detail in new tab when link clicked */
  public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" in search results */
  public get showOtherData(): boolean {
    return this._showOtherData;
  }
  /** show "other data" in search results */
  public set showOtherData(value: boolean) {
    this._showOtherData = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "how" button in search results */
  public get showHowButton(): boolean {
    return this._showHowButton;
  }
  /** show "how" button in search results */
  public set showHowButton(value: boolean) {
    this._showHowButton = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" in search results */
  public get showIdentifierData(): boolean {
    return this._showIdentifierData;
  }
  /** show "other data" in search results */
  public set showIdentifierData(value: boolean) {
    this._showIdentifierData = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "attribute data" in search results. ie DOB, favorite cat */
  public get showCharacteristicData(): boolean {
    return this._showCharacteristicData;
  }
  /** show "attribute data" in search results. ie DOB, favorite cat */
  public set showCharacteristicData(value: boolean) {
    this._showCharacteristicData = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "match keys" in search results. */
  public get showMatchKeys(): boolean {
    return this._showMatchKeys;
  }
  /** show "match keys" in search results. */
  public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "record ids" in search results. currently not implemented in view */
  public get showRecordIds(): boolean {
    return this._showRecordIds;
  }
  /** show "record ids" in search results. currently not implemented in view */
  public set showRecordIds(value: boolean) {
    this._showRecordIds = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** truncate "records" shown before ellipsis in search results. currently not implemented in view */
  public get truncateRecordsAt(): number {
    return this._truncateRecordsAt;
  }
  /** truncate "records" shown before ellipsis in search results. currently not implemented in view */
  public set truncateRecordsAt(value: number) {
    this._truncateRecordsAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** truncate "other data" shown before ellipsis in search results. */
  public get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  /** truncate "other data" shown before ellipsis in search results. */
  public set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** truncate "attribute data" shown before ellipsis in search results. */
  public get truncateCharacteristicDataAt(): number {
    return this._truncateCharacteristicDataAt;
  }
  /** truncate "attribute data" shown before ellipsis in search results. */
  public set truncateCharacteristicDataAt(value: number) {
    this._truncateCharacteristicDataAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show embedded graph component in search results. currently not implemented */
  public get showEmbeddedGraph(): boolean {
    return this._showEmbeddedGraph;
  }
  /** show embedded graph component in search results. currently not implemented */
  public set showEmbeddedGraph(value: boolean) {
    this._showEmbeddedGraph = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** clicking on search result highlights in embedded graph. currently not implemented */
  public get linkToEmbeddedGraph(): boolean {
    return this._linkToEmbeddedGraph;
  }
  /** clicking on search result highlights in embedded graph. currently not implemented */
  public set linkToEmbeddedGraph(value: boolean) {
    this._linkToEmbeddedGraph = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** truncate "identifier data" shown before ellipsis in search results. */
  public get truncateIdentifierDataAt(): number {
    return this._truncateIdentifierDataAt;
  }
  /** truncate "identifier data" shown before ellipsis in search results. */
  public set truncateIdentifierDataAt(value: number) {
    this._truncateIdentifierDataAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  constructor(){
    super();
    /**
     * publish out a "first" real payload so that
     * subscribers get an initial payload from this subclass
     * instead of the empty superclass
     **/
    this.prefsChanged.next( this.toJSONObject() );
  }
}
/**
 * entity detail related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * entity detail prefs.
 *
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.entityDetail.showGraphSection = false;
 * this.prefs.entityDetail.showOtherDataInSummary =  true;
 *
 * @example
 * this.prefs.entityDetail.prefsChanged.subscribe( (prefs) => { console.log('entity detail pref change happened.', prefs); })
 */
export class SzEntityDetailPrefs extends SzSdkPrefsBase {
  /** @internal */
  private _showGraphSection: boolean = true;
  /** @internal */
  private _showHowSection: boolean = false;
  /** @internal */
  private _showMatchesSection: boolean = true;
  /** @internal */
  private _showPossibleMatchesSection: boolean = true;
  /** @internal */
  private _showPossibleRelationshipsSection: boolean = true;
  /** @internal */
  private _showDisclosedSection: boolean = true;
  /** @internal */
  private _graphSectionCollapsed: boolean = false;
  /** @internal */
  private _howSectionCollapsed: boolean = false;
  /** @internal */
  private _recordsSectionCollapsed: boolean = false;
  /** @internal */
  private _possibleMatchesSectionCollapsed: boolean = false;
  /** @internal */
  private _possibleRelationshipsSectionCollapsed: boolean = false;
  /** @internal */
  private _disclosedRelationshipsSectionCollapsed: boolean = false;
  /** @internal */
  private _rememberSectionCollapsedState: boolean = true;
  /** @internal */
  private _truncateSummaryAt: number = 4;
  /** @internal */
  private _showOtherData: boolean = true;
  /** @internal */
  private _truncateOtherDataAt: number = 5;
  /** @internal */
  private _openLinksInNewTab: boolean = false;
  /** @internal */
  private _showOtherDataInRecords: boolean = true;
  /** @internal */
  private _showOtherDataInEntities: boolean = false;
  /** @internal */
  private _showOtherDataInSummary: boolean = false;
  /** @internal */
  private _truncateOtherDataInRecordsAt: number = 5;
  /** @internal */
  private _hideGraphWhenZeroRelations: boolean = true;
  /** @internal */
  private _showRecordIdWhenNative: boolean = true;
  /** @internal */
  private _showTopEntityRecordIdsWhenSingular: boolean = false;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'showGraphSection',
    'showHowSection',
    'showMatchesSection',
    'showPossibleMatchesSection',
    'showPossibleRelationshipsSection',
    'showDisclosedSection',
    'graphSectionCollapsed',
    'howSectionCollapsed',
    'recordsSectionCollapsed',
    'possibleMatchesSectionCollapsed',
    'possibleRelationshipsSectionCollapsed',
    'disclosedRelationshipsSectionCollapsed',
    'rememberSectionCollapsedState',
    'truncateSummaryAt',
    'showOtherData',
    'truncateOtherDataAt',
    'openLinksInNewTab',
    'showOtherDataInRecords',
    'showOtherDataInEntities',
    'showOtherDataInSummary',
    'truncateOtherDataInRecordsAt',
    'hideGraphWhenZeroRelations',
    'showRecordIdWhenNative',
    'showTopEntityRecordIdsWhenSingular'
  ]

  // ------------------ getters and setters
  /** show graph section */
  public get showGraphSection(): boolean {
    return this._showGraphSection;
  }
  /** show graph section */
  public set showGraphSection(value: boolean) {
    this._showGraphSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show graph section */
  public get showHowSection(): boolean {
    return this._showHowSection;
  }
  /** show graph section */
  public set showHowSection(value: boolean) {
    this._showHowSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show matches/records section */
  public get showMatchesSection(): boolean {
    return this._showMatchesSection;
  }
  /** show matches/records section */
  public set showMatchesSection(value: boolean) {
    this._showMatchesSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show possible matches section */
  public get showPossibleMatchesSection(): boolean {
    return this._showPossibleMatchesSection;
  }
  /** show possible matches section */
  public set showPossibleMatchesSection(value: boolean) {
    this._showPossibleMatchesSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show possible relationships section */
  public get showPossibleRelationshipsSection(): boolean {
    return this._showPossibleRelationshipsSection;
  }
  /** show possible relationships section */
  public set showPossibleRelationshipsSection(value: boolean) {
    this._showPossibleRelationshipsSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show disclosed relationships section */
  public get showDisclosedSection(): boolean {
    return this._showDisclosedSection;
  }
  /** show disclosed relationships section */
  public set showDisclosedSection(value: boolean) {
    this._showDisclosedSection = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** graph section collapsed */
  public get graphSectionCollapsed(): boolean {
    return this._graphSectionCollapsed;
  }
  /** graph section collapsed */
  public set graphSectionCollapsed(value: boolean) {
    this._graphSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** how report section collapsed */
  public get howSectionCollapsed(): boolean {
    return this._howSectionCollapsed;
  }
  /** how report section collapsed */
  public set howSectionCollapsed(value: boolean) {
    this._howSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** records/matches section collapsed */
  public get recordsSectionCollapsed(): boolean {
    return this._recordsSectionCollapsed;
  }
  /** records/matches section collapsed */
  public set recordsSectionCollapsed(value: boolean) {
    this._recordsSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** possible matches section collapsed */
  public get possibleMatchesSectionCollapsed(): boolean {
    return this._possibleMatchesSectionCollapsed;
  }
  /** possible matches section collapsed */
  public set possibleMatchesSectionCollapsed(value: boolean) {
    this._possibleMatchesSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** possible relationships section collapsed */
  public get possibleRelationshipsSectionCollapsed(): boolean {
    return this._possibleRelationshipsSectionCollapsed;
  }
  /** possible relationships section collapsed */
  public set possibleRelationshipsSectionCollapsed(value: boolean) {
    this._possibleRelationshipsSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** disclosed relationships section collapsed */
  public get disclosedRelationshipsSectionCollapsed(): boolean {
    return this._disclosedRelationshipsSectionCollapsed;
  }
  /** disclosed relationships section collapsed */
  public set disclosedRelationshipsSectionCollapsed(value: boolean) {
    this._disclosedRelationshipsSectionCollapsed = value;
    if(!this.bulkSet && this._rememberSectionCollapsedState) this.prefsChanged.next( this.toJSONObject() );
  }
  /** whether or not to publish change events on property value changes.
   * useful for not getting notified on bulk property sets.
   */
  public get rememberSectionCollapsedState(): boolean {
    return this._rememberSectionCollapsedState;
  }
  /** whether or not to publish change events on property value changes.
   * useful for not getting notified on bulk property sets.
   */
  public set rememberSectionCollapsedState(value: boolean) {
    this._rememberSectionCollapsedState = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** rows to show in header summary before ellipsis */
  public get truncateSummaryAt(): number {
    return this._truncateSummaryAt;
  }
  /** rows to show in header summary before ellipsis */
  public set truncateSummaryAt(value: number) {
    this._truncateSummaryAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" column in header summary */
  public get showOtherData(): boolean {
    return this._showOtherData;
  }
  /** show "other data" column in header summary */
  public set showOtherData(value: boolean) {
    this._showOtherData = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** rows of "other data" to show */
  public get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  /** rows of "other data" to show */
  public set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** open entity row clicks in new tab */
  public get openLinksInNewTab(): boolean {
    return this._openLinksInNewTab;
  }
  /** open entity row clicks in new tab */
  public set openLinksInNewTab(value: boolean) {
    this._openLinksInNewTab = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" in matches/records section */
  public get showOtherDataInRecords(): boolean {
    return this._showOtherDataInRecords;
  }
  /** show "other data" in matches/records section */
  public set showOtherDataInRecords(value: boolean) {
    this._showOtherDataInRecords = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" in sections other than matches section */
  public get showOtherDataInEntities(): boolean {
    return this._showOtherDataInEntities;
  }
  /** show "other data" in sections other than matches section */
  public set showOtherDataInEntities(value: boolean) {
    this._showOtherDataInEntities = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show "other data" in header summary below icon */
  public get showOtherDataInSummary(): boolean {
    return this._showOtherDataInSummary;
  }
  /** show "other data" in header summary below icon */
  public set showOtherDataInSummary(value: boolean) {
    this._showOtherDataInSummary = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** how many lines of "other data" to show in matches section before ellipsis */
  public get truncateOtherDataInRecordsAt(): number {
    return this._truncateOtherDataInRecordsAt;
  }
  /** how many lines of "other data" to show in matches section before ellipsis */
  public set truncateOtherDataInRecordsAt(value: number) {
    this._truncateOtherDataInRecordsAt = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** hide the graph when 0 relationships in network query are returned for entity */
  public get hideGraphWhenZeroRelations(): boolean {
    return this._hideGraphWhenZeroRelations;
  }
  /** hide the graph when 0 relationships in network query are returned for entity */
  public set hideGraphWhenZeroRelations(value: boolean) {
    this._hideGraphWhenZeroRelations = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show record id's in matches/records section when not auto-generated hash. not fully implemented */
  public get showRecordIdWhenNative(): boolean {
    return this._showRecordIdWhenNative;
  }
  /** show record id's in matches/records section when not auto-generated hash. not fully implemented */
  public set showRecordIdWhenNative(value: boolean) {
    this._showRecordIdWhenNative = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show record id next to data source name in entity rows when only one source record */
  public get showTopEntityRecordIdsWhenSingular(): boolean {
    return this._showTopEntityRecordIdsWhenSingular;
  }
  /** show record id next to data source name in entity rows when only one source record */
  public set showTopEntityRecordIdsWhenSingular(value: boolean) {
    this._showTopEntityRecordIdsWhenSingular = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }

  constructor(){
    super();
    /**
     * publish out a "first" real payload so that
     * subscribers get an initial payload from this subclass
     * instead of the empty superclass
     **/
    this.prefsChanged.next( this.toJSONObject() );
  }
}

/**
 * Graph related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * graph related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.graph.showMatchKeys = true;
 * this.prefs.graph.buildOut =  5;
 *
 * @example
 * this.prefs.graph.prefsChanged.subscribe( (prefs) => { console.log('graph pref change happened.', prefs); })
 */
export class SzGraphPrefs extends SzSdkPrefsBase {
  // private vars
  /** @internal */
  private _openInNewTab: boolean = false;
  /** @internal */
  private _openInSidePanel: boolean = false;
  /** @internal */
  private _dataSourceColors: SzDataSourceComposite[] = [];
  /** @internal */
  private _showLinkLabels: boolean = true;
  /** @internal */
  private _rememberStateOptions: boolean = true;
  /** @internal */
  private _maxDegreesOfSeparation: number = 1;
  /** @internal */
  private _maxEntities: number = 40;
  /** @internal */
  private _buildOut: number = 1;
  /** @internal */
  private _dataSourcesFiltered: string[] = [
    'SAMPLE PERSON'
  ];
  /** @internal */
  private _matchKeysIncluded: string[] = [];
  /** @internal */
  private _matchKeyTokensIncluded: string[] = [];
  /** @internal */
  private _matchKeyCoreTokensIncluded: string[] = [];
  /** @internal */
  private _neverFilterQueriedEntityIds: boolean = true;
  /** @internal */
  private _queriedEntitiesColor: string | undefined = "#465BA8";
  /** @internal */
  private _focusedEntitiesColor: string | undefined = "#465BA8";
  /** @internal */
  private _linkColor: string | undefined = "#999";
  /** @internal */
  private _indirectLinkColor: string | undefined = "#999";
  /** @internal */
  private _unlimitedMaxEntities: boolean = true;
  /** @internal */
  private _unlimitedMaxScope: boolean = false;
  /** @internal */
  private _suppressL1InterLinks: boolean = true;
  /** @internal */
  private _matchKeyTokenSelectionScope: SzMatchKeyTokenFilterScope = SzMatchKeyTokenFilterScope.CORE;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'openInNewTab',
    'openInSidePanel',
    'dataSourceColors',
    'showLinkLabels',
    'rememberStateOptions',
    'maxDegreesOfSeparation',
    'maxEntities',
    'buildOut',
    'dataSourcesFiltered',
    'matchKeysIncluded',
    'matchKeyTokensIncluded',
    'matchKeyCoreTokensIncluded',
    'neverFilterQueriedEntityIds',
    'queriedEntitiesColor',
    'focusedEntitiesColor',
    'linkColor',
    'indirectLinkColor',
    'unlimitedMaxEntities',
    'unlimitedMaxScope',
    'suppressL1InterLinks',
    'matchKeyTokenSelectionScope'
  ]

  // -------------- getters and setters
  /** open graph entity clicks in new tab */
  public get openInNewTab(): boolean {
    return this._openInNewTab;
  }
  /** open graph entity clicks in new tab */
  public set openInNewTab(value: boolean) {
    let oldValue = this._openInNewTab;
    if(oldValue == value) { return; }
    this._openInNewTab = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "openInNewTab", newValue: value, oldValue: oldValue}) );
  }
  /** open graph entity clicks in side panel */
  public get openInSidePanel(): boolean {
    return this._openInSidePanel;
  }
  /** open graph entity clicks in side panel */
  public set openInSidePanel(value: boolean) {
    let oldValue = this._openInSidePanel;
    if(oldValue == value) { return; }
    this._openInSidePanel = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "openInSidePanel", newValue: value, oldValue: oldValue}) );
  }
  /** colors to apply to entity node when belonging to particular datasources */
  public get dataSourceColors(): SzDataSourceComposite[] {
    return this._dataSourceColors;
  }
  /** colors to apply to entity node when belonging to particular datasources */
  public set dataSourceColors(value: SzDataSourceComposite[]) {
    let oldValue = this._dataSourceColors;
    this._dataSourceColors = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "dataSourceColors", newValue: value, oldValue: oldValue}) );
  }
  /** show match keys/edge labels on relationships */
  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  /** show match keys/edge labels on relationships */
  public set showLinkLabels(value: boolean) {
    let oldValue = this._showLinkLabels;
    if(oldValue === value) { return; }
    this._showLinkLabels = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "showLinkLabels", newValue: value, oldValue: oldValue}) );
  }
  /** whether or not to publish change events on property value changes.
   * useful for not getting notified on bulk property sets.
   */
  public get rememberStateOptions(): boolean {
    return this._rememberStateOptions;
  }
  /** whether or not to publish change events on property value changes.
   * useful for not getting notified on bulk property sets.
   */
  public set rememberStateOptions(value: boolean) {
    let oldValue = this._rememberStateOptions;
    if(oldValue == value) { return; }
    // it controls whether the other setters send to event bus
    this._rememberStateOptions = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "rememberStateOptions", newValue: value, oldValue: oldValue}) );
  }
  /** maximum degrees of separation between relationships */
  public get maxDegreesOfSeparation(): number {
    return this._maxDegreesOfSeparation;
  }
  /** maximum degrees of separation between relationships */
  public set maxDegreesOfSeparation(value: number) {
    let oldValue = this._maxDegreesOfSeparation;
    if(oldValue == value) { return; }
    this._maxDegreesOfSeparation = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "maxDegreesOfSeparation", newValue: value, oldValue: oldValue}) );
  }
  /** maximum number of entities to show */
  public get maxEntities(): number {
    return this._maxEntities;
  }
  /** maximum number of entities to show */
  public set maxEntities(value: number) {
    let oldValue = this._maxEntities;
    if(oldValue == value) { return; }
    this._maxEntities = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "maxEntities", newValue: value, oldValue: oldValue}) );
  }
  /** how many nodes away from queried entity to show */
  public get buildOut(): number {
    return this._buildOut;
  }
  /** how many nodes away from queried entity to show */
  public set buildOut(value: number) {
    let oldValue = this._buildOut;
    if(oldValue == value) { return; }
    this._buildOut = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "buildOut", newValue: value, oldValue: oldValue}) );
  }
  /** hide any entity node when belonging to particular datasources */
  public get dataSourcesFiltered(): string[] {
    return this._dataSourcesFiltered;
  }
  /** hide any entity node when belonging to particular datasources */
  public set dataSourcesFiltered(value: string[]) {
    let oldValue = this._dataSourcesFiltered;
    if(oldValue && value && areArrayMembersEqual(oldValue, value)) {
      return;
    }
    this._dataSourcesFiltered = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "dataSourcesFiltered", newValue: value, oldValue: oldValue}) );
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public get matchKeysIncluded(): string[] {
    return this._matchKeysIncluded;
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public set matchKeysIncluded(value: string[]) {
    let oldValue = this._matchKeysIncluded;
    if(oldValue && value && areArrayMembersEqual(oldValue, value)) {
      return;
    }
    this._matchKeysIncluded = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "matchKeysIncluded", newValue: value, oldValue: oldValue}) );
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public get matchKeyTokensIncluded(): string[] {
    return this._matchKeyTokensIncluded;
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public set matchKeyTokensIncluded(value: string[]) {
    let oldValue = this._matchKeyTokensIncluded;
    if(oldValue && value && areArrayMembersEqual(oldValue, value)) {
      return;
    }
    this._matchKeyTokensIncluded = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "matchKeyTokensIncluded", newValue: value, oldValue: oldValue}) );
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public get matchKeyCoreTokensIncluded(): string[] {
    return this._matchKeyCoreTokensIncluded;
  }
  /** hide any entity node when relationship does not contain a particular match key */
  public set matchKeyCoreTokensIncluded(value: string[]) {
    let oldValue = this._matchKeyCoreTokensIncluded;
    if(oldValue && value && areArrayMembersEqual(oldValue, value)) {
      return;
    }
    this._matchKeyCoreTokensIncluded = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "matchKeyCoreTokensIncluded", newValue: value, oldValue: oldValue}) );
  }
  /** never filter out the entities that were explicity declared in query */
  public get neverFilterQueriedEntityIds(): boolean {
    return this._neverFilterQueriedEntityIds;
  }
  /** never filter out the entities that were explicity declared in query */
  public set neverFilterQueriedEntityIds(value: boolean) {
    let oldValue = this._neverFilterQueriedEntityIds;
    if(oldValue == value) { return; }
    this._neverFilterQueriedEntityIds = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "neverFilterQueriedEntityIds", newValue: value, oldValue: oldValue}) );
  }
  /** color of active or queried for entity or entities */
  public get queriedEntitiesColor(): string | undefined {
    return this._queriedEntitiesColor;
  }
  /** color of active or queried for entity or entities */
  public set queriedEntitiesColor(value: string | undefined) {
    let oldValue = this._queriedEntitiesColor;
    this._queriedEntitiesColor = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "queriedEntitiesColor", newValue: value, oldValue: oldValue}) );
  }
  /** color of focused/expanded entity or entities */
  public get focusedEntitiesColor(): string | undefined {
    return this._focusedEntitiesColor;
  }
  /** color of focused/expanded entity or entities */
  public set focusedEntitiesColor(value: string | undefined) {
    let oldValue = this._focusedEntitiesColor;
    if(oldValue == value) { return; }
    this._focusedEntitiesColor = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "focusedEntitiesColor", newValue: value, oldValue: oldValue}) );
  }
  /** color of link lines */
  public get linkColor(): string | undefined {
    return this._linkColor;
  }
  /** color of link lines */
  public set linkColor(value: string | undefined) {
    let oldValue = this._linkColor;
    if(oldValue == value) { return; }
    this._linkColor = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "linkColor", newValue: value, oldValue: oldValue}) );
  }
  /** color of link lines that are not directly connected to a focal entity */
  public get indirectLinkColor(): string | undefined {
    return this._indirectLinkColor;
  }
  /** color of link lines that are not directly connected to a focal entity */
  public set indirectLinkColor(value: string | undefined) {
    let oldValue = this._indirectLinkColor;
    if(oldValue == value) { return; }
    this._indirectLinkColor = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject({source: "indirectLinkColor", newValue: value, oldValue: oldValue}) );
  }
  /** whether or not to ignore the maxEntities value and always get
   * all related entities */
  public get unlimitedMaxEntities(): boolean {
    return this._unlimitedMaxEntities;
  }
  /** whether or not to ignore the maxEntities value and always get
   * all related entities */
  public set unlimitedMaxEntities(value: boolean) {
    let oldValue = this._unlimitedMaxEntities;
    if(oldValue == value) { return; }
    this._unlimitedMaxEntities = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "unlimitedMaxEntities", newValue: value, oldValue: oldValue}) );
  }
  /** whether or not to ignore the maxDegreesOfSeparation value and always get
   * build out to max */
   public get unlimitedMaxScope(): boolean {
    return this._unlimitedMaxScope;
  }
  /** whether or not to ignore the maxDegreesOfSeparation value and always get
   * build out to max */
  public set unlimitedMaxScope(value: boolean) {
    let oldValue = this._unlimitedMaxScope;
    if(oldValue == value) { return; }
    this._unlimitedMaxScope = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "unlimitedMaxScope", newValue: value, oldValue: oldValue}) );
  }
  /** whether or not to ignore the maxDegreesOfSeparation value and always get
   * build out to max */
   public get suppressL1InterLinks(): boolean {
    return this._suppressL1InterLinks;
  }
  /** whether or not to ignore the maxDegreesOfSeparation value and always get
   * build out to max */
  public set suppressL1InterLinks(value: boolean) {
    let oldValue = this._suppressL1InterLinks;
    if(oldValue == value) { return; }
    this._suppressL1InterLinks = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "suppressL1InterLinks", newValue: value, oldValue: oldValue}) );
  }
  /** whether or not match key token filtering should apply to ALL entities
   * OR just relationships that are directly related to the focal entity
   */
   public get matchKeyTokenSelectionScope(): SzMatchKeyTokenFilterScope {
    return this._matchKeyTokenSelectionScope;
  }
  /** whether or not match key token filtering should apply to ALL entities
   * OR just relationships that are directly related to the focal entity
   */
  public set matchKeyTokenSelectionScope(value: SzMatchKeyTokenFilterScope) {
    let oldValue = this._matchKeyTokenSelectionScope;
    if(oldValue == value) { return; }
    this._matchKeyTokenSelectionScope = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject({source: "matchKeyTokenSelectionScope", newValue: value, oldValue: oldValue}) );
  }


  /**
   * publish out a "first" real payload so that
   * subscribers get an initial payload from this subclass
   * instead of the empty superclass
   **/
  constructor(){
    super();
    this.prefsChanged.next( this.toJSONObject() );
  }
}


/**
 * How Report related preferences bus class.
 * used by {@link SzPrefsService} to store it's
 * How related prefs.
 * Should really be used from {@link SzPrefsService} context, not on its own.
 *
 * @example
 * this.prefs.how.showResolutionRule = true;
 *
 * @example
 * this.prefs.graph.prefsChanged.subscribe( (prefs) => { console.log('how pref change happened.', prefs); })
 */
export class SzHowPrefs extends SzSdkPrefsBase {
  // private vars
  /** @internal */
  private _showResolutionRule: boolean = false;
  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  override jsonKeys = [
    'showResolutionRule'
  ]
  // -------------- getters and setters
  /** whether or not to show the Resolution Rule code or principle in a card */
  public get showResolutionRule(): boolean {
    return this._showResolutionRule;
  }
  /** whether or not to show the Resolution Rule code or principle in a card */
  public set showResolutionRule(value: boolean) {
    this._showResolutionRule = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /**
   * publish out a "first" real payload so that
   * subscribers get an initial payload from this subclass
   * instead of the empty superclass
   **/
  constructor(){
    super();
    this.prefsChanged.next( this.toJSONObject() );
  }
}

/**
 * top level prefs model used for publishing preference
 * events.
 */
export interface SzSdkPrefsModel {
  admin?: any
  dataMart?: any,
  entityDetail?: any,
  graph?: any,
  how?: any,
  searchForm?: any,
  searchResults?: any,
};


/**
* Provides a composite UI Event BUS / Preferences datastore.
* every time a pref in the datastore is changed publishes a
* "prefsChanged" rxjs BehaviorSubject  that can be subscribed
* and responded to.
*
* when a component UI event happens(ie: user collapses all nodes in an entity detail section)
* the component updates the corresponding value through this service.
*
* representational state is published and responded to through this class.
* it is up to the end consumer what to do with this data. it is not stored anywhere
* other than in memory by default. the third example shows how to load from localstorage.
*
* @example // --- subscribe to prefs changes
* constructor(private prefs: SzPrefsService) {
*     this.prefs.prefsChanged.subscribe((prefs: SzSdkPrefsModel) => { console.log('prefs changed!', prefs); })
* }
*
* @example // --- get current state representation
* constructor(private prefs: SzPrefsService) {
*     currentState = this.prefs.toJSONObject();
* }
*
* @example // --- get and set from local storage
* constructor(private prefs: SzPrefsService, Inject(LOCAL_STORAGE) private storage: StorageService) {
*     // get from ls
*     let _ls = this.storage.get("name_of_local_storage_store");
*     this.prefs.fromJSONString( _ls );
*     // store in ls
*     this.prefs.prefsChanged.subscribe((prefs: SzSdkPrefsModel) => { this.storage.set("name_of_local_storage_store", prefs); })
* }
*
* @example // --- set graph section in ent detail to collapsed by default
* constructor(private prefs: SzPrefsService) {
*     // set graph to collapsed by default
*     this.prefs.entityDetail.graphSectionCollapsed = true;
* }
*
* @export
*/
@Injectable({
  providedIn: 'root'
})
export class SzPrefsService implements OnDestroy {
  /** subscription to notify subscribers to unbind @internal */
  private unsubscribe$ = new Subject<void>();
  /** instance of {@link SzSearchFormPrefs} */
  public searchForm?: SzSearchFormPrefs       = new SzSearchFormPrefs();
  /** instance of {@link SzSearchResultsPrefs} */
  public searchResults?: SzSearchResultsPrefs = new SzSearchResultsPrefs();
  /** instance of {@link SzGraphPrefs} */
  public dataMart?: SzDataMartPrefs           = new SzDataMartPrefs();
  /** instance of {@link SzEntityDetailPrefs} */
  public entityDetail?: SzEntityDetailPrefs   = new SzEntityDetailPrefs();
  /** instance of {@link SzGraphPrefs} */
  public graph?: SzGraphPrefs                 = new SzGraphPrefs();
  /** instance of {@link SzHowPrefs} */
  public how?: SzHowPrefs                     = new SzHowPrefs();
  /** instance of {@link SzAdminPrefs} */
  public admin?: SzAdminPrefs                 = new SzAdminPrefs();

  /**
   * subscribe for state change representation. */
  public prefsChanged: BehaviorSubject<SzSdkPrefsModel> = new BehaviorSubject<SzSdkPrefsModel>( this.toJSONObject() );

  /**
   * subscribe for state change representation. */
  public prefChanged: Subject<{name: string, value: any}> = new Subject<{name: string, value: any}>();

  /** get shallow JSON copy of services object state by calling
   * same method on namespace members.
   *
   * @example
   * constructor(private prefs: SzPrefsService) {
   *     currentState = this.prefs.toJSONObject();
   * }
   **/
  public toJSONObject() {
    let retObj: SzSdkPrefsModel = {};

    if(this.searchForm){
      retObj.searchForm = this.searchForm.toJSONObject();
    }
    if(this.searchResults){
      retObj.searchResults = this.searchResults.toJSONObject();
    }
    if(this.dataMart){
      retObj.dataMart = this.dataMart.toJSONObject();
    }
    if(this.entityDetail){
      retObj.entityDetail = this.entityDetail.toJSONObject();
    }
    if(this.graph){
      retObj.graph = this.graph.toJSONObject();
    }
    if(this.how){
      retObj.how = this.how.toJSONObject();
    }
    if(this.admin){
      retObj.admin = this.admin.toJSONObject();
    }
    return retObj;
  }
  /** populate values from JSON. bulk import basically. */
  public fromJSONObject(value: SzSdkPrefsModel) {
    if(!value || value == undefined){ return; }
    const _keys = Object.keys(value);
    _keys.forEach( (_k ) => {
      if( this[_k] && this[_k].fromJSONObject ){
        // object inheriting from 'SzSdkPrefsBase'
        if( _k === 'searchForm') {
          //console.log(`setting "${_k}" via this[_k].fromJSONObject`, value[_k]);
          this[_k].fromJSONObject( value[_k] );
        } else {
          this[_k].fromJSONObject( value[_k] );
        }
        //console.log(`setting "${_k}" via this[_k].fromJSONObject`, value[_k]);
      } else {
        //   maybe top level property
        //   :-/
        //console.log(`setting "${_k}" via direct assignment`, value[_k], this[_k]);
        this[_k] = value[_k];
      }
    });
  }
  /**
   * populate objects and values from JSON. bulk import basically. example shows bulk importing from local storage.
  * @example // --- use SzPrefsService.fromJSONString() to set/get from localstorage
  * constructor(private prefs: SzPrefsService, Inject(LOCAL_STORAGE) private storage: StorageService) {
  *     // get from ls
  *     let _ls = this.storage.get( name_of_local_storage_store );
  *     this.prefs.fromJSONString( _ls );
  *     // store in ls
  *     this.prefs.prefsChanged.subscribe((prefs: SzSdkPrefsModel) => { this.storage.set( name_of_local_storage_store, prefs); })
  * }
   **/
  public fromJSONString(value: string) {
    let _sVal = JSON.parse(value);
    if(_sVal.admin){
      this.entityDetail.fromJSONObject( _sVal.admin );
    }
    if(_sVal.dataMart){
      this.dataMart.fromJSONObject( _sVal.admin );
    }
    if(_sVal.entityDetail){
      this.entityDetail.fromJSONObject( _sVal.entityDetail );
    }
    if(_sVal.graph){
      this.graph.fromJSONObject( _sVal.graph );
    }
    if(_sVal.how){
      this.how.fromJSONObject( _sVal.how );
    }
    if(_sVal.searchForm){
      this.searchForm.fromJSONObject( _sVal.searchForm );
    }
    if(_sVal.searchResults){
      this.searchResults.fromJSONObject( _sVal.searchResults );
    }
  }
  /** get a serialized JSON string from current instance. bulk export. */
  public toJSONString(): string {
    return JSON.stringify(this.toJSONObject());
  }

  constructor(){
    // listen for any prefs changes
    // as one meta-observable
    const concat_prefchanges = merge(
      this.admin.prefsChanged,
      this.dataMart.prefChanged,
      this.entityDetail.prefsChanged,
      this.graph.prefsChanged,
      this.how.prefsChanged,
      this.searchForm.prefsChanged,
      this.searchResults.prefsChanged
    );
    // now filter and debounce
    // so that any back to back changes are
    // only published as a single event
    concat_prefchanges.pipe(
      takeUntil(this.unsubscribe$),
      debounce(() => timer(100))
    ).subscribe((prefsObj ) => {
      this.prefsChanged.next( this.toJSONObject() );
    });
  }

  /**
   * unsubscribe when component is destroyed
   * @internal
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
