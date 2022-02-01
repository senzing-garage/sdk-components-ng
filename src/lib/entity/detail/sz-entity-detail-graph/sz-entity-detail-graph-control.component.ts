import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { SzGraphControlComponent } from '../../../graph/sz-graph-control.component';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph-control',
  templateUrl: './sz-entity-detail-graph-control.component.html',
  styleUrls: ['../../../graph/sz-graph-control.component.scss']
})
export class SzEntityDetailGraphControlComponent {
  constructor(
    public prefs: SzPrefsService
  ) {}
}
