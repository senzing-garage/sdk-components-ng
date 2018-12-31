import { SzDataSourceBreakdown } from './data-source-breakdown';
import { SzEntityRecord } from './entity-record';
import { SzFeatures } from './features';

export interface SzSearchResultMatch {
  matchLevel: number;
  resolutionRuleCode: string;
  matchKey: string;
  refScore: number;
  dataSourceBreakdown: SzDataSourceBreakdown[];
  identifierData: string[];
  records: SzEntityRecord[];
  features: SzFeatures;
  lensId: number;
  entityId: number;
  nameData: string[];
  attributeData: string[];
  addressData: string[];
  bestName: string;
  phoneData: string[];
}
