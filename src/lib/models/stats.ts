import { SzCountStats, SzSourceCountStats, SzCountStatsResponse } from "@senzing/rest-api-client-ng";

export interface SzCountStatsForDataSourcesResponse extends SzCountStatsResponse {
    /** override with extended */
    data?: SzStatCountsForDataSources;
}
export interface SzStatCountsForDataSources extends SzCountStats {
    /** we add pending count so app can optionally inject values */
    totalPendingCount?: number, 
    /** we change this to the extended model which includes color and pending count */
    dataSourceCounts: SzRecordCountDataSource[]
}
export interface SzRecordCountDataSource extends SzSourceCountStats {
    pendingCount?: number,
    color?: string
  }