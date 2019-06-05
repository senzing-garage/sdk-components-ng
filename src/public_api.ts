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
export * from './lib/services/sz-ui.service';

/** components */
export * from './lib/search/sz-search/sz-search.component';
export * from './lib/search/sz-search-results/sz-search-results.component';
export * from './lib/search/sz-search-result-card/sz-search-result-card.component';
export * from './lib/entity/detail/sz-entity-detail.component';
export * from './lib/sz-powered-by/sz-powered-by.component';
export * from './lib/configuration/sz-configuration/sz-configuration.component';
export * from './lib/configuration/sz-configuration-about/sz-configuration-about.component';
export * from './lib/graph/sz-relationship-network/sz-relationship-network.component';
export * from './lib/graph/sz-relationship-network-input/sz-relationship-network-input.component';
export * from './lib/graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
export * from './lib/graph/sz-relationship-network-upload/sz-relationship-network-upload.component';
export * from './lib/graph/sz-relationship-path/sz-relationship-path.component';

/** models */
export * from './lib/models/responces/search-results/sz-search-result-entity-data';
export * from './lib/models/entity-detail-section-data';
export * from './lib/models/entity-search';
export * from './lib/models/network-graph-inputs';

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
