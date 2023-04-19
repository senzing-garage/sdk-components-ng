import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepListItemType, SzResolutionStepNode, SzResolvedVirtualEntity, SzVirtualEntityRecordsClickEvent } from '../../models/data-how';
import { filter, Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
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
    selector: 'sz-how-rc-step-node',
    templateUrl: './sz-how-rc-step-node.component.html',
    styleUrls: ['./sz-how-rc-step-node.component.scss']
})
export class SzHowRCStepNodeComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _data: SzResolutionStepNode | SzResolutionStep;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean = false;
    //private _collapsed: boolean = false;
    //private _collapsedGroup: boolean = false;
    private _childrenCollapsed: boolean = false;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return this.isCollapsed;
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.isExpanded;
    }
    @HostBinding('class.group-collapsed') get cssHiddenGroupClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-expanded') get cssExpandedGroupClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @Input() featureOrder: string[];

    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStepNode | SzResolutionStep) {
        this._data = value;
    }
    get data() : SzResolutionStepNode | SzResolutionStep {
        return this._data;
    }
    public get isCollapsed() {
        if((this.isGroup || this.isStack) && this.hasChildren) {
            // check group
            return !this.howUIService.isGroupExpanded(this.id)
        } else {
            // check node
            return !this.howUIService.isStepExpanded(this.id);
        }
    }
    public get isExpanded() {
        if((this.isGroup || this.isStack) && this.hasChildren) {
            // check group
            return this.howUIService.isGroupExpanded(this.id)
        } else {
            // check node
            return this.howUIService.isStepExpanded(this.id);
        }
    }
    public get id(): string {
        return this.isStep ? (this._data as SzResolutionStep).resolvedVirtualEntityId : (this._data as SzResolutionStepNode).id;
    }
    public get isStack() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK)
    }
    public get isGroup() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.GROUP)
    }
    public get isStep() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP) ? true : ((_d as SzResolutionStepNode).itemType === undefined ? true : false);
    }
    public get hasChildren(): boolean {
        return (this._data as SzResolutionStepNode).children && (this._data as SzResolutionStepNode).children.length > 0;
    }
    public get children(): Array<SzResolutionStepNode | SzResolutionStep> {
        if(this.hasChildren) {
            return (this._data as SzResolutionStepNode).children;
        }
        return undefined;
    }
    get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService
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