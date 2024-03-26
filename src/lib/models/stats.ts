import { SzLoadedStats, SzSourceLoadedStats, SzLoadedStatsResponse } from "@senzing/rest-api-client-ng";

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