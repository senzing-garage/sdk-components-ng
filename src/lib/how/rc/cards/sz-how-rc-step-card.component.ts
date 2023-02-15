import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepDisplayType, SzResolvedVirtualEntity, SzVirtualEntityRecordsClickEvent } from '../../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../../common/utils';
import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../../services/sz-how-ui-coordinator.service';

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
    templateUrl: './sz-how-rc-step-card.component.html',
    styleUrls: ['./sz-how-rc-step-card.component.scss']
})
export class SzHowRCStepComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _stepMap: {[key: string]: SzResolutionStep};
    private _data: SzResolutionStep;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean = false;
    private _collapsed: boolean = false;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return this._collapsed ? true : false;
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.MERGE;
    }
    @HostBinding('class.type-interim') get cssTypeCreateClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.CREATE;
    }

    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
            console.log('SzHowRCStepComponent.setVirtualEntitiesById: ', this._virtualEntitiesById);
        }
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStep) {
        this._data = value;
    }
    get displayType(): SzResolutionStepDisplayType {
        let listItemVerb    = this.getStepListItemType(this._data);
        return listItemVerb;
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
    public get isCollapsed() {
        return this._collapsed;
    }
    public get isInterimEntity() {
        return this.displayType === SzResolutionStepDisplayType.CREATE;
    }
    public get title(): string {
        let retVal = '';
        if(this._data.candidateVirtualEntity.singleton && this._data.inboundVirtualEntity.singleton) {
            // both items are records
            //retVal = 'Create Virtual Entity';
            let _resolvedEntity = this.resolvedVirtualEntity;
            if(_resolvedEntity) {
                retVal = `${_resolvedEntity.virtualEntityId}: Interim Entity: ${_resolvedEntity.entityName}`;
            }
        } else if(!this._data.candidateVirtualEntity.singleton && !this._data.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(!(this._data.candidateVirtualEntity.singleton && this._data.inboundVirtualEntity.singleton) && (this._data.candidateVirtualEntity.singleton === false || this._data.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return `Step ${this._data.stepNumber}: ${retVal}`;
    }
    public get dataSourcesAsString(): string {
        let retVal = '';
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            let db_str = _resolvedEntity.recordSummaries.map((rs: SzDataSourceRecordSummary) => {
                return `${rs.dataSource} (${rs.recordCount})`;
            }).join(' | ');
            retVal += `${db_str}`;
        }
        return retVal;
    }
    public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this._data.resolvedVirtualEntityId)) {
            let retVal = this._virtualEntitiesById.get(this._data.resolvedVirtualEntityId);
            return retVal;
        } else {
            console.log(`no virtual entity: ${this._data.resolvedVirtualEntityId}`, this._virtualEntitiesById);
        }
        return retVal;
    }

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

    private getStepListItemType(step: SzResolutionStep): SzResolutionStepDisplayType {
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            return SzResolutionStepDisplayType.CREATE;
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            return SzResolutionStepDisplayType.MERGE;
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            return SzResolutionStepDisplayType.ADD;
        }
        return undefined;
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