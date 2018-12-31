import { SzDataSourceBreakdown } from './data-source-breakdown';
import { SzFeatures } from './features';

export interface SzRelatedEntity {
  records: any[];
  dataSourceBreakdown: SzDataSourceBreakdown[];
  identifierData: string[];
  features: SzFeatures;
  entityId: number;
  nameData: string[];
  attributeData: string[];
  addressData: string[];
  lensId: number;
  phoneData: string[];
}
