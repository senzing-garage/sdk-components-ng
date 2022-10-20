export interface SzDataSourceRecordsSelection { 
    [key: string]: Array<string|number> 
}
export interface SzDataSourceRecordSelection { 
    [key: string]: Array<string|number> 
}

export type SzWhySelectionActionBehavior = 'WHY' | 'WHY_NOT' | 'NONE';
export const SzWhySelectionAction = {
    WHY: 'WHY' as SzWhySelectionActionBehavior,
    WHY_NOT: 'WHY_NOT' as SzWhySelectionActionBehavior,
    NONE: 'NONE' as SzWhySelectionActionBehavior
}

export type SzWhySelectionModeBehavior = 'SINGLE' | 'MULTI' | 'NONE';
export const SzWhySelectionMode = {
    SINGLE: 'SINGLE' as SzWhySelectionModeBehavior,
    MULTIPLE: 'MULTI' as SzWhySelectionModeBehavior,
    NONE: 'NONE' as SzWhySelectionModeBehavior
}