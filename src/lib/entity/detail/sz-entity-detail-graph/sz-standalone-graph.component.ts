import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType,
  SzEntityNetworkData
} from '@senzing/rest-api-client-ng';
import { SzGraphControlComponent } from '../../../graph/sz-graph-control.component';
import { SzRelationshipNetworkComponent, NodeFilterPair, SzNetworkGraphInputs } from '@senzing/sdk-graph-components';
import { parseBool, sortDataSourcesByIndex } from '../../../common/utils';
import { SzDataSourceComposite } from '../../../models/data-sources';
import { SzGraphComponent } from '../../../graph/sz-graph.component';

/**
 * Embeddable Graph Component
 * used to display a entity and its network relationships
 * to other entities visually.
 *
 * Optionally can display a embedded filter control to allow user
 * to change the components parameters of this component.
 *
 * @example <!-- (Angular) -->
 * <sz-standalone-graph
          filterWidth="320"
          [graphIds]="graphIds"
          [showPopOutIcon]="false"
          [showMatchKeyControl]="false"
          [showFiltersControl]="false"
          [filterControlPosition]="'top-right'"
          (entityClick)="onGraphEntityClick($event)"
          [showMatchKeys]="true"
      ></sz-standalone-graph>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-standalone-graph
          filter-width="320"
          graph-ids="1,1001,1002"
          show-pop-out-icon="false"
          show-match-key-control="false"
          show-filters-control="false"
          filter-control-position="top-right"
          show-match-keys="true"
      ></sz-wc-standalone-graph>
 *
 * @example <!-- (WC) by DOM -->
 * <sz-wc-standalone-graph id="sz-wc-standalone-graph"></sz-wc-standalone-graph>
 * <script>
 * document.getElementById('sz-wc-standalone-graph').graphIds = [1,1001,1002];
 * document.getElementById('sz-wc-standalone-graph').addEventListener('entityClick', (data) => { console.log('entity clicked on!', data); })
 * </script>
 */
@Component({
  selector: 'sz-standalone-graph',
  templateUrl: '../../../graph/sz-graph.component.html',
  styleUrls: ['../../../graph/sz-graph.component.scss']
})
export class SzStandaloneGraphComponent extends SzGraphComponent {
  constructor(
    public _p_prefs: SzPrefsService,
    private _p_cd: ChangeDetectorRef
  ) {
    super(_p_prefs, _p_cd)
  }
}
