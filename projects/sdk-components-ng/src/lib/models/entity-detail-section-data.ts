import { SzDataSourceBreakdown } from './responces/search-results/data-source-breakdown';
import { SzEntityRecord } from './responces/search-results/entity-record';
import { SzFeatures } from './responces/search-results/features';

export interface SzEntityDetailSectionData {
  'resolutionRuleCode': string;
  'matchLevel': number;
  'refScore': number;
  'matchKey': string;
  'dataSourceBreakdown': SzDataSourceBreakdown[];
  'identifierData': string[];
  'records': SzEntityRecord[];
  'features': SzFeatures;
  'bestName': string;
  'attributeData': string[];
  'phoneData': string[];
  'nameData': string[];
  'lensId': number;
  'entityId': number;
  'addressData': string[];
  'dataSource'?: string;
}

export interface SzEntityDetailSectionSummary {
  total: number;
  title: string;
}
