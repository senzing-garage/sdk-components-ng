import { Component, Inject, Input, Output, OnInit, AfterViewInit, OnDestroy, EventEmitter } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject, BehaviorSubject } from 'rxjs';
import { SzConfigurationService } from '../../services/sz-configuration.service';
import { SzSdkPrefsModel, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';

/**
 * Provides a service integration web component that can be used to set, read, change, and
 * respoond to UI bus event/preference changes.
 *
 * @example
 * <sz-preferences
 * graph-build-out="20">
 * @example
 * <sz-preferences
 * search-results-show-other-data="true">
 *
 * @export
 */
@Component({
  selector: 'sz-preferences',
  templateUrl: 'sz-preferences.component.html',
  styles: ['']
})
export class SzPreferencesComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _prefsJSON: SzSdkPrefsModel;

  // --------------------------------- event emmitters and subjects ----------------------

  /**
   * emmitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public prefsChange: EventEmitter<SzSdkPrefsModel> = new EventEmitter<SzSdkPrefsModel>();

  // --------------------------------- start prefs getters/setters -----------------------

  // -------------   search form
  public get SearchFormOpenInNewTab(): string[] {
    return this.prefs.searchForm.allowedTypeAttributes;
  }
  @Input() public set SearchFormOpenInNewTab(value: string[]) {
    this.prefs.searchForm.allowedTypeAttributes = value;
  }

  // -------------   search results
  public get SearchResultsOpenInNewTab(): boolean {
    return this.prefs.searchResults.openInNewTab;
  }
  @Input() public set SearchResultsOpenInNewTab(value: boolean) {
    this.prefs.searchResults.openInNewTab = value;
  }
  public get SearchResultsShowOtherData(): boolean {
    return this.prefs.searchResults.showOtherData;
  }
  @Input() public set SearchResultsShowOtherData(value: boolean) {
    this.prefs.searchResults.showOtherData = value;
  }
  public get SearchResultsShowAttributeData(): boolean {
    return this.prefs.searchResults.showAttributeData;
  }
  @Input() public set SearchResultsShowAttributeData(value: boolean) {
    this.prefs.searchResults.showAttributeData = value;
  }
  public get SearchResultsShowRecordIds(): boolean {
    return this.prefs.searchResults.showRecordIds;
  }
  @Input() public set SearchResultsShowRecordIds(value: boolean) {
    this.prefs.searchResults.showRecordIds = value;
  }
  public get SearchResultsTruncateRecordsAt(): number {
    return this.prefs.searchResults.truncateRecordsAt;
  }
  @Input() public set SearchResultsruncateRecordsAt(value: number) {
    this.prefs.searchResults.truncateRecordsAt = value;
  }
  public get SearchResultsTruncateOtherDataAt(): number {
    return this.prefs.searchResults.truncateOtherDataAt;
  }
  @Input() public set SearchResultsTruncateOtherDataAt(value: number) {
    this.prefs.searchResults.truncateOtherDataAt = value;
  }
  public get SearchResultsTruncateAttributeDataAt(): number {
    return this.prefs.searchResults.truncateAttributeDataAt;
  }
  @Input() public set SearchResultsTruncateAttributeDataAt(value: number) {
    this.prefs.searchResults.truncateAttributeDataAt = value;
  }
  public get SearchResultsShowEmbeddedGraph(): boolean {
    return this.prefs.searchResults.showEmbeddedGraph;
  }
  @Input() public set SearchResultsShowEmbeddedGraph(value: boolean) {
    this.prefs.searchResults.showEmbeddedGraph = value;
  }
  public get SearchResultsLinkToEmbeddedGraph(): boolean {
    return this.prefs.searchResults.linkToEmbeddedGraph;
  }
  @Input() public set SearchResultsLinkToEmbeddedGraph(value: boolean) {
    this.prefs.searchResults.linkToEmbeddedGraph = value;
  }

  // -----------------------------------------   entity detail ----------------------------

  public get EntityDetailShowGraphSection(): boolean {
    return this.prefs.entityDetail.showGraphSection;
  }
  @Input() public set EntityDetailShowGraphSection(value: boolean) {
    this.prefs.entityDetail.showGraphSection = value;
  }
  public get EntityDetailShowMatchesSection(): boolean {
    return this.prefs.entityDetail.showMatchesSection;
  }
  @Input() public set EntityDetailShowMatchesSection(value: boolean) {
    this.prefs.entityDetail.showMatchesSection = value;
  }
  public get EntityDetailShowPossibleMatchesSection(): boolean {
    return this.prefs.entityDetail.showPossibleMatchesSection;
  }
  @Input() public set EntityDetailShowPossibleMatchesSection(value: boolean) {
    this.prefs.entityDetail.showPossibleMatchesSection = value;
  }
  public get EntityDetailShowPossibleRelationshipsSection(): boolean {
    return this.prefs.entityDetail.showPossibleRelationshipsSection;
  }
  @Input() public set EntityDetailShowPossibleRelationshipsSection(value: boolean) {
    this.prefs.entityDetail.showPossibleRelationshipsSection = value;
  }
  public get EntityDetailShowDisclosedSection(): boolean {
    return this.prefs.entityDetail.showDisclosedSection;
  }
  @Input() public set EntityDetailShowDisclosedSection(value: boolean) {
    this.prefs.entityDetail.showDisclosedSection = value;
  }
  public get EntityDetailGraphSectionCollapsed(): boolean {
    return this.prefs.entityDetail.graphSectionCollapsed;
  }
  @Input() public set EntityDetailGraphSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.graphSectionCollapsed = value;
  }
  public get EntityDetailRecordsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.recordsSectionCollapsed;
  }
  @Input() public set EntityDetailRecordsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.recordsSectionCollapsed = value;
  }
  public get EntityDetailPossibleMatchesSectionCollapsed(): boolean {
    return this.prefs.entityDetail.possibleMatchesSectionCollapsed;
  }
  @Input() public set EntityDetailPossibleMatchesSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.possibleMatchesSectionCollapsed = value;
  }
  public get EntityDetailPossibleRelationshipsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.possibleRelationshipsSectionCollapsed;
  }
  @Input() public set EntityDetailPossibleRelationshipsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.possibleRelationshipsSectionCollapsed = value;
  }
  public get EntityDetailDisclosedRelationshipsSectionCollapsed(): boolean {
    return this.prefs.entityDetail.disclosedRelationshipsSectionCollapsed;
  }
  @Input() public set EntityDetailDisclosedRelationshipsSectionCollapsed(value: boolean) {
    this.prefs.entityDetail.disclosedRelationshipsSectionCollapsed = value;
  }
  public get EntityDetailRememberSectionCollapsedState(): boolean {
    return this.prefs.entityDetail.rememberSectionCollapsedState;
  }
  @Input() public set EntityDetailRememberSectionCollapsedState(value: boolean) {
    this.prefs.entityDetail.rememberSectionCollapsedState = value;
  }
  public get EntityDetailTruncateSummaryAt(): number {
    return this.prefs.entityDetail.truncateSummaryAt;
  }
  @Input() public set EntityDetailTruncateSummaryAt(value: number) {
    this.prefs.entityDetail.truncateSummaryAt = value;
  }
  public get EntityDetailShowOtherData(): boolean {
    return this.prefs.entityDetail.showOtherData;
  }
  @Input() public set EntityDetailShowOtherData(value: boolean) {
    this.prefs.entityDetail.showOtherData = value;
  }
  public get EntityDetailTruncateOtherDataAt(): number {
    return this.prefs.entityDetail.truncateOtherDataAt;
  }
  @Input() public set EntityDetailTruncateOtherDataAt(value: number) {
    this.prefs.entityDetail.truncateOtherDataAt = value;
  }
  public get EntityDetailOpenLinksInNewTab(): boolean {
    return this.prefs.entityDetail.openLinksInNewTab;
  }
  @Input() public set EntityDetailOpenLinksInNewTab(value: boolean) {
    this.prefs.entityDetail.openLinksInNewTab = value;
  }
  public get EntityDetailShowOtherDataInRecords(): boolean {
    return this.prefs.entityDetail.showOtherDataInRecords;
  }
  @Input() public set EntityDetailShowOtherDataInRecords(value: boolean) {
    this.prefs.entityDetail.showOtherDataInRecords = value;
  }
  public get EntityDetailShowOtherDataInEntities(): boolean {
    return this.prefs.entityDetail.showOtherDataInEntities;
  }
  @Input() public set EntityDetailShowOtherDataInEntities(value: boolean) {
    this.prefs.entityDetail.showOtherDataInEntities = value;
  }
  public get EntityDetailShowOtherDataInSummary(): boolean {
    return this.prefs.entityDetail.showOtherDataInSummary;
  }
  @Input() public set EntityDetailShowOtherDataInSummary(value: boolean) {
    this.prefs.entityDetail.showOtherDataInSummary = value;
  }
  public get EntityDetailTruncateOtherDataInRecordsAt(): number {
    return this.prefs.entityDetail.truncateOtherDataInRecordsAt;
  }
  @Input() public set EntityDetailTruncateOtherDataInRecordsAt(value: number) {
    this.prefs.entityDetail.truncateOtherDataInRecordsAt = value;
  }
  public get EntityDetailHideGraphWhenZeroRelations(): boolean {
    return this.prefs.entityDetail.hideGraphWhenZeroRelations;
  }
  @Input() public set EntityDetailHideGraphWhenZeroRelations(value: boolean) {
    this.prefs.entityDetail.hideGraphWhenZeroRelations = value;
  }
  public get EntityDetailShowRecordIdWhenNative(): boolean {
    return this.prefs.entityDetail.showRecordIdWhenNative;
  }
  @Input() public set EntityDetailShowRecordIdWhenNative(value: boolean) {
    this.prefs.entityDetail.showRecordIdWhenNative = value;
  }
  public get EntityDetailShowTopEntityRecordIdsWhenSingular(): boolean {
    return this.prefs.entityDetail.showTopEntityRecordIdsWhenSingular;
  }
  @Input() public set EntityDetailShowTopEntityRecordIdsWhenSingular(value: boolean) {
    this.prefs.entityDetail.showTopEntityRecordIdsWhenSingular = value;
  }

  // --------------------------------- graph preferences ---------------------------------
  public get GraphOpenInNewTab(): boolean {
    return this.prefs.graph.openInNewTab;
  }
  @Input() public set GraphOpenInNewTab(value: boolean) {
    this.prefs.graph.openInNewTab = value;
  }
  public get GraphOpenInSidePanel(): boolean {
    return this.prefs.graph.openInSidePanel;
  }
  @Input() public set GraphOpenInSidePanel(value: boolean) {
    this.prefs.graph.openInSidePanel = value;
  }
  public get GraphDataSourceColors(): any {
    return this.prefs.graph.dataSourceColors;
  }
  @Input() public set GraphDataSourceColors(value: any) {
    this.prefs.graph.dataSourceColors = value;
  }
  public get GraphShowMatchKeys(): boolean {
    return this.prefs.graph.showMatchKeys;
  }
  @Input() public set GraphShowMatchKeys(value: boolean) {
    this.prefs.graph.showMatchKeys = value;
  }
  public get GraphRememberStateOptions(): boolean {
    return this.prefs.graph.rememberStateOptions;
  }
  @Input() public set GraphRememberStateOptions(value: boolean) {
    // this one doesnt need to push "next" to event bus
    // rather it controls whether the other setters send to event bus
    this.prefs.graph.rememberStateOptions = value;
  }
  public get GraphMaxDegreesOfSeparation(): number {
    return this.prefs.graph.maxDegreesOfSeparation;
  }
  @Input() public set GraphMaxDegreesOfSeparation(value: number) {
    this.prefs.graph.maxDegreesOfSeparation = value;
  }
  public get GraphMaxEntities(): number {
    return this.prefs.graph.maxEntities;
  }
  @Input() public set GraphMaxEntities(value: number) {
    this.prefs.graph.maxEntities = value;
  }
  public get GraphBuildOut(): number {
    return this.prefs.graph.buildOut;
  }
  @Input() public set GraphBuildOut(value: number) {
    this.prefs.graph.buildOut = value;
  }

  // ---------------------------------  end prefs getters/setters  -----------------------

  constructor(
    private prefs: SzPrefsService
  ) {}

  ngOnInit() {
    // initialize prefs from localStorage value
    // this.prefs.fromJSONObject(this._localStorageOriginalValue);

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

  private onPrefsChange(value: SzSdkPrefsModel): void {
    //console.log('onPrefsChange: ', value, this.prefsChange);
    if(this.prefsChange) {
      this.prefsChange.emit(value);
    }
  }
}
