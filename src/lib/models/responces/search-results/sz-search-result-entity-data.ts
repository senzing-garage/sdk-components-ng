import { SzRawDataMatches } from './raw-data-matches';
import { SzResolvedEntity, SzRelatedEntity, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';

export interface SzSearchResultEntityData {
  // required
  relatedEntities: SzRelatedEntity[];
  discoveredRelationships: any [];
  possibleMatches: any [];
  disclosedRelationships: any [];
  // optional
  entityId?: number;
  bestName?: string;
  relationshipDataMatches?: any[];
  entityDataMatches?: any[];
  otherDataMatches?: any[];
  topPhoneNumbers?: string[];
  phoneDataMatches?: any[];
  rawDataMatches?: SzRawDataMatches;
  nameDataMatches?: any[];
  attributeDataMatches?: any[];
  characteristicDataMatches?: any[];
  addressDataMatches?: any[];
  resolvedEntity: SzResolvedEntity;
  topIdentifiers?: string[];
  topAddresses?: string[];
  matchScore?: number;
  topAttributes?: string[];
  topNames?: string[];
  identifierDataMatches?: any[];
}
