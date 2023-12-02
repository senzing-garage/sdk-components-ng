
export class SzDataSourceRecordAnalysis {
  dataSource: string;
  recordCount: number;
  recordsWithRecordIdCount: number;
}

export interface SzDataSourceComposite {
  name: string,
  color?: string,
  index?: number,
  hidden?: boolean
}

export interface SzStatCountsForDataSources {
  totalRecordCount: number,
  totalEntityCount: number,
  totalUnmatchedRecordCount: number,
  dataSourceCounts: SzRecordCountDataSource[]
}

export interface SzRecordCountDataSource {
  dataSourceCode: string,
  recordCount: number,
  entityCount: number,
  unnamedRecordCount?: number
}