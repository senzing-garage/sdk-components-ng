import { SzDataSourceRecordAnalysis } from './data-sources';

export class SzBulkDataAnalysis {
  characterEncoding: string;
  mediaType: string;
  recordCount: number;
  recordsWithRecordIdCount: number;
  recordsWithDataSourceCount: number;
  analysisByDataSource: SzDataSourceRecordAnalysis[];
}
