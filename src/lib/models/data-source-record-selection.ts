export interface SzDataSourceRecordsSelection { 
    [key: string]: Array<string|number> 
}

export type SzWhySelectionModeBehavior = 'SINGLE' | 'MULTI' | 'NONE';
export const SzWhySelectionMode = {
    SINGLE: 'SINGLE' as SzWhySelectionModeBehavior,
    MULTIPLE: 'MULTI' as SzWhySelectionModeBehavior,
    NONE: 'NONE' as SzWhySelectionModeBehavior
}