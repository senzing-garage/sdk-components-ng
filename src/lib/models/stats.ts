import { SzLoadedStats, SzSourceLoadedStats, SzLoadedStatsResponse, SzResolvedEntity, SzRelatedEntity, SzRecord, SzMatchedRecord, SzEntityRecord } from "@senzing/rest-api-client-ng";

export interface SzCountStatsForDataSourcesResponse extends SzLoadedStatsResponse {
    /** override with extended */
    data?: SzStatCountsForDataSources;
}
export interface SzStatCountsForDataSources extends SzLoadedStats {
    /** we add pending count so app can optionally inject values */
    totalPendingCount?: number, 
    /** we change this to the extended model which includes color and pending count */
    dataSourceCounts: SzRecordCountDataSource[]
}
export interface SzRecordCountDataSource extends SzSourceLoadedStats {
    pendingCount?: number,
    color?: string
}

export type SzCrossSourceSummaryCategoryType = 'MATCHES' | 'AMBIGUOUS_MATCHES' | 'POSSIBLE_MATCHES' | 'POSSIBLE_RELATIONS' | 'DISCLOSED_RELATIONS';
/** the possible values of a `SzCrossSourceSummaryCategoryType` is */
export const SzCrossSourceSummaryCategoryType = {
    MATCHES: 'MATCHES' as SzCrossSourceSummaryCategoryType,
    AMBIGUOUS_MATCHES: 'AMBIGUOUS_MATCHES' as SzCrossSourceSummaryCategoryType,
    POSSIBLE_MATCHES: 'POSSIBLE_MATCHES' as SzCrossSourceSummaryCategoryType,
    POSSIBLE_RELATIONS: 'POSSIBLE_RELATIONS' as SzCrossSourceSummaryCategoryType,
    DISCLOSED_RELATIONS: 'DISCLOSED_RELATIONS' as SzCrossSourceSummaryCategoryType
};

export interface SzCrossSourceSummarySelectionEvent {
    dataSource1?: string,
    dataSource2?: string,
    matchLevel?: number,
    matchKey?: string,
    principle?: string,
    statType?: SzCrossSourceSummaryCategoryType
}

export interface SzCrossSourceSummarySelectionClickEvent extends MouseEvent {
    dataSource1?: string,
    dataSource2?: string,
    matchLevel?: number,
    statType?: SzCrossSourceSummaryCategoryType
}

export interface SzStatSampleEntityTableItem extends SzResolvedEntity {
    relatedEntities?: SzRelatedEntity[],
    recordCount?: number,
    records?: SzRecord[] | SzMatchedRecord[],
    rows?: SzStatSampleEntityTableRow[]
}

/*
let _allColumns = [
    'Entity ID',
    'More',
    'ER Code',
    'Match Key',
    'Related Entity ID',
    'Data Source',
    'Record ID',
    'Entity Type',
    'Name Data',
    'Attribute Data',
    'Address Data',
    'Relationship Data'
  ];
*/

export interface SzStatSampleEntityTableRow extends SzResolvedEntity, SzMatchedRecord {
    /**
     * The data source code identifying the data source from  which the record was loaded.
     */
    dataSource?: string;
    /**
     * The record ID that uniquely identifies the record within the data source from which it was loaded.
     */
    recordId?: string;
    /**
     * The optional match key describing why the record merged into the entity to which it belongs.  This may be absent or `null` if this record belongs to a single-record entity or if it was the inital record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    matchKey?: string;
    /**
     * The optioanl principle identifying the resolution rule that was used to merge the record into the entity to which it belonss.  This may be absent or `null` if this record belongs to a single-record entity or if it was the inital record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    principle?: string;
}