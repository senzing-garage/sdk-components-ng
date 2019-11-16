//import { Configuration } from '@senzing/rest-api-client-ng';

/*
 * Public API Surface of sdk
 */

export * from './lib/sdk.module';
export * from '@senzing/rest-api-client-ng';

/** utilities */
export * from './lib/common/utils';

/** services */
export * from './lib/services/sz-search.service';  // updated to use rest
export * from './lib/services/sz-message-bundle.service';
export * from './lib/services/sz-configuration.service';
export * from './lib/services/sz-ui.service';
export * from './lib/services/sz-datasources.service';
export * from './lib/services/sz-pdf-util.service';
export {
  SzPrefsService,
  SzSdkPrefsModel
} from './lib/services/sz-prefs.service';

/** components */
export * from './lib/search/sz-search/sz-search.component';
export { SzSearchByIdComponent } from './lib/search/sz-search/sz-search-by-id.component';
export { SzEntityRecordViewerComponent } from './lib/record/sz-entity-record-viewer.component';
export * from './lib/search/sz-search-results/sz-search-results.component';
export * from './lib/search/sz-search-result-card/sz-search-result-card.component';
export * from './lib/entity/detail/sz-entity-detail.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-control.component';
export * from './lib/entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-filter.component';
export { SzStandaloneGraphComponent } from './lib/entity/detail/sz-entity-detail-graph/sz-standalone-graph.component';
export * from './lib/sz-powered-by/sz-powered-by.component';
export * from './lib/configuration/sz-configuration/sz-configuration.component';
export * from './lib/configuration/sz-configuration-about/sz-configuration-about.component';
export * from './lib/configuration/sz-preferences/sz-preferences.component';
export * from '@senzing/sdk-graph-components';

/** models */
/*
export * from './lib/models/responces/search-results/sz-search-result-entity-data';
export * from './lib/models/entity-detail-section-data';
export * from './lib/models/entity-search';
export * from './lib/models/network-graph-inputs';
*/

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
  SzResponseWithRawData

} from '@senzing/rest-api-client-ng';
