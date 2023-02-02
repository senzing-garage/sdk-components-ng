import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { parseSzIdentifier } from '../../../common/utils';

@Component({
    selector: 'sz-how-entity-card-base',
    template: `
    <div class="handle">
        <mat-icon fontIcon="arrow_right" *ngIf="!branchExpanded">arrow_right</mat-icon>
        <mat-icon fontIcon="arrow_left" *ngIf="branchExpanded">arrow_left</mat-icon>
    </div>
    <div class="content">
        <header>Entity <span class="entity-id"></span></header>
        <mat-accordion #steps class="steps-ribbon"></mat-accordion>
        <mat-accordion #features class="features" multi></mat-accordion>
    </div>
    `,
    styles: []
})
export class SzHowCardBaseComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    public branchExpanded = true;
    private _isPreceedingStepVisible: boolean = false;

    @Input() isPreceedingStepVisible(value: boolean) {
        this._isPreceedingStepVisible = value;
    }
    @ViewChild('features') featuresAccordion: MatAccordion;
    @ViewChild('steps') stepsAccordion: MatAccordion;

    constructor(){}
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}