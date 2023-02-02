import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzVirtualEntityRecordsClickEvent } from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';

/**
 * Why
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity entityId="5"&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity entityId="5"&gt;&lt;/sz-wc-why-entity&gt;<br/>
*/
@Component({
    selector: 'sz-how-step',
    templateUrl: './sz-how-step.component.html',
    styleUrls: ['./sz-how-step.component.scss']
})
export class SzHowStepComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    @Input() virtualEntityId: string;

    private _stepMap: {[key: string]: SzResolutionStep};
    private _data: SzResolutionStep;
    private _isHidden: boolean = false;
    private _highlighted: boolean = false;
    private _recordsMoreLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    public recordsMoreLinkClick                            = this._recordsMoreLinkClick.asObservable();
    @Output() public recordsMoreLinkClicked                = new EventEmitter<SzVirtualEntityRecordsClickEvent>();

    @HostBinding('class.hidden') get cssHiddenClass(): boolean {
        return this._isHidden ? true : false;
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.dimmed') get cssDimmedClass(): boolean {
        return this._highlighted === false && this.uiCoordinatorService.hasHighlightedSteps ? true : false;
    }
    get hasHighlightedSteps(){
        return this.uiCoordinatorService.hasHighlightedSteps;
    }

    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    
    @Input() set data(value: SzResolutionStep) {
        this._data = value;
    }
    get data() : SzResolutionStep {
        return this._data;
    }
    get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    get candidateVirtualEntity(): SzVirtualEntity | undefined {
        return (this._data && this._data.candidateVirtualEntity) ? this._data.candidateVirtualEntity : undefined ;
    }
    get inboundVirtualEntity(): SzVirtualEntity | undefined {
        return (this._data && this._data.inboundVirtualEntity) ? this._data.inboundVirtualEntity : undefined ;
    }
    public get isHidden() {
        return this._isHidden;
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){}

    ngOnInit() {
        this.uiCoordinatorService.stepExpansionChange.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onStepExpansionChanged.bind(this));

        this.uiCoordinatorService.onStepJump.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onStepJumpTo.bind(this));

        this.recordsMoreLinkClick.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((e: SzVirtualEntityRecordsClickEvent)=> {
            this.recordsMoreLinkClicked.emit(e);
        });
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public getConstructionStepForVirtualEntity(virtualEntityId: string) {
        let retVal = undefined;
        if(this._stepMap && this._stepMap[virtualEntityId]) {
            // there is a step entry for the virtualEntityId passed to this function
            retVal = this._stepMap[virtualEntityId];
        }
        return retVal;
    }

    private onStepJumpTo(step: SzHowResolutionUIStep) {
        if(!step) return
        this._highlighted = (step && step.data && step.data.resolvedVirtualEntityId === this.virtualEntityId);
    }

    private onStepExpansionChanged(expansionEvent: SzHowStepUIStateChangeEvent) {
        if(!(this._data.resolvedVirtualEntityId && this._data.resolvedVirtualEntityId)) {
            return;
        }
        let allStepsAreHidden = false;
        if(expansionEvent && this._data && expansionEvent.hiddenVirtualIds && (expansionEvent.hiddenVirtualIds.indexOf(this._data.candidateVirtualEntity.virtualEntityId) > -1 && expansionEvent.hiddenVirtualIds.indexOf(this._data.inboundVirtualEntity.virtualEntityId) > -1)) {
            allStepsAreHidden = true;
        }
        this._isHidden = allStepsAreHidden
        //console.log(`SzHowStepComponent.onStepExpansionChanged: ${allStepsAreHidden}`, expansionEvent);
    }

    public onHighlightedConstructionFeaturesChanged(features: SzFeatureScore[], virtualEntityId: string) {
        //console.log('SzHowStepComponent.onHighlightedConstructionFeaturesChanged()'+ virtualEntityId, features);
        this.uiCoordinatorService.highlightStepFeatures(virtualEntityId, features);
    }
    public onRecordsMoreLinkClicked(e: SzVirtualEntityRecordsClickEvent) {
        this._recordsMoreLinkClick.next(e);
    }
}