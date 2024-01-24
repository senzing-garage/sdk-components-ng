import { Component, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Embeddable Data Table Component
 * used to display a collection of entities in a spreadsheet format.
 *
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-data-table
          [data]="dataJSON"
          [columns]="col1,col2,col3"
      ></sz-data-table>
 *
 */
@Component({
  selector: 'sz-data-table',
  templateUrl: './sz-data-table.component.html',
  styleUrls: ['./sz-data-table.component.scss']
})
export class SzDataTable implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  constructor() {}
  ngOnInit() {}
  ngAfterViewInit() {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}