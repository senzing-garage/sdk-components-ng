export interface AdminStreamConnProperties {
    connected: boolean;
    clientId?: string;
    hostname: string;
    port?: number;
    secure?: boolean;
    connectionTest: boolean;
    reconnectOnClose: boolean;
    reconnectConsecutiveAttemptLimit: number;
    path: string;
    method?: string;
}

export interface AdminStreamAnalysisConfig {
    sampleSize: number;
    uploadRate: number;
}
export interface AdminStreamLoadConfig {
    autoCreateMissingDataSources: boolean | undefined;
    assignMissingDataSourceRecordsToStaticTarget?: string | undefined | boolean;
    uploadRate: number;
}
export const AdminStreamUploadRates = {
    unlimited: -1,
    100: 100,
    1000: 1000,
    5000: 5000,
    10000: 10000,
    20000: 20000,
    50000: 50000
};
