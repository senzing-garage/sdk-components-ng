import { SzEntityRecord } from './entity-record';
import { SzFeatures } from './features';
import { SzDataSourceBreakdown } from './data-source-breakdown';

export interface SzResolvedEntityData {
  records: SzEntityRecord[];
  dataSourceBreakdown: SzDataSourceBreakdown[];
  identifierData: string[];
  features: SzFeatures;
  entityId: number;
  nameData: string[];
  attributeData: string[];
  addressData: string[];
  lensId: number;
  phoneData: string[];
  bestName: string;
}
