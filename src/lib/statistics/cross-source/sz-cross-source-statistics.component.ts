import { Component, HostBinding, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';

/**
 * Wrapper component for the comparing stats of one datasource 
 * with their mutual stat type of another datasource. Uses the 
 * Venn Diagram chart to show the overlap and a special Data Table 
 * specific to displaying a sample set from the selected type of stats
 * for the two selected data sources.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-statistics></sz-cross-source-statistics>
 *
 */
@Component({
  selector: 'sz-cross-source-statistics',
  templateUrl: './sz-cross-source-statistics.component.html',
  styleUrls: ['./sz-cross-source-statistics.component.scss']
})
export class SzCrossSourceStatistics implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  constructor() {}
  ngOnInit() {}
  ngAfterViewInit() {}
  //ngAfterContentInit

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}