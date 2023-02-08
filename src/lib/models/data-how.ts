import { SzFeatureScore, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzVirtualEntityRecord } from '@senzing/rest-api-client-ng';

export interface SzHowFinalCardData extends SzResolutionStep {
    resolvedVirtualEntity: SzVirtualEntity
}

export interface SzHowStepHightlightEvent {
    features: {[key: string]: SzFeatureScore[]},
    sourceStepId: string,
    matchKey?: string,
    resolutionRule?: string
}

export interface SzVirtualEntityRecordsClickEvent extends MouseEvent {
    records?: Array<SzVirtualEntityRecord>,
    dataSourceName?: string
}

export interface SzMatchFeatureScore extends SzFeatureScore {
    matchKey?: string,
    resolutionRule?: string
}

export interface SzResolutionStepUI extends SzResolutionStep {
    visible: boolean
    expanded: boolean
    preceedingSteps: SzResolutionStepUI[]
}

export type SzResolutionStepDisplayType = 'MERGE' | 'CREATE' | 'ADD';
export const SzResolutionStepDisplayType = {
    MERGE: 'MERGE' as SzResolutionStepDisplayType,
    CREATE: 'CREATE' as SzResolutionStepDisplayType,
    ADD: 'ADD' as SzResolutionStepDisplayType
};

export interface SzResolutionStepListItem extends SzResolutionStep {
    actionType: SzResolutionStepDisplayType,
    title: string,
    cssClasses?: string[],
    description: {text: string, cssClasses: string[]}[],
}