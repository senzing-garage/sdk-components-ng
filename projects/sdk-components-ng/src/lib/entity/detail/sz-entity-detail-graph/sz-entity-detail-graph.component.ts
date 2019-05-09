import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph',
  templateUrl: './sz-entity-detail-graph.component.html',
  styleUrls: ['./sz-entity-detail-graph.component.scss']
})
export class SzEntityDetailGraphComponent implements OnInit {
  @Input() data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 2;
  @Input() maxEntities: number = 25;

  public get graphIds(): number[] {
    let _ret = [];
    if(this.data && this.data.resolvedEntity) {
      _ret.push(this.data.resolvedEntity.entityId);
    }
    return _ret;
  }

  constructor() {}

  ngOnInit() {
  }
}
