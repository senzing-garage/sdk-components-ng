import { SzFeatureScore, SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord } from '@senzing/rest-api-client-ng';
import { SzEntityMouseEvent } from './event-basic-event';

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

export interface SzVirtualEntityRecordsByDataSource {
    [key: string]: Array<SzVirtualEntityRecord> 
}

export interface SzResolutionStepGroup {
    id: string,
    arrayIndex?: number,
    isStackGroup?: boolean,
    virtualEntityIds?: string[],
    mergeStep?: SzResolutionStep,
    interimSteps?: SzResolutionStep[],
    resolutionSteps?: SzResolutionStep[]
}

export interface howClickEvent extends SzEntityMouseEvent {}
export type SzResolutionStepListItemType = 'STACK' | 'GROUP' | 'STEP';
export const SzResolutionStepListItemType = {
    STACK: 'STACK' as SzResolutionStepListItemType,
    GROUP: 'GROUP' as SzResolutionStepListItemType,
    STEP: 'STEP' as SzResolutionStepListItemType
};

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