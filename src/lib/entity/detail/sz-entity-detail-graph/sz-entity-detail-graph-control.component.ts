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
    templateUrl: '../../../graph/sz-graph-control.component.html',
    styleUrls: ['../../../graph/sz-graph-control.component.scss'],
    standalone: false
})
export class SzEntityDetailGraphControlComponent extends SzGraphControlComponent {
  constructor(
    private _prefs: SzPrefsService
  ) {
    super(_prefs);
  }
}
