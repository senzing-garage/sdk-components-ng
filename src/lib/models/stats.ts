import { SzLoadedStats, SzSourceLoadedStats, SzLoadedStatsResponse, SzResolvedEntity, SzRelatedEntity } from "@senzing/rest-api-client-ng";

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
    relatedEntities: SzRelatedEntity[]
}