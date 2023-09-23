import { SzEntityRecord, SzEntityFeature, SzDataSourceRecordSummary, SzRelatedEntity, SzResolvedEntity } from '@senzing/rest-api-client-ng';

export interface SzSectionDataByDataSource {
  'dataSource'?: string;
  'records'?: SzEntityRecord[] | SzRelatedEntity[]
}

export interface SzEntityDetailSectionData extends SzResolvedEntity {
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
  'characteristicData': string[];
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
