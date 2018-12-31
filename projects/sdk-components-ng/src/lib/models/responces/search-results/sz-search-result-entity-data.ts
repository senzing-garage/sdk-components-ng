import { SzRawDataMatches } from './raw-data-matches';
import { SzResolvedEntityData } from './resolved-entity-data';
import { SzRelatedEntity } from './related-entity';

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
  addressDataMatches?: any[];
  resolvedEntity: SzResolvedEntityData;
  topIdentifiers?: string[];
  topAddresses?: string[];
  matchScore?: number;
  topAttributes?: string[];
  topNames?: string[];
  identifierDataMatches?: any[];
}
