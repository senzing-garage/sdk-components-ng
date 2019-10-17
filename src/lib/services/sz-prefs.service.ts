import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, merge, timer } from 'rxjs';
import { takeUntil, debounce } from 'rxjs/operators';
//import { Configuration as SzRestConfiguration, ConfigurationParameters as SzRestConfigurationParameters } from '@senzing/rest-api-client-ng';

/*
import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';
import { SzGraphConfigurationService } from '@senzing/sdk-graph-components';
*/

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
  public prefsChanged: BehaviorSubject<any> = new BehaviorSubject<any>(this.toJSONObject());

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  jsonKeys = [];

  // ------------------ methods

  /** get shallow JSON copy of object state. properties are filtered by members of {@link jsonKeys} */
  public toJSONObject() {
    const retObj = {};
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        if( this[k] !== undefined){
          try{
            retObj[k] = this[k];
          } catch (err) {
            // console.warn('attempted to get prefVal, but pref unset. ', err)
          };
        }
      });
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
            this[k] = value[k];
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
  jsonKeys = [
    'allowedTypeAttributes'
  ]

  // ------------------- getters and setters
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
  private _truncateRecordsAt: number = 3;
  /** @internal */
  private _showEmbeddedGraph?: boolean = false;
  /** @internal */
  private _linkToEmbeddedGraph?: boolean = false;
  /** @internal */
  private _showAttributeData: boolean = false;
  /** @internal */
  private _truncateOtherDataAt: number = 3;
  /** @internal */
  private _truncateAttributeDataAt: number = 3;
  /** @internal */
  private _showRecordIds: boolean = false;
  /** @internal */
  private _truncateIdentifierDataAt: number = 4;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  jsonKeys = [
    'openInNewTab',
    'showOtherData',
    'showAttributeData',
    'truncateRecordsAt',
    'truncateOtherDataAt',
    'truncateAttributeDataAt',
    'showEmbeddedGraph',
    'showRecordIds',
    'linkToEmbeddedGraph',
    'truncateIdentifierDataAt'
  ]

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
  /** show "attribute data" in search results. ie DOB, favorite cat */
  public get showAttributeData(): boolean {
    return this._showAttributeData;
  }
  /** show "attribute data" in search results. ie DOB, favorite cat */
  public set showAttributeData(value: boolean) {
    this._showAttributeData = value;
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
  public get truncateAttributeDataAt(): number {
    return this._truncateAttributeDataAt;
  }
  /** truncate "attribute data" shown before ellipsis in search results. */
  public set truncateAttributeDataAt(value: number) {
    this._truncateAttributeDataAt = value;
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
  private _showRecordIdWhenNative: boolean = false;
  /** @internal */
  private _showTopEntityRecordIdsWhenSingular: boolean = false;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  jsonKeys = [
    'showGraphSection',
    'showMatchesSection',
    'showPossibleMatchesSection',
    'showPossibleRelationshipsSection',
    'showDisclosedSection',
    'graphSectionCollapsed',
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
  private _dataSourceColors = {
    'owners':'#0088ff'
  };
  /** @internal */
  private _showMatchKeys: boolean = false;
  /** @internal */
  private _rememberStateOptions: boolean = true;
  /** @internal */
  private _maxDegreesOfSeparation: number = 1;
  /** @internal */
  private _maxEntities: number = 40;
  /** @internal */
  private _buildOut: number = 1;

  /** the keys of member setters or variables in the object
   * to output in json, or to take as json input
   */
  jsonKeys = [
    'openInNewTab',
    'openInSidePanel',
    'dataSourceColors',
    'showMatchKeys',
    'rememberStateOptions',
    'maxDegreesOfSeparation',
    'maxEntities',
    'buildOut'
  ]

  // -------------- getters and setters
  /** open graph entity clicks in new tab */
  public get openInNewTab(): boolean {
    return this._openInNewTab;
  }
  /** open graph entity clicks in new tab */
  public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject() );
  }
  /** open graph entity clicks in side panel */
  public get openInSidePanel(): boolean {
    return this._openInSidePanel;
  }
  /** open graph entity clicks in side panel */
  public set openInSidePanel(value: boolean) {
    this._openInSidePanel = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject() );
  }
  /** colors to apply to entity node when belonging to particular datasources */
  public get dataSourceColors(): any {
    return this._dataSourceColors;
  }
  /** colors to apply to entity node when belonging to particular datasources */
  public set dataSourceColors(value: any) {
    this._dataSourceColors = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject() );
  }
  /** show match keys/edge labels on relationships */
  public get showMatchKeys(): boolean {
    return this._showMatchKeys;
  }
  /** show match keys/edge labels on relationships */
  public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
    if(!this.bulkSet && this._rememberStateOptions) this.prefsChanged.next( this.toJSONObject() );
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
    // it controls whether the other setters send to event bus
    this._rememberStateOptions = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** maximum degrees of separatation between relationships */
  public get maxDegreesOfSeparation(): number {
    return this._maxDegreesOfSeparation;
  }
  /** maximum degrees of separatation between relationships */
  public set maxDegreesOfSeparation(value: number) {
    this._maxDegreesOfSeparation = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** maximum number of entities to show */
  public get maxEntities(): number {
    return this._maxEntities;
  }
  /** maximum number of entities to show */
  public set maxEntities(value: number) {
    this._maxEntities = value;
    if(!this.bulkSet) this.prefsChanged.next( this.toJSONObject() );
  }
  /** how many nodes away from queried entity to show */
  public get buildOut(): number {
    return this._buildOut;
  }
  /** how many nodes away from queried entity to show */
  public set buildOut(value: number) {
    this._buildOut = value;
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
  searchForm?: any,
  searchResults?: any,
  entityDetail?: any,
  graph?: any
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
  /**
   * subscribe for state change representation. */
  public prefsChanged: BehaviorSubject<SzSdkPrefsModel> = new BehaviorSubject<SzSdkPrefsModel>( this.toJSONObject() );
  /** instance of {@link SzSearchFormPrefs} */
  public searchForm?: SzSearchFormPrefs       = new SzSearchFormPrefs();
  /** instance of {@link SzSearchResultsPrefs} */
  public searchResults?: SzSearchResultsPrefs = new SzSearchResultsPrefs();
  /** instance of {@link SzEntityDetailPrefs} */
  public entityDetail?: SzEntityDetailPrefs   = new SzEntityDetailPrefs();
  /** instance of {@link SzGraphPrefs} */
  public graph?: SzGraphPrefs                 = new SzGraphPrefs();

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
    if(this.entityDetail){
      retObj.entityDetail = this.entityDetail.toJSONObject();
    }
    if(this.graph){
      retObj.graph = this.graph.toJSONObject();
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
        //console.log(`setting "${_k}" via this[_k].fromJSONObject`, value[_k]);
        this[_k].fromJSONObject( value[_k] );
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

    if(_sVal.searchForm){
      this.searchForm.fromJSONObject( _sVal.searchForm );
    }
    if(_sVal.searchResults){
      this.searchResults.fromJSONObject( _sVal.searchResults );
    }
    if(_sVal.entityDetail){
      this.entityDetail.fromJSONObject( _sVal.entityDetail );
    }
  }
  /** get a serialized JSON string from current instance. bulk export. */
  public toJSONString(): string {
    return JSON.stringify(this.toJSONObject());
  }

  constructor(){
    // listen for any prefs changes
    // as one meta-observeable
    const concat_prefchanges = merge(
      this.searchForm.prefsChanged,
      this.searchResults.prefsChanged,
      this.entityDetail.prefsChanged,
      this.graph.prefsChanged
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
