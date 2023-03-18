import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepDisplayType, SzResolvedVirtualEntity, SzVirtualEntityRecordsClickEvent } from '../../models/data-how';
import { filter, Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';
import { SzHowUIService } from '../../services/sz-how-ui.service';

/**
 * Why
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-rc-step entityId="5"&gt;&lt;/sz-how-rc-step&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-how-rc-step entityId="5"&gt;&lt;/sz-how-rc-step&gt;<br/>
*/
@Component({
    selector: 'sz-how-rc-step',
    templateUrl: './sz-how-rc-step.component.html',
    styleUrls: ['./sz-how-rc-step.component.scss']
})
export class SzHowRCStepComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _stepMap: {[key: string]: SzResolutionStep};
    private _data: SzResolutionStep;
    private _groupId: string;
    private _groupTitle: string;
    private _isInterimStep: boolean;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean = false;
    //private _collapsed: boolean = false;
    //private _collapsedGroup: boolean = false;
    private _childrenCollapsed: boolean = false;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isExpanded(this.id);
    }
    @HostBinding('class.group-collapsed') get cssHiddenGroupClass(): boolean {
        return !this.howUIService.isGroupExpanded(this._groupId);
    }
    @HostBinding('class.group-expanded') get cssExpandedGroupClass(): boolean {
        return this.howUIService.isGroupExpanded(this._groupId);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStep) {
        this._data = value;
    }
    @Input() set groupId(value: string) {
        this._groupId = value;
    }
    @Input() set groupTitle(value: string) {
        this._groupTitle = value;
    }
    @Input() set isInterimStep(value: boolean) {
        this._isInterimStep = value;
    }
    get groupId(): string {
        return this._groupId;
    }
    get groupTitle(): string {
        return this._groupTitle;
    }
    get displayType(): SzResolutionStepDisplayType {
        let listItemVerb    = this.getStepListItemCardType(this._data);
        return listItemVerb;
    }
    get data() : SzResolutionStep {
        return this._data;
    }
    get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    public get isCollapsed() {
        return !this.howUIService.isExpanded(this.id);
    }
    public get isExpanded() {
        return this.howUIService.isExpanded(this.id);
    }
    public get isChildExpanded() {
        return !this._childrenCollapsed;
    }
    private get id(): string {
        return this._data && this._data.resolvedVirtualEntityId ? this._data.resolvedVirtualEntityId : undefined;
    }
    public get isInterimStep() {
        return this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    public get isInterimEntity() {
        return this.displayType === SzResolutionStepDisplayType.CREATE || this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this._data.resolvedVirtualEntityId)) {
            let retVal = this._virtualEntitiesById.get(this._data.resolvedVirtualEntityId);
            return retVal;
        } else {
            //console.log(`no virtual entity: ${this._data.resolvedVirtualEntityId}`, this._virtualEntitiesById);
        }
        return retVal;
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {
        // initialize
        //this._collapsedGroup = !this.howUIService.isExpanded(this._groupId);
        //this._collapsed      = !this.howUIService.isExpanded(this.id);

        // listen for group state changes
        /*
        this.howUIService.onGroupExpansionChange.pipe(
            takeUntil(this.unsubscribe$),
            filter(this.filterOutExpansionEvents.bind(this))
        ).subscribe(this.onGroupExpansionChange.bind(this));
        // listen for step state changes
        this.howUIService.onStepExpansionChange.pipe(
            takeUntil(this.unsubscribe$),
            filter(this.filterOutExpansionEvents.bind(this))
        ).subscribe(this.onStepExpansionChange.bind(this));*/
    }

    /*
    onGroupExpansionChange(gId: string) {
        //console.log(`SzHowRCStepComponent.onGroupExpansionChange: ${gId}`, this);
        if(this._groupId && this._groupId === gId) {
            // item is member of group
            this._collapsedGroup = !this.howUIService.isGroupExpanded(gId);
        }
    }
    onStepExpansionChange(sId: string) {
        //console.log(`SzHowRCStepComponent.onStepExpansionChange: ${sId}`, this);
        this._collapsed = !this.howUIService.isExpanded(sId);
    }*/

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public onExpand(value: boolean) {
        console.info('onExpand: ', value);
        this.howUIService.expand(this.id);
        //this._collapsed = value;
    }
    public onExpandChild(value: boolean) {
        console.info('onExpandChildren: ', value);
        this._childrenCollapsed = value;
    }

    private getStepListItemCardType(step: SzResolutionStep): SzResolutionStepDisplayType {
        return this._isInterimStep ? SzResolutionStepDisplayType.INTERIM : SzHowUIService.getResolutionStepCardType(step);
    }

    public getConstructionStepForVirtualEntity(virtualEntityId: string) {
        let retVal = undefined;
        if(this._stepMap && this._stepMap[virtualEntityId]) {
            // there is a step entry for the virtualEntityId passed to this function
            retVal = this._stepMap[virtualEntityId];
        }
        return retVal;
    }
}