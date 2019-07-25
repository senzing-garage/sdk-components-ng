import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';
import { SzEntityDetailGraphControlComponent } from './sz-entity-detail-graph-control.component';

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

  @Input() public title: string = "Relationships at a Glance";
  @Input() data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }
  public _showMatchKeys = false;
  @Input() public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
    //console.log('@senzing/sdk-components-ng:sz-entity-detail-graph.showMatchKeys: ', value);
  };
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 90;
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
  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  @ViewChild(SzEntityDetailGraphControlComponent) graphComponent: SzEntityDetailGraphControlComponent;

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityDblClick: EventEmitter<any> = new EventEmitter<any>();

  public get graphIds(): number[] {
    let _ret = [];
    if(this.data && this.data.resolvedEntity) {
      _ret.push(this.data.resolvedEntity.entityId);
    }
    return _ret;
  }

  /** toggle collapsed/expanded state of graph */
  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityClick(event: any) {
    this.entityClick.emit(event);
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityDblClick(event: any) {
    this.entityDblClick.emit(event);
  }
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "contextMenuClick" event.
   * automatically adds the container ele page x/y to relative svg x/y for total x/y offset
   */
  public onRightClick(event: any) {
    if(this.graphContainerEle && this.graphContainerEle.nativeElement) {
      interface evtModel {
        address?: string
        entityId?: number
        iconType?: string
        index?: number
        isCoreNode?: false
        isQueriedNode?: false
        name?: string
        orgName?: string
        phone?: string
        x?: number
        y?: number
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: evtModel = Object.assign({}, event);
      // change x/y to include element relative offset
      evtSynth.x = (Math.floor(pos.x) + Math.floor(event.x));
      evtSynth.y = (Math.floor(pos.y) + Math.floor(event.y));
      //console.warn('onRightClick: ', pos, event);
      this.contextMenuClick.emit( evtSynth );
    }
  }

  public onOptionChange(event: {name: string, value: any}) {
    switch(event.name) {
      case 'showLinkLabels':
        this.showMatchKeys = event.value;
        break;
    }
  }

  constructor() {}
  ngOnInit() {}
}
