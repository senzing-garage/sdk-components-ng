import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';

@Component({
    selector: 'sz-how-entity-card-base',
    template: `
    <div class="handle">
        <mat-icon fontIcon="arrow_right" *ngIf="!branchExpanded">arrow_right</mat-icon>
        <mat-icon fontIcon="arrow_left" *ngIf="branchExpanded">arrow_left</mat-icon>
    </div>
    <div class="content">
        
    </div>
    `,
    styles: []
})
export class SzHowCardBaseComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public branchExpanded = false;

    constructor(){

    }
    ngOnInit() {}
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}