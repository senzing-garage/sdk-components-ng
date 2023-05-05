import { SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord } from '@senzing/rest-api-client-ng';
import { SzEntityMouseEvent } from './event-basic-event';
/** when a user clicks a "more info" link on a step card this event 
 * extends a regular mouse click with how specific information
*/
export interface SzVirtualEntityRecordsClickEvent extends MouseEvent {
    records?: Array<SzVirtualEntityRecord>,
    dataSourceName?: string
}
/** extends a resolved entity model with virtual entity properties to tie 
 * the two together.
 */
export interface SzResolvedVirtualEntity extends SzResolvedEntity {
    virtualEntityId: string
}
/** used to categorize records in a virtual entity by their datasources */
export interface SzVirtualEntityRecordsByDataSource {
    [key: string]: Array<SzVirtualEntityRecord> 
}
/** Common wrapper for extending data from a How step with UI specific features
 * and things like "children" for converting a flat dimensional step to a recursive 
 * heirarchal Tree of steps.
 */
export interface SzResolutionStepNode extends SzResolutionStep, SzVirtualEntity {
    /** id of virtual entity or generated uuid */
    id: string,
    /** the ids of virtual entities found in children steps */
    virtualEntityIds?: string[],
    /** used for deciding presentation information of a card */
    stepType?: SzResolutionStepDisplayType,
    /** used for deciding what type of component to embed, whether or not the component has 
     * things like nested steps, or flat arrays of contiguous items etc
     */
    itemType?: SzResolutionStepListItemType,
    /** child steps that were used to make this step */
    children?: Array<SzResolutionStepNode | SzResolutionStep>,
    /** child records pulled out of steps found in the `children` steps */
    childRecords?: Array<SzVirtualEntityRecord>,
    /** is this step a child of another step */
    isMemberOfGroup?: boolean,
    /** the id of the parent group */
    memberOfGroup?: string,
    /** the resolved virtual entity has much more information than a regular step 
     * and is more like an snapshot of an "entity" at a particular point in it's resolution
     */
    resolvedVirtualEntity?: SzResolvedVirtualEntity
}
/** when a user clicks on a "how" button in the entity detail or in a search result this payload of the click emitted */
export interface howClickEvent extends SzEntityMouseEvent {}
/** the custom type of `SzResolutionStepListItemType` */
export type SzResolutionStepListItemType = 'FINAL' | 'GROUP' | 'STACK' | 'STEP';
/** the possible values of a `SzResolutionStepListItemType` is */
export const SzResolutionStepListItemType = {
    /* use for final step states*/
    FINAL: 'FINAL' as SzResolutionStepListItemType,
    /** use for steps that have other steps as children and are not "STACK"'s */
    GROUP: 'GROUP' as SzResolutionStepListItemType,
    /** use to group CONTIGUOUS steps of the same type so they can be grouped together 
     * (usually multiple "ADD" or "CREATE") */
    STACK: 'STACK' as SzResolutionStepListItemType,
    /** every step that is not a group of some kind */
    STEP: 'STEP' as SzResolutionStepListItemType
};
/** the custom type of `SzResolutionStepDisplayType` */
export type SzResolutionStepDisplayType = 'ADD' | 'CREATE' | 'FINAL' | 'INTERIM' | 'MERGE';
/** the enumeration of what the possible values of a `SzResolutionStepDisplayType` is */
export const SzResolutionStepDisplayType = {
    /** added a singleton to another virtual entity(commonly an interim or final) */
    ADD: 'ADD' as SzResolutionStepDisplayType,
    /** create new virtual entity based on two singletons */
    CREATE: 'CREATE' as SzResolutionStepDisplayType,
    /** a final state of an entity */
    FINAL: 'FINAL' as SzResolutionStepDisplayType,
    /** interim cards are virtual entities used for applying additional steps (commonly merges) */
    INTERIM: 'INTERIM' as SzResolutionStepDisplayType,
    /** merge records are individual cards */
    MERGE: 'MERGE' as SzResolutionStepDisplayType
};