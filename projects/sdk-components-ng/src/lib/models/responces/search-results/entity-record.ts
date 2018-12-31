import { SzRawData } from './raw-data';
import { SzDataSourceBreakdown } from './data-source-breakdown';

export interface SzEntityRecord {
  entityId: number;
  bestName: string;
  relationshipData: string[];
  identifierData: string[];
  dataSource: string;
  dataSourceBreakdown?: SzDataSourceBreakdown[];
  nameData: string[];
  attributeData: string[];
  addressData: string[];
  phoneData: string[];
  rawData: SzRawData;
  entityData: string[];
  recordId: string;
  otherData: string[];

  records?: SzEntityRecord[];
}
