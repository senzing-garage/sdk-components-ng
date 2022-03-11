import { Component, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzGraphComponent } from '../../../graph/sz-graph.component';

/**
 * Embeddable Graph Component
 * used to display a entity and its network relationships
 * to other entities visually.
 *
 * Optionally can display a embedded filter control to allow user
 * to change the components parameters of this component.
 *
 * @example 
 * <code>
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-standalone-graph<br/>
          filterWidth="320"<br/>
          [graphIds]="graphIds"<br/>
          [showPopOutIcon]="false"<br/>
          [showMatchKeyControl]="false"<br/>
          [showFiltersControl]="false"<br/>
          [filterControlPosition]="'top-right'"<br/>
          (entityClick)="onGraphEntityClick($event)"<br/>
          [showMatchKeys]="true"<br/>
      &gt;&lt;/sz-standalone-graph&gt;<br/><br/>
 *
 * &lt;!-- (WC) by attribute --&gt;<br/>
 * &lt;sz-wc-standalone-graph<br/>
          filter-width="320"<br/>
          graph-ids="1,1001,1002"<br/>
          show-pop-out-icon="false"<br/>
          show-match-key-control="false"<br/>
          show-filters-control="false"<br/>
          filter-control-position="top-right"<br/>
          show-match-keys="true"<br/>
      &gt;&lt;/sz-wc-standalone-graph&gt;<br/><br/>
 *
 * &lt;!-- (WC) by DOM --&gt;<br/>
 * &lt;sz-wc-standalone-graph id="sz-wc-standalone-graph"&gt;&lt;/sz-wc-standalone-graph&gt;<br/>
 * &lt;script&gt;<br/>
 * document.getElementById('sz-wc-standalone-graph').graphIds = [1,1001,1002];<br/>
 * document.getElementById('sz-wc-standalone-graph').addEventListener('entityClick', (data) => { console.log('entity clicked on!', data); })<br/>
 * &lt;/script&gt;<br/><br/>
 * </code>
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
