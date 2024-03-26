import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { Observable, Subject, takeUntil, throwError, zip } from 'rxjs';

import { SzDataTable } from '../../shared/data-table/sz-data-table.component';

/**
 * Data Table with specific overrides and formatting for displaying 
 * sample results from the cross source summary component.
 */
@Component({
  selector: 'sz-cross-source-results',
  templateUrl: './sz-cross-source-results.data-table.html',
  styleUrls: ['./sz-cross-source-results.data-table.scss']
})
export class SzCrossSourceResultsDataTable extends SzDataTable implements OnInit, OnDestroy {

    constructor() {
        super();
    }
}