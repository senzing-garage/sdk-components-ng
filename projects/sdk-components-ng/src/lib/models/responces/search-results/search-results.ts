import { SzEntityDetailSectionData } from '../../entity-detail-section-data';

export interface SzSearchResults {
  nameOnlyMatches: SzEntityDetailSectionData[];
  discoveredRelationships: SzEntityDetailSectionData[];
  possibleMatches: SzEntityDetailSectionData[];
  matches: SzEntityDetailSectionData[];
}
