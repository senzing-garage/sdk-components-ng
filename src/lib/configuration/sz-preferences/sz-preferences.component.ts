import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { SzSdkPrefsModel, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';

/**
 * Provides a service integration web component(WC) that can be used to set, read, change, and
 * respond to UI bus event/preference changes.
 *
 * For Angular implementations we recommend using {@link SzPrefsService} as an injectable as it
 * provides the more robust solution.
 *
 * @example
 * <!-- (WC) javascript -->
 * <sz-wc-preferences id="prefsIntf"></sz-wc-preferences>
 * <script>document.getElementById('prefsIntf').GraphBuildOut = 5;</script>
 *
 * @example
 * <!-- (WC) By attribute: -->
 * <sz-wc-preferences
 * graph-build-out="20"></sz-wc-preferences>
 *
 * @example
 * <!-- (WC) javascript bulk initialize from local storage: -->
 * <sz-wc-preferences id="prefsIntf" show-controls="true"></sz-wc-preferences>
 * <script>
 * document.getElementById('prefsIntf').prefsFromJSONString = localStorage.getItem('NAME_OF_LS_KEY');
 * </script>
 *
 * @example
 * <!-- (WC) show other data in search results: -->
 * <sz-wc-preferences
 * search-results-show-other-data="true"></sz-wc-preferences>
 *
 * @example
 * <!-- (WC) show interactive UI: -->
 * <sz-wc-preferences
 * show-controls="true"></sz-wc-preferences>
 *
 * @example
 * <!-- (Angular) -->
 * <sz-preferences
 * (prefsChange)="myPrefsChangeHandler($event)">
 *
 * @export
 */
@Component({
    selector: 'sz-preferences',
    templateUrl: 'sz-preferences.component.html',
    styleUrls: ['sz-preferences.component.scss'],
    standalone: false
})
export class SzPreferencesComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** used internally to cache prefs values */
  private _prefsJSON: SzSdkPrefsModel;
  /** show control interface */
  @Input() public showControls = false;

  // --------------------------------- event emitters and subjects ----------------------

  /**
   * emitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public prefsChange: EventEmitter<SzSdkPrefsModel> = new EventEmitter<SzSdkPrefsModel>();

  // --------------------------------- start prefs getters/setters -----------------------

  // -------------   search form
  /** the allowed identifier types to show in the search form pulldown
   * @example
   * <sz-preferences
   * search-form-allowed-type-attributes="SSN_NUMBER,DRIVERS_LICENSE_NUMBER">
  */
  public get SearchFormAllowedTypeAttributes(): string[] | string {
    return this.prefs.searchForm.allowedTypeAttributes;
  }
  /** the allowed identifier types to show in the search form pulldown */
  @Input() public set SearchFormAllowedTypeAttributes(value: string[] | string) {
    if(typeof value == 'string') {
      value = (value.indexOf(',') > 0) ? value.split(',') : [value];
    }
    this.prefs.searchForm.allowedTypeAttributes = value;
  }

  // -------------   search results
  /** open a new tab when a user clicks a search result
   * @example
   * <sz-preferences
   * search-results-open-in-new-tab="true">
  */
  public get SearchResultsOpenInNewTab(): boolean {
    return this.prefs.searchResults.openInNewTab;
  }
  /** open a new tab when a user clicks a search result */
  @Input() public set SearchResultsOpenInNewTab(value: boolean) {
    this.prefs.searchResults.openInNewTab = value;
  }
  /** show "other data" in search results */
  public get SearchResultsShowOtherData(): boolean {
    return this.prefs.searchResults.showOtherData;
  }
  /** show "other data" in search results */
  @Input() public set SearchResultsShowOtherData(value: boolean) {
    this.prefs.searchResults.showOtherData = value;
  }
  /** show "attribute data" ie "login id, email address etc" in search results */
  public get SearchResultsShowCharacteristicData(): boolean {
    return this.prefs.searchResults.showCharacteristicData;
  }
  /** show "attribute data" ie "login id, email address etc" in search results */
  @Input() public set SearchResultsShowCharacteristicData(value: boolean) {
    this.prefs.searchResults.showCharacteristicData = value;
  }
  /** show "match keys" in search results */
  public get SearchResultsShowMatchRecords(): boolean {
    return this.prefs.searchResults.showMatchKeys;
  }
  /** show "match keys" in search results */
  @Input() public set SearchResultsShowMatchRecords(value: boolean) {
    this.prefs.searchResults.showMatchKeys = value;
  }
  /** show "record ids" in search results */
  public get SearchResultsShowRecordIds(): boolean {
    return this.prefs.searchResults.showRecordIds;
  }
  /** show "record ids" in search results */
  @Input() public set SearchResultsShowRecordIds(value: boolean) {
    this.prefs.searchResults.showRecordIds = value;
  }
  /** number of lines shown before ellipsis in search results */
  public get SearchResultsTruncateRecordsAt(): number {
    return this.prefs.searchResults.truncateRecordsAt;
  }
  /** number of lines shown before ellipsis in search results */
  @Input() public set SearchResultsTruncateRecordsAt(value: number) {
    this.prefs.searchResults.truncateRecordsAt = value;
  }
  /** number of lines of "other data" shown before ellipsis in search results */
  public get SearchResultsTruncateOtherDataAt(): number {
    return this.prefs.searchResults.truncateOtherDataAt;
  }
  /** number of lines of "other data" shown before ellipsis in search results */
  @Input() public set SearchResultsTruncateOtherDataAt(value: number) {
    this.prefs.searchResults.truncateOtherDataAt = value;
  }
  /** number of lines of "attribute data" shown before ellipsis in search results */
  public get SearchResultsTruncateCharacteristicDataAt(): number {
    return this.prefs.searchResults.truncateCharacteristicDataAt;
  }
  /** number of lines of "attribute data" shown before ellipsis in search results */
  @Input() public set SearchResultsTruncateCharacteristicDataAt(value: number) {
    this.prefs.searchResults.truncateCharacteristicDataAt = value;
  }
  /** show embedded graph in search results */
  public get SearchResultsShowEmbeddedGraph(): boolean {
    return this.prefs.searchResults.showEmbeddedGraph;
  }
  /** show embedded graph in search results */
  @Input() public set SearchResultsShowEmbeddedGraph(value: boolean) {
    this.prefs.searchResults.showEmbeddedGraph = value;
  }
  /** update embedded graph focus in search results on click */
  public get SearchResultsLinkToEmbeddedGraph(): boolean {
    return this.prefs.searchResults.linkToEmbeddedGraph;
  }
  /** update embedded graph focus in search results on click */
  @Input() public set SearchResultsLinkToEmbeddedGraph(value: boolean) {
    this.prefs.searchResults.linkToEmbeddedGraph = value;
  }
  /** number of lines of "identifier data" shown before ellipsis in search results */
  public get SearchResultsTruncateIdentifierDataAt(): number {
    return this.prefs.searchResults.truncateIdentifierDataAt;
  }
  /** number of lines of "identifier data" shown before ellipsis in search results */
  @Input() public set SearchResultsTruncateIdentifierDataAt(value: number) {
    this.prefs.searchResults.truncateIdentifierDataAt = value;
  }

  // -----------------------------------------   entity detail ----------------------------

  /** show the graph section in entity detail component */
  public get EntityDetailShowGraphSection(): boolean {
    return this.prefs.entityDetail.showGraphSection;
  }
  /** show the graph section in entity detail component */
  @Input() public set EntityDetailShowGraphSection(value: boolean) {
    this.prefs.entityDetail.showGraphSection = value;
  }
  /** show the matches section in entity detail component */
  public get EntityDetailShowMatchesSection(): boolean {
    return this.prefs.entityDetail.showMatchesSection;
  }
  /** show the matches section in entity detail component */
  @Input() public set EntityDetailShowMatchesSection(value: boolean) {
    this.prefs.entityDetail.showMatchesSection = value;
  }
  /** show the possible matches section in entity detail component */
  public get EntityDetailShowPossibleMatchesSection(): boolean {
    return this.prefs.entityDetail.showPossibleMatchesSection;
  }
  /** show the possible matches section in entity detail component */
  @Input() public set EntityDetailShowPossibleMatchesSection(value: boolean) {
    this.prefs.entityDetail.showPossibleMatchesSection = value;
  }
  /** show the possible relationships section in entity detail component */
  public get EntityDetailShowPossibleRelationshipsSection(): boolean {
    return this.prefs.entityDetail.showPossibleRelationshipsSection;
  }
  /** show the possible relationships section in entity detail component */
  @Input() public set EntityDetailShowPossibleRelationshipsSection(value: boolean) {
    this.prefs.entityDetail.showPossibleRelationshipsSection = value;
  }
  /** show the disclosed section in entity detail component */
  public get EntityDetailShowDisclosedSection(): boolean {
    return this.prefs.entityDetail.showDisclosedSection;
  }
  /** show the disclosed section in entity detail component */
  @Input() public set EntityDetailShowDisclosedSection(value: boolean) {
    this.prefs.entityDetail.showDisclosedSection = value;
  }
  /** graph section collapsed in entity detail component */
  public get EntityDetailGraphSectionCollapsed(): boolean {
    return this.prefs.entityDetail.graphSectionCollapsed;
  }
  /** graph section collapsed in entity detail component */
  @Input() public set EntityDetailGraphSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.graphSectionCollapsed = value;
  }
  /** records/matches section collapsed in entity detail component */
  public get EntityDetailRecordsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.recordsSectionCollapsed;
  }
  /** records/matches section collapsed in entity detail component */
  @Input() public set EntityDetailRecordsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.recordsSectionCollapsed = value;
  }
  /** possible matches section collapsed in entity detail component */
  public get EntityDetailPossibleMatchesSectionCollapsed(): boolean {
    return this.prefs.entityDetail.possibleMatchesSectionCollapsed;
  }
  /** possible matches section collapsed in entity detail component */
  @Input() public set EntityDetailPossibleMatchesSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.possibleMatchesSectionCollapsed = value;
  }
  /** possible relationships section collapsed in entity detail component */
  public get EntityDetailPossibleRelationshipsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.possibleRelationshipsSectionCollapsed;
  }
  /** possible relationships section collapsed in entity detail component */
  @Input() public set EntityDetailPossibleRelationshipsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.possibleRelationshipsSectionCollapsed = value;
  }
  /** disclosed relationships section collapsed in entity detail component */
  public get EntityDetailDisclosedRelationshipsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.disclosedRelationshipsSectionCollapsed;
  }
  /** disclosed relationships section collapsed in entity detail component */
  @Input() public set EntityDetailDisclosedRelationshipsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.disclosedRelationshipsSectionCollapsed = value;
  }
  /** publish prefs change events on section collapsed state changes in entity detail component */
  public get EntityDetailRememberSectionCollapsedState(): boolean {
    return this.prefs.entityDetail.rememberSectionCollapsedState;
  }
  /** publish prefs change events on section collapsed state changes in entity detail component */
  @Input() public set EntityDetailRememberSectionCollapsedState(value: boolean) {
    this.prefs.entityDetail.rememberSectionCollapsedState = value;
  }
  /**  lines shown before ellipsis in entity detail header summary */
  public get EntityDetailTruncateSummaryAt(): number {
    return this.prefs.entityDetail.truncateSummaryAt;
  }
  /**  lines shown before ellipsis in entity detail header summary */
  @Input() public set EntityDetailTruncateSummaryAt(value: number) {
    this.prefs.entityDetail.truncateSummaryAt = value;
  }
  /** show "other data" in entity detail component */
  public get EntityDetailShowOtherData(): boolean {
    return this.prefs.entityDetail.showOtherData;
  }
  /** show "other data" in entity detail component */
  @Input() public set EntityDetailShowOtherData(value: boolean) {
    this.prefs.entityDetail.showOtherData = value;
  }
  /**  lines of "other data" shown before ellipsis in entity detail component*/
  public get EntityDetailTruncateOtherDataAt(): number {
    return this.prefs.entityDetail.truncateOtherDataAt;
  }
  /**  lines of "other data" shown before ellipsis in entity detail component*/
  @Input() public set EntityDetailTruncateOtherDataAt(value: number) {
    this.prefs.entityDetail.truncateOtherDataAt = value;
  }
  /** open a new tab when a user clicks a entity result in entity detail component */
  public get EntityDetailOpenLinksInNewTab(): boolean {
    return this.prefs.entityDetail.openLinksInNewTab;
  }
  /** open a new tab when a user clicks a entity result in entity detail component */
  @Input() public set EntityDetailOpenLinksInNewTab(value: boolean) {
    this.prefs.entityDetail.openLinksInNewTab = value;
  }
  /** show "other data" in records/matches section in entity detail component */
  public get EntityDetailShowOtherDataInRecords(): boolean {
    return this.prefs.entityDetail.showOtherDataInRecords;
  }
  /** show "other data" in records/matches section in entity detail component */
  @Input() public set EntityDetailShowOtherDataInRecords(value: boolean) {
    this.prefs.entityDetail.showOtherDataInRecords = value;
  }
  /** show "other data" in entity composites (ie non-records/matches) in entity detail component */
  public get EntityDetailShowOtherDataInEntities(): boolean {
    return this.prefs.entityDetail.showOtherDataInEntities;
  }
  /** show "other data" in entity composites (ie non-records/matches) in entity detail component */
  @Input() public set EntityDetailShowOtherDataInEntities(value: boolean) {
    this.prefs.entityDetail.showOtherDataInEntities = value;
  }
  /** show "other data" in header summary in entity detail component */
  public get EntityDetailShowOtherDataInSummary(): boolean {
    return this.prefs.entityDetail.showOtherDataInSummary;
  }
  /** show "other data" in header summary in entity detail component */
  @Input() public set EntityDetailShowOtherDataInSummary(value: boolean) {
    this.prefs.entityDetail.showOtherDataInSummary = value;
  }
  /**  lines of "other data" shown before ellipsis for records/matches in entity detail component*/
  public get EntityDetailTruncateOtherDataInRecordsAt(): number {
    return this.prefs.entityDetail.truncateOtherDataInRecordsAt;
  }
  /**  lines of "other data" shown before ellipsis for records/matches in entity detail component*/
  @Input() public set EntityDetailTruncateOtherDataInRecordsAt(value: number) {
    this.prefs.entityDetail.truncateOtherDataInRecordsAt = value;
  }
  /** collapse graph section when no graphable relationships present in entity detail component */
  public get EntityDetailHideGraphWhenZeroRelations(): boolean {
    return this.prefs.entityDetail.hideGraphWhenZeroRelations;
  }
  /** collapse graph section when no graphable relationships present in entity detail component */
  @Input() public set EntityDetailHideGraphWhenZeroRelations(value: boolean) {
    this.prefs.entityDetail.hideGraphWhenZeroRelations = value;
  }
  /** show "record ids" in entity detail component when not auto-generated */
  public get EntityDetailShowRecordIdWhenNative(): boolean {
    return this.prefs.entityDetail.showRecordIdWhenNative;
  }
  /** show "record ids" in entity detail component when not auto-generated */
  @Input() public set EntityDetailShowRecordIdWhenNative(value: boolean) {
    this.prefs.entityDetail.showRecordIdWhenNative = value;
  }
  /** show top "record id" for entity composites when source record(s) is singular */
  public get EntityDetailShowTopEntityRecordIdsWhenSingular(): boolean {
    return this.prefs.entityDetail.showTopEntityRecordIdsWhenSingular;
  }
  /** show top "record id" for entity composites when source record(s) is singular */
  @Input() public set EntityDetailShowTopEntityRecordIdsWhenSingular(value: boolean) {
    this.prefs.entityDetail.showTopEntityRecordIdsWhenSingular = value;
  }

  // --------------------------------- graph preferences ---------------------------------

  /** open a new tab when a user clicks a entity node in stand-alone graph */
  public get GraphOpenInNewTab(): boolean {
    return this.prefs.graph.openInNewTab;
  }
  /** open a new tab when a user clicks a entity node in stand-alone graph */
  @Input() public set GraphOpenInNewTab(value: boolean) {
    this.prefs.graph.openInNewTab = value;
  }
  /** open a side panel inspector when a user clicks a entity node in stand-alone graph */
  public get GraphOpenInSidePanel(): boolean {
    return this.prefs.graph.openInSidePanel;
  }
  /** open a side panel inspector when a user clicks a entity node in stand-alone graph */
  @Input() public set GraphOpenInSidePanel(value: boolean) {
    this.prefs.graph.openInSidePanel = value;
  }
  /** map of datasource -> color to highlight nodes with when belonging to data source in stand-alone graph */
  public get GraphDataSourceColors(): any {
    return this.prefs.graph.dataSourceColors;
  }
  /** map of datasource -> color to highlight nodes with when belonging to data source in stand-alone graph */
  @Input() public set GraphDataSourceColors(value: any) {
    this.prefs.graph.dataSourceColors = value;
  }
  /** show match keys on relationship edges in graph */
  public get GraphShowLinkLabels(): boolean {
    return this.prefs.graph.showLinkLabels;
  }
  /** show match keys on relationship edges in graph */
  @Input() public set GraphShowLinkLabels(value: boolean) {
    this.prefs.graph.showLinkLabels = value;
  }
  /** publish prefs change events on state change in graph component */
  public get GraphRememberStateOptions(): boolean {
    return this.prefs.graph.rememberStateOptions;
  }
  /** publish prefs change events on state change in graph component */
  @Input() public set GraphRememberStateOptions(value: boolean) {
    // this one doesn't need to push "next" to event bus
    // rather it controls whether the other setters send to event bus
    this.prefs.graph.rememberStateOptions = value;
  }
  /** the value of "maxDegrees" parameter displayed in graph component */
  public get GraphMaxDegreesOfSeparation(): number {
    return this.prefs.graph.maxDegreesOfSeparation;
  }
  /** the value of "maxDegrees" parameter displayed in graph component */
  @Input() public set GraphMaxDegreesOfSeparation(value: number) {
    this.prefs.graph.maxDegreesOfSeparation = value;
  }
  /** maximum number of entities displayed in graph component. useful for overflow scenarios */
  public get GraphMaxEntities(): number {
    return this.prefs.graph.maxEntities;
  }
  /** maximum number of entities displayed in graph component. useful for overflow scenarios */
  @Input() public set GraphMaxEntities(value: number) {
    this.prefs.graph.maxEntities = value;
  }
  /** the value of "buildOut" parameter displayed in graph component. sets distance of relationships shown. default is 1. */
  public get GraphBuildOut(): number {
    return this.prefs.graph.buildOut;
  }
  /** the value of "buildOut" parameter displayed in graph component. sets distance of relationships shown. default is 1. */
  @Input() public set GraphBuildOut(value: number) {
    this.prefs.graph.buildOut = value;
  }

  // ---------------------------------  end prefs getters/setters  -----------------------

  /** a JSON string value used for initializing preferences state from a JSON representation. */
  @Input() public set prefsFromJSONString(value: string) {
    if(value && value !== undefined && value !== null){
      this.prefs.fromJSONString(value);
    }
  }

  /** which fields to explicitly not show to the user */
  @Input() public editableBlacklist = {
    searchForm: ['allowedTypeAttributes','searchHistory'],
    searchResults: ['truncateRecordsAt','linkToEmbeddedGraph','showEmbeddedGraph','openInNewTab'],
    entityDetail: ['openLinksInNewTab'],
    graph: ['dataSourceColors','openInNewTab','openInSidePanel']
  };
  // just initially get the prefs maps for the UI to reference statically
  public searchFormOptions    = this.getNameSpaceOptions('searchForm');
  public searchResultsOptions = this.getNameSpaceOptions('searchResults');
  public entityDetailOptions  = this.getNameSpaceOptions('entityDetail');
  public graphOptions         = this.getNameSpaceOptions('graph');

  /** helper function to get a special model to iterate over in the template */
  private getNameSpaceOptions(ns: string) {
    const opts        = this.prefs[ns].toJSONObject();
    const optsSchema  = this.prefs[ns].getPublicPropertiesSchema();

    let ret = [];
    for(const k in optsSchema) {
      let iType = 'checkbox';
      let optValue = opts[k];
      let sType = optsSchema[k] ? optsSchema[k] : (typeof optValue);
      switch(sType){
        case 'string':
          iType = 'text';
          break;
        case 'boolean':
            iType = 'checkbox';
            break;
        case 'number':
            iType = 'number';
            break;
        default:
          // must be array or map
          iType = 'array';
          break;
      }
      // blacklisted prop check
      if(this.editableBlacklist && this.editableBlacklist[ns] && this.editableBlacklist[ns].indexOf( k ) < 0){
        // ns has bl but not in it
        ret.push({name: k, value: optValue, inputType: iType});
      } else if(!this.editableBlacklist || (this.editableBlacklist && !this.editableBlacklist[ns])) {
        // no ns
        ret.push({name: k, value: optValue, inputType: iType});
      }
    }
    // sort return order by: input type
    // so that ui list always shows groups of same input
    // types
    ret = ret.sort( this.SortByName ).sort( this.SortByInputType );
    return ret;
  }
  /** helper fn to break a camel-case string in to a sentence case string */
  public toSentenceCase( str: string) {
    return str.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1")
  }
  /** get the linked ref to a specific pref who's type should be boolean through a fn */
  public boolPrefChecked(prefGroup: string, prefKey: string){
    let retVal = false;
    if (this.prefs[prefGroup] && typeof this.prefs[prefGroup][prefKey] === 'boolean') {
      // console.log(`isAllowedAttributeChecked( ${attrKey} )`, (this._prefsJSON.searchForm.allowedTypeAttributes.indexOf(attrKey) > 0));
      retVal = this.prefs[prefGroup][prefKey];
    }
    return retVal;
  }
  /** reusable sorting method. does what it says */
  public SortByName(x,y) {
    return ((x.name == y.name) ? 0 : ((x.name > y.name) ? 1 : -1 ));
  }
  /** reusable sorting method. does what it says */
  public SortByInputType(x,y) {
    return ((x.inputType == y.inputType) ? 0 : ((x.inputType > y.inputType) ? -1 : 1 ));
  }
  /** get the linked ref to a specific pref who's type should be number through a fn */
  public prefValAsInt(prefGroup: string, prefKey: string): number {
    let retVal = -1;
    // console.log(`prefValAsInt( ${prefKey} )`, typeof this.prefs[prefGroup][prefKey]);
    retVal = this.prefs[prefGroup][prefKey];
    return retVal;
  }
  /** update a specific pref who's type should be boolean through a fn */
  updateBoolPrefValue(prefGroup: string, prefKey: string, evt) {
    const _checked = evt.target.checked;
    let prefTypeFromSchema = this.prefs[prefGroup].getPublicPropertiesSchema()[prefKey]
    if (this.prefs[prefGroup] && prefTypeFromSchema === 'boolean'){
      this.prefs[prefGroup][prefKey] = _checked;
    }
  }
  /** get the linked ref to a specific pref who's type should be number through a fn */
  updateIntPrefValue(prefGroup: string, prefKey: string, event: any): void {
    const prefVal = (event && event.srcElement && event.srcElement.value) ? parseInt(event.srcElement.value) : this.prefs[prefGroup][prefKey] ;
    //console.log(`updateIntPrefValue(${prefGroup}, ${prefKey})`, prefVal, typeof this.prefs[prefGroup][prefKey]);

    if (prefVal > 0 && this.prefs[prefGroup] && this.prefs[prefGroup][prefKey]){
      this.prefs[prefGroup][prefKey] = prefVal;
    }
  }

  constructor(
    private prefs: SzPrefsService,
    public datasources: SzDataSourcesService
  ) {}

  ngOnInit() {
    // listen for event bus prefs changes
    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  /** event bus prefs change to component emitter proxy */
  private onPrefsChange(value: SzSdkPrefsModel): void {
    if(this.prefsChange) {
      this.prefsChange.emit(value);
    }
  }

  /** helper method for retrieving list of datasources */
  public getDataSources() {
    return this.datasources.listDataSources('sz-preferences.component');
  }
}
