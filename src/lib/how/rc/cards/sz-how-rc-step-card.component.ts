import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary, SzResolvedEntity 
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
    selector: 'sz-how-rc-step-card',
    templateUrl: './sz-how-rc-step-card.component.html',
    styleUrls: ['./sz-how-rc-step-card.component.scss']
})
export class SzHowRCStepCardComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _stepMap: {[key: string]: SzResolutionStep};
    private _data: SzResolutionStep;
    private _parentStep: SzResolutionStep;
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
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.CREATE;
    }

    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
            //console.log('SzHowRCStepCardComponent.setVirtualEntitiesById: ', this._virtualEntitiesById);
        }
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStep) {
        this._data = value;
    }
    @Input() set parentStep(value: SzResolutionStep) {
        this._parentStep = value;
    }
    get displayType(): SzResolutionStepDisplayType {
        let listItemVerb    = this.getStepListItemType(this._data);
        return listItemVerb;
    }
    get data() : SzResolutionStep {
        return this._data;
    }
    get parentStep() {
        return this._parentStep;
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
        return this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    public get title(): string {
        let retVal = '';
        let displayType: SzResolutionStepDisplayType = this.getStepListItemType(this._data);

        if(displayType === SzResolutionStepDisplayType.INTERIM) {
            let _resolvedEntity = this.resolvedVirtualEntity;
            if(_resolvedEntity) {
                retVal = `${_resolvedEntity.virtualEntityId}: Interim Entity: ${_resolvedEntity.entityName}`;
            }
        } else if(displayType === SzResolutionStepDisplayType.CREATE) {
            // both items are virtual entities
            retVal = 'Create Virtual Entity';
        } else if(displayType === SzResolutionStepDisplayType.MERGE) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(displayType === SzResolutionStepDisplayType.ADD) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return `Step ${this._data.stepNumber}: ${retVal}`;
    }
    public get description(): string[] {
        let retVal = [];
        let displayType: SzResolutionStepDisplayType = this.getStepListItemType(this._data);
        let _resolvedEntity = this.resolvedVirtualEntity;

        if(this._data) {
            retVal.push(`Forms ${this._data.resolvedVirtualEntityId}`);
            if(this._data.matchInfo && this._data.matchInfo.matchKey) {
                retVal.push(`On ${this._data.matchInfo.matchKey}`);
            }
        }
        return retVal;
    }
    private _sourceAndRecordCount: {records: number, dataSources: number};
    public getSourceAndRecordCount(): {records: number, dataSources: number} {
        let retVal = {
            records: 0,
            dataSources: 0
        };
        if(this._sourceAndRecordCount !== undefined) {
            return this._sourceAndRecordCount;
        }
        if(this._data){
            let _dataSources    = new Map();
            let _records        = new Map();
            if(this._data.candidateVirtualEntity.records.length > 0){
                this._data.candidateVirtualEntity.records.forEach((_rec: SzVirtualEntityRecord) => {
                    _dataSources.set(_rec.dataSource,_rec.internalId);
                    _records.set(_rec.recordId,_rec.internalId)
                });
            }
            if(this._data.inboundVirtualEntity.records.length > 0){
                this._data.inboundVirtualEntity.records.forEach((_rec: SzVirtualEntityRecord) => {
                    _dataSources.set(_rec.dataSource,_rec.internalId);
                    _records.set(_rec.recordId,_rec.internalId)
                });
            }
            retVal.dataSources = [..._dataSources].length;
            retVal.records     = [..._records].length;
        }
        this._sourceAndRecordCount = retVal;
        return this._sourceAndRecordCount;
    }

    public getSourcesAndRecordsForEntity(cellSource: SzVirtualEntity) {
        let retVal = [];
        if(cellSource) {
            let _dataSourceCounts = new Map();
            cellSource.records.forEach((_rec: SzVirtualEntityRecord) => {
                let _currentValue = (_dataSourceCounts.has(_rec.dataSource)) ? _dataSourceCounts.get(_rec.dataSource) : 0;
                _dataSourceCounts.set(_rec.dataSource, _currentValue+1);
            });

            for (let [key, value] of _dataSourceCounts) {
                let strVal  = value === 1 ? `${key} (${value}): ${cellSource.records[0].recordId}` : `${key} (${value})`;
                retVal.push(strVal);
            }
        }
        return retVal.join(' | ');
    }

    public get dataRows(): SzFeatureScore[] {
        let retVal = [];
        if(this._data && this._data.matchInfo && this._data.matchInfo.featureScores) {
            let _tempMap = new Map<string,SzFeatureScore>();
            for(let fkey in this._data.matchInfo.featureScores) {
                this._data.matchInfo.featureScores[fkey].forEach((featScore: SzFeatureScore) => {
                    if(_tempMap.has(fkey)) {
                        // we only want to append if highest score of fType
                        if(_tempMap.get(fkey).score < featScore.score) {
                            _tempMap.set(fkey, featScore);
                        }
                    } else {
                        // just append
                        _tempMap.set(fkey, featScore);
                    }
                });
            }
            retVal = [..._tempMap.values()];
            // if we have features from config we should return the  
            // values in that order
            if(this.featureOrder && this.featureOrder.length > 0) {
                //console.log('reordering virtual card features by config order: ', this.featureOrder);
                retVal.sort((
                    a: SzFeatureScore, 
                    b: SzFeatureScore
                ) => {
                    return this.featureOrder.indexOf(a.featureType) - this.featureOrder.indexOf(b.featureType);
                });
            }
        }
        //console.info('dataRows: ', retVal, this.featureOrder);
        return retVal;
    }

    public get sourcesCount(): number {
        let res = this.getSourceAndRecordCount();
        return res.dataSources;
    }
    public get recordsCount(): number {
        let res = this.getSourceAndRecordCount();
        return res.records;
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
            //console.log(`no virtual entity: ${this._data.resolvedVirtualEntityId}`, this._virtualEntitiesById);
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
            if(this.parentStep) {
                return SzResolutionStepDisplayType.CREATE;
            } else {
                return SzResolutionStepDisplayType.INTERIM;
            }
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