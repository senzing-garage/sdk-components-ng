import { Component, HostBinding, Input, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService, SzSdkPrefsModel } from '../../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../../services/sz-datasources.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SzDataSourceComposite } from '../../../models/data-sources';
import { SzMatchKeyComposite } from '../../../models/graph';
import { sortDataSourcesByIndex, sortMatchKeysByIndex } from '../../../common/utils';
import { SzGraphFilterComponent } from '../../../graph/sz-graph-filter.component';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example <!-- (Angular) -->
 * <sz-entity-detail-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-entity-detail-graph-filter>
 *
 * @example <!-- (WC) -->
 * <sz-wc-standalone-graph-filters id="sz-entity-detail-graph-filter"></sz-wc-standalone-graph-filters>
 * <script>
 * document.getElementById('sz-wc-standalone-graph-filters').addEventListener('optionChanged', function(data) { console.log('filter(s) changed', data); });
 * </script>
 */
@Component({
  selector: 'sz-entity-detail-graph-filter',
  templateUrl: './sz-entity-detail-graph-filter.component.html',
  styleUrls: ['../../../graph/sz-graph-filter.component.scss']
})
export class SzEntityDetailGraphFilterComponent {
  
}
