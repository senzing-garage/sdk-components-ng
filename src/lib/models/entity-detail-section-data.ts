import { SzEntityRecord, SzEntityFeature, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';

export interface SzEntityDetailSectionData {
  'resolutionRuleCode': string;
  'matchLevel': number;
  'refScore': number;
  'matchKey': string;
  'recordSummaries': SzDataSourceRecordSummary[];
  'identifierData': string[];
  'records': SzEntityRecord[];
  'features'?: {
    [key: string] : SzEntityFeature[]
  }
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
