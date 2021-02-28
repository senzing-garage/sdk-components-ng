
export interface AdminStreamConnProperties {
    connected: boolean;
    clientId?: string;
    hostname: string;
    port?: number;
    connectionTest: boolean;
    reconnectOnClose: boolean;
    reconnectConsecutiveAttemptLimit: number;
}

export interface AdminStreamAnalysisConfig {
    sampleSize: number;
}
export interface AdminStreamLoadConfig {
    autoCreateMissingDataSources: boolean | undefined;
    assignMissingDataSourceRecordsToStaticTarget?: string | undefined | boolean;
}