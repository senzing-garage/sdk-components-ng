import { SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData } from '@senzing/rest-api-client-ng';

export interface SzHowFinalCardData extends SzResolutionStep {
    resolvedVirtualEntity: SzVirtualEntity
}