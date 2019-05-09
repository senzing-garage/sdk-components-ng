import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';

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
  isOpen: boolean = true;

  @Input() data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 2;
  @Input() maxEntities: number = 25;
  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  get expanded(): boolean {
    return this.isOpen;
  }

  @HostBinding('class.open') get cssClssOpen() { return this.expanded; };
  @HostBinding('class.closed') get cssClssClosed() { return !this.expanded; };

  public get graphIds(): number[] {
    let _ret = [];
    if(this.data && this.data.resolvedEntity) {
      _ret.push(this.data.resolvedEntity.entityId);
    }
    return _ret;
  }

  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
  }

  constructor() {}
  ngOnInit() {}
}
