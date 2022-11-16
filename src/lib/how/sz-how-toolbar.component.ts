import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzConfigResponse 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzHowFinalCardData } from '../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';
import { SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../services/sz-how-ui-coordinator.service';

@Component({
    selector: 'sz-how-toolbar',
    templateUrl: './sz-how-toolbar.component.html',
    styleUrls: ['./sz-how-toolbar.component.scss']
})
export class SzHowToolbarComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){}

    ngOnInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}