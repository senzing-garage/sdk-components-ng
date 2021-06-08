
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