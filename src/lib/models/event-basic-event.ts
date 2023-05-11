import { SzEntityIdentifier } from '@senzing/rest-api-client-ng';

/** 
 * extends a dom mouse event with entity specific properties.
 * @internal
 */
export interface SzEntityMouseEvent extends MouseEvent {
    entityId: SzEntityIdentifier
}
