import { SzEntityIdentifier } from '@senzing/rest-api-client-ng';

export interface SzEntityMouseEvent extends MouseEvent {
    entityId: SzEntityIdentifier
}
