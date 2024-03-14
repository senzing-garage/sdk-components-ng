/*
 * Public API Surface of sdk
 */

export * from './lib/sdk.module';
export * from '@senzing/rest-api-client-ng';

/** utilities */
export * from './lib/common/utils';
export * from './lib/entity/entity-utils';

/** services */
export * from './lib/services/sz-message-bundle.service';
export * from './lib/services/sz-configuration.service';
export * from './lib/services/sz-datamart.service';
export { SzAdminService } from './lib/services/sz-admin.service';
export { SzBulkDataService } from './lib/services/sz-bulk-data.service';

export * from './lib/services/sz-datasources.service';
export * from './lib/services/sz-configuration.service';
export * from './lib/services/sz-folios.service';
export * from './lib/services/sz-message-bundle.service';
export { SzPrefsService, SzSdkPrefsModel} from './lib/services/sz-prefs.service';
export * from './lib/services/sz-search.service';  // updated to use rest
export * from './lib/services/sz-ui.service';
export * from './lib/services/sz-how-ui.service';

/** components */
  /** bulk data related */
  /*
  export { SzBulkDataAnalysisComponent } from './lib/bulk-data/sz-bulk-data-analysis.component';
  export { SzBulkDataAnalysisReportComponent } from './lib/bulk-data/sz-bulk-data-analysis-report.component';
  export { SzBulkDataAnalysisSummaryComponent } from './lib/bulk-data/sz-bulk-data-analysis-summary.component';
  export { SzBulkDataLoadComponent } from './lib/bulk-data/sz-bulk-data-load.component';
  export { SzBulkDataLoadReportComponent } from './lib/bulk-data/sz-bulk-data-load-report.component';
  export { SzBulkDataLoadSummaryComponent } from './lib/bulk-data/sz-bulk-data-load-summary.component';
  */

export * from './lib/search/sz-search/sz-search.component';
export { SzSearchByIdComponent, SzSearchByIdFormParams } from './lib/search/sz-search/sz-search-by-id.component';
export { SzEntityRecordViewerComponent } from './lib/record/sz-entity-record-viewer.component';
export * from './lib/search/sz-search-results/sz-search-results.component';
export * from './lib/search/sz-search-result-card/sz-search-result-card.component';
export * from './lib/entity/detail/sz-entity-detail.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
export * from './lib/entity/detail/sz-entity-detail-how-report/sz-entity-detail-how-report.component';

/** graph related */
export { SzRelationshipNetworkComponent } from './lib/graph/sz-relationship-network/sz-relationship-network.component';
export { SzRelationshipNetworkInputComponent } from './lib/graph/sz-relationship-network-input/sz-relationship-network-input.component';
export { SzRelationshipNetworkLookupComponent } from './lib/graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
export { SzRelationshipPathComponent } from './lib/graph/sz-relationship-path/sz-relationship-path.component';
export { SzGraphComponent } from './lib/graph/sz-graph.component';
export * from './lib/graph/sz-graph-control.component';
export * from './lib/graph/sz-graph-filter.component';
export { SzEntityDetailGraphComponent } from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
export { SzStandaloneGraphComponent } from './lib/entity/detail/sz-entity-detail-graph/sz-standalone-graph.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-control.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-filter.component';
/* charts */
export { SzRecordStatsDonutChart } from './lib/charts/records-by-datasources/sz-donut.component'
/** shared */
export { SzDataTable } from './lib/shared/data-table/sz-data-table.component';
export { SzVennDiagramsComponent } from './lib/charts/versus/sz-venn-diagram.component';
/** statistics */
export { SzCrossSourceStatistics } from './lib/statistics/cross-source/sz-cross-source-statistics.component';
export { SzCrossSourceSummaryComponent } from './lib/summary/cross-source/sz-cross-source-summary.component';
/** components */
export * from './lib/sz-powered-by/sz-powered-by.component';
export * from './lib/configuration/sz-configuration/sz-configuration.component';
export * from './lib/configuration/sz-configuration-about/sz-configuration-about.component';
export { SzLicenseInfoComponent } from './lib/configuration/sz-license/sz-license.component';
export { SzPreferencesComponent } from './lib/configuration/sz-preferences/sz-preferences.component';

/** models */
export * from './lib/models/folio';
export { SzBulkDataAnalysis } from './lib/models/data-analysis';
export { SzBulkLoadStatus } from './lib/models/data-importing';
export { SzEntitySearchParams } from './lib/models/entity-search';
export { SzEntityDetailSectionData } from './lib/models/entity-detail-section-data';
export { SzSearchResultEntityData } from './lib/models/responces/search-results/sz-search-result-entity-data';
export { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig, AdminStreamUploadRates } from './lib/models/data-admin';
export { SzDataSourceRecordAnalysis, SzDataSourceComposite } from './lib/models/data-sources';
export { SzGraphTooltipEntityModel, SzGraphTooltipLinkModel, SzGraphNodeFilterPair, SzMatchKeyComposite, SzMatchKeyTokenComposite, SzEntityNetworkMatchKeyTokens, SzNetworkGraphInputs, SzMatchKeyTokenFilterScope } from './lib/models/graph';
export { SzDataSourceRecordsSelection, SzDataSourceRecordSelection, SzWhySelectionModeBehavior, SzWhySelectionMode } from './lib/models/data-source-record-selection';
export * from './lib/models/data-how';
/** pipes */
export { SzShortNumberPipe } from './lib/pipes/shortnumber.pipe'
export { SzDecimalPercentPipe } from './lib/pipes/decimalpercent.pipe'

/** why */
export { SzWhyEntityComponent } from './lib/why/sz-why-entity.component';
export { SzWhyEntitiesComparisonComponent } from './lib/why/sz-why-entities.component';
export { SzWhyEntityDialog } from './lib/why/sz-why-entity.component';
export { SzWhyEntitiesDialog } from './lib/why/sz-why-entities.component';

/** how */
export { SzHowEntityComponent } from './lib/how/sz-how-entity.component';
export { SzHowStepNodeComponent } from './lib/how/sz-how-step-node.component'
export { SzHowFinalEntityCardComponent } from './lib/how/cards/sz-how-final-entity-card.component';
export { SzHowSingletonCardComponent } from './lib/how/cards/sz-how-singleton-card.component';
export { SzHowStepCardComponent } from './lib/how/cards/sz-how-step-card.component';
export { SzHowStepStackComponent } from './lib/how/sz-how-step-stack.component';
export { SzHowNavComponent } from './lib/how/sz-how-nav.component';
export { SzHowVirtualEntityCardComponent } from './lib/how/cards/sz-how-virtual-entity-card.component';
export { SzHowVirtualEntityDialog } from './lib/how/sz-how-virtual-entity-dialog.component';

/** export some members of rest client to ease type use */
export {
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters,

  SzAttributeClass,
  SzAttributeNecessity,
  SzAttributeSearchResponse,
  SzAttributeSearchResponseData,
  SzAttributeSearchResult,
  SzAttributeSearchResultType,
  SzAttributeType,
  SzAttributeTypeResponse,
  SzAttributeTypeResponseData,
  SzAttributeTypesResponse,
  SzAttributeTypesResponseData,

  SzDataSourceRecordSummary,
  SzDataSourcesResponse,
  SzDataSourcesResponseData,

  SzEntityData,
  SzEntityFeature,
  SzEntityIdentifier,
  SzEntityIdentifiers,
  SzEntityNetworkData,
  SzEntityNetworkResponse,
  SzEntityPath,
  SzEntityPathResponse,
  SzEntityPathData,
  SzEntityRecord,
  SzEntityResponse,

  SzError,
  SzErrorResponse,

  SzLicenseInfo,
  SzLicenseResponse,
  SzLicenseResponseData,
  SzLoadRecordResponse,
  SzLoadRecordResponseData,

  SzRecordId,
  SzRecordResponse,
  SzRecordResponseData,

  SzRelatedEntity,
  SzRelationshipType,
  SzResolvedEntity,
  SzResponseWithRawData,

  SzVersionInfo,
  SzVersionResponse

} from '@senzing/rest-api-client-ng';
