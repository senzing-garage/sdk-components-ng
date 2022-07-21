import { Component, HostBinding, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import {
  SzRelatedEntity,
  SzResolvedEntity
} from '@senzing/rest-api-client-ng';
import { SzGraphNodeFilterPair, SzNetworkGraphInputs } from '../../../models/graph';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzGraphComponent } from '../../../graph/sz-graph.component';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph',
  templateUrl: './sz-entity-detail-graph.component.html',
  styleUrls: ['./sz-entity-detail-graph.component.scss']
})
export class SzEntityDetailGraphComponent extends SzGraphComponent {
  @Input() public override title: string = "Relationships at a Glance";

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   * @deprecated
  */
  private _data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   * @deprecated
  */
  @Input() public set data(value: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }) {
    this._data = value;
    if(value && value.resolvedEntity) {
      this._graphIds = [ value.resolvedEntity.entityId ];
    }
  }

  /** data passed in from parent component
   * used in sz-entity-detail.component.
   * passes in entity node data needed for context display
   *
   * @deprecated
  */
  public get data(): {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  } {
    return this._data;
  }

  @Input() public captureMouseWheel: boolean = true;
  @Output() public scrollWheelEvent: EventEmitter<WheelEvent> = new EventEmitter<WheelEvent>()

  @HostBinding('class.open') get cssClssOpen() { return this.expanded; }
  @HostBinding('class.closed') get cssClssClosed() { return !this.expanded; }

  _inputs: SzNetworkGraphInputs;

  constructor(
    public _p_prefs: SzPrefsService,
    private _p_cd: ChangeDetectorRef
  ) {
    super(_p_prefs, _p_cd)
  }

  /** toggle collapsed/expanded state of graph */
  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
    if(this.expanded !== !this.prefs.entityDetail.graphSectionCollapsed) {
      this.prefs.entityDetail.graphSectionCollapsed = !this.expanded;
    }
  }

  /**
   * Older style data passing, comes from the SzNetworkInputs->XMLHTTPRequest->mutation->event
   * @deprecated
   */
   onNetworkLoaded(inputs: SzNetworkGraphInputs) {
    this._inputs = inputs;
  }

  /**
   * handler for when the user performs a mouse wheel scroll event
   */
  public onGraphScrollEvent(evt: Event) {
    //this.scrollWheelEvent.emit(evt);
  }
  /**
   * 
   * @deprecated use entityNodeFilters property instead
   */
  public get entityNodeFilterByDataSource(): SzGraphNodeFilterPair[] {
    return this.entityNodeFilters;
  }
  /** 
   * for detail graph view we only want filters on if the user 
   * can select them.
   */
  override get entityNodeFilters(): SzGraphNodeFilterPair[] {
    let _ret = [];
    if(this.dataSourcesFiltered && this.showFiltersControl) {
      _ret = this.dataSourcesFiltered.map( (_name) => {
        return {
          selectorFn: this.isEntityNodeInDataSource.bind(this, false, _name),
          selectorArgs: _name
        };
      });
    }
    return _ret;
  }
}
