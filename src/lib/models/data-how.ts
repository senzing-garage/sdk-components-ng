import { SzFeatureScore, SzRecordId, SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityData, SzVirtualEntityRecord, SzVirtualEntityResponse } from '@senzing/rest-api-client-ng';

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

export interface SzResolvedVirtualEntity extends SzResolvedEntity {
    virtualEntityId: string
}

export interface SzResolutionStepGroup {
    arrayIndex?: number,
    virtualEntityIds?: string[],
    resolutionSteps: SzResolutionStep[]
}

export type SzResolutionStepDisplayType = 'MERGE' | 'CREATE' | 'INTERIM' | 'ADD' | 'FINAL';
export const SzResolutionStepDisplayType = {
    MERGE: 'MERGE' as SzResolutionStepDisplayType,
    CREATE: 'CREATE' as SzResolutionStepDisplayType,
    INTERIM: 'INTERIM' as SzResolutionStepDisplayType,
    ADD: 'ADD' as SzResolutionStepDisplayType,
    FINAL: 'FINAL' as SzResolutionStepDisplayType
};

export interface SzResolutionStepListItem extends SzResolutionStep {
    actionType: SzResolutionStepDisplayType,
    title: string,
    cssClasses?: string[],
    description: {text: string, cssClasses: string[]}[],
    recordIds?: string[],
    dataSources?: string[],
    freeTextTerms?: string[]
}