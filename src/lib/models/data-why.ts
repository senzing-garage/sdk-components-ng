import { SzCandidateKey, SzEntityFeature, SzEntityFeatureStatistics, SzFeatureScore, SzWhyEntityResult, SzWhyPerspective } from '@senzing/rest-api-client-ng';
import { SzEntityMouseEvent } from './event-basic-event';

/** used to categorize records in a virtual entity by their datasources */
export interface SzWhyFeatureRow {
    key: string, title: string
}

/*export interface SzWhyFeatureWithStats extends SzEntityFeature {
    primaryStatistics?: SzEntityFeatureStatistics,
    duplicateStatistics?: Map<number, SzEntityFeatureStatistics>
    statistics?: Map<number, SzEntityFeatureStatistics>
}*/

export interface SzWhyEntityHTMLFragment {
    src: string,
    tagName: string,
    cssClasses: string[]
}

export interface SzWhyEntityColumn extends SzWhyEntityResult, SzWhyPerspective {
    internalId: number,
    dataSources: string[],
    whyResult?: {key: string, rule: string},
    rows: {[key: string]: Array<SzFeatureScore | SzCandidateKey | SzEntityFeature>}
    formattedRows?: {[key: string]: string | string[] | SzWhyEntityHTMLFragment | SzWhyEntityHTMLFragment[] }
}

/** 
 * extends a dom mouse event with properties specific to a why query.
 * @internal
 */
export interface whyClickEvent extends SzEntityMouseEvent {}
