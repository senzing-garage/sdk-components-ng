import { Injectable, Output, EventEmitter } from '@angular/core';

import {
  EntityDataService,
  ConfigService,
  SzResolvedEntity,
  SzRelatedEntity
} from '@senzing/rest-api-client-ng';

/** @internal */
export interface RelationshipHoverEvent {
  resolvedEntity: SzResolvedEntity,
  relatedEntities: SzRelatedEntity[]
}

/**
 * Provides global level UI eventing.
 * Used for things like hover tooltips, collapse/expand,
 * Component state changes etc.
 *
 * @export
 * @class SzUIEventService
 */
@Injectable({
  providedIn: 'root'
})
export class SzUIEventService {
  @Output() onRelationshipHover: EventEmitter<RelationshipHoverEvent> = new EventEmitter<RelationshipHoverEvent>();
  @Output() onRelationshipOver: EventEmitter<RelationshipHoverEvent> = new EventEmitter<RelationshipHoverEvent>();
  @Output() onRelationshipOut: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private entityDataService: EntityDataService,
    private configService: ConfigService) {}
}
