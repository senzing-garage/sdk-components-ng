import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit, ViewChild } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';
import { SzCrossSourceSummary, SzDataSourcesResponseData, SzSummaryStats } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';

/**
 * pull down menus for selecting what datasources to show in other components.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-pager></sz-cross-source-pager>
 *
 */
@Component({
  selector: 'sz-cross-source-pager',
  templateUrl: './sz-cross-source-results.pager.html',
  styleUrls: ['./sz-cross-source-results.pager.scss']
})
export class SzCrossSourcePagingComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    constructor(
        public prefs: SzPrefsService,
        private cd: ChangeDetectorRef,
        private cssService: SzCSSClassService,
        private dataMartService: SzDataMartService
    ) {}
    /**
    * unsubscribe when component is destroyed
    */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}