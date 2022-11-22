import { SzFeatureScore, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData } from '@senzing/rest-api-client-ng';

export interface SzHowFinalCardData extends SzResolutionStep {
    resolvedVirtualEntity: SzVirtualEntity
}

export interface SzHowStepHightlightEvent {
    features: {[key: string]: SzFeatureScore[]}
    sourceStepId: string
}

export interface SzResolutionStepUI extends SzResolutionStep {
    visible: boolean
    expanded: boolean
    preceedingSteps: SzResolutionStepUI[]
}