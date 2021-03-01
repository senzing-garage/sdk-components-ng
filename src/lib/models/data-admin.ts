
export interface AdminStreamConnProperties {
    connected: boolean;
    clientId?: string;
    hostname: string;
    port?: number;
    secure?: boolean;
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