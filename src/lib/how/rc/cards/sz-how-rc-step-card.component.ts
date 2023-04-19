import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzFeatureScore, SzResolutionStep, SzVirtualEntity, SzVirtualEntityRecord, SzDataSourceRecordSummary, SzResponseWithRawData 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepListItemType, SzResolutionStepDisplayType, SzResolutionStepNode, SzResolvedVirtualEntity, SzVirtualEntityRecordsClickEvent } from '../../../models/data-how';
import {  Subject } from 'rxjs';
import { parseSzIdentifier } from '../../../common/utils';
//import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../../services/sz-how-ui-coordinator.service';
import { SzHowUIService } from '../../../services/sz-how-ui.service';
import { SzHowRCVirtualEntityDialog } from '../sz-how-rc-virtual-entity-dialog.component';

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
    private _data: SzResolutionStep | SzResolutionStepNode;
    private _groupId: string;
    private _isInterimStep: boolean;
    private _parentStep: SzResolutionStep;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean = false;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isStepExpanded(this.id);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.MERGE;
    }
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.INTERIM;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.CREATE;
    }
    @HostBinding('class.group-collapsed') get cssGroupCollapsedClass(): boolean {
        return this._groupId && !this.howUIService.isGroupExpanded(this._groupId);
    }
    @HostBinding('class.group-expanded') get cssGroupExpandedClass(): boolean {
        return this._groupId && this.howUIService.isGroupExpanded(this._groupId);
    }
    @HostBinding('class.group-member') get cssGroupMemberClass(): boolean {
        return this.isGroupMember;
    }
    @HostBinding('class.pinned') get cssGroupMemberPinnedClass(): boolean {
        return !this.isUnpinned;
    }
    @HostBinding('class.unpinned') get cssGroupMemberUnPinnedClass(): boolean {
        return this.isUnpinned;
    }

    @Input() featureOrder: string[];

    @Input() set isInterimStep(value: boolean) {
        this._isInterimStep = value;
    }
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
    @Input() set parentStep(value: SzResolutionStep) {
        this._parentStep = value;
    }
    @Input() set groupId(value: string) {
        this._groupId = value;
    }
    @Output()
    onExpand: EventEmitter<boolean>                          = new EventEmitter<boolean>();
    
    public toggleExpansion(vId?: string) {
        //this.onExpand.next(!this._collapsed);
        vId = vId ? vId : this.id;
        this.howUIService.toggleExpansion(vId);
    }
    public toggleGroupExpansion(gId?: string) {
        gId = gId ? gId : this.id;
        this.howUIService.toggleExpansion(undefined, gId);
    }
    public get isGroupCollapsed() {
        return !this.howUIService.isGroupExpanded(this._groupId);
    }
    private get id(): string {
        return this._data && this._data.resolvedVirtualEntityId ? this._data.resolvedVirtualEntityId : undefined;
    }
    get canExpand(): boolean {
        return true;
        let vId = (this.isGroupMember || this.groupTitle !== undefined) && this._groupId ? this._groupId : this.id;
        return !this.howUIService.isExpanded(vId);
    }
    get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
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

    get stepType(): SzResolutionStepDisplayType {
        if((this._data as SzResolutionStepNode).stepType){
            return (this._data as SzResolutionStepNode).stepType;
        }
        // try and "sense" display type
        return this.getStepListItemCardType((this._data as SzResolutionStep));
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

    /*get displayType(): SzResolutionStepDisplayType {
        let listItemVerb    = this.getStepListItemCardType(this._data);
        return listItemVerb;
    }*/
    get data() : SzResolutionStep {
        return this._data;
    }
    get isGroupMember(): boolean {
        return this.howUIService.isNodeMemberOfGroup(this._data.resolvedVirtualEntityId);
    }
    get isStackGroupMember(): boolean {
        return this.howUIService.isStepMemberOfStack(this.id, this._groupId);
    }
    get isUnpinned(): boolean {
        return !this.howUIService.isStepPinned(this._data.resolvedVirtualEntityId, this._groupId);
    }
    get canBeGrouped(): boolean {
        return this.howUIService.stepCanBeUnPinned(this._data.resolvedVirtualEntityId);
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
        return !this.howUIService.isStepExpanded(this.id);
    }
    public get isMergeStep() {
        return this.stepType === SzResolutionStepDisplayType.MERGE;
    }
    public get isInterimStep() {
        return this.stepType === SzResolutionStepDisplayType.INTERIM;
    }
    public get isCreateEntityStep() {
        return this.stepType === SzResolutionStepDisplayType.CREATE;
    }
    public get isFinalEntity() {
        return this.stepType === SzResolutionStepDisplayType.FINAL;
    }
    public get isAddRecordStep() {
        return this.stepType === SzResolutionStepDisplayType.ADD;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    public get from(): string[] {
        let retVal = [];
        // do datasources
        if(this._data && this._data.candidateVirtualEntity && this._data.candidateVirtualEntity.records) {
            retVal = retVal.concat(this._data.candidateVirtualEntity.records.map((record: SzVirtualEntityRecord) => {
                return `${record.dataSource}:${record.recordId}`;
            }));
        }
        if(this._data && this._data.inboundVirtualEntity && this._data.inboundVirtualEntity.records) {
            retVal = retVal.concat(this._data.inboundVirtualEntity.records.map((record: SzVirtualEntityRecord) => {
                return `${record.dataSource}:${record.recordId}`;
            }));
        }
        return retVal;
    }
    public get groupTitle(): string {
        let retVal;
        if(this.hasChildren) {
            if(this.isInterimStep) {
                let _data = (this._data as SzResolutionStepNode);
                retVal = 'Interim Entity';
                if(_data) {
                    if(_data.id) {
                        retVal = _data.id +': '+ retVal;
                        // get just the single item matching the id
                        if(this._virtualEntitiesById && this._virtualEntitiesById.has(_data.id)){
                            // add name
                            let _vEnt = this._virtualEntitiesById.get(_data.id);
                            retVal = _vEnt ? retVal +': ' : retVal;
                            retVal = retVal + (_vEnt.bestName ? _vEnt.bestName : _vEnt.entityName);
                        }
                    }
                }
            }
        }
        return retVal;
    }
    public get title(): string {
        let retVal = '';
        let displayType: SzResolutionStepDisplayType = this.getStepListItemCardType(this._data);

        if(displayType === SzResolutionStepDisplayType.INTERIM) {
            let _resolvedEntity = this.resolvedVirtualEntity;
            if(_resolvedEntity) {
                retVal = `${_resolvedEntity.virtualEntityId}: Interim Entity: ${_resolvedEntity.entityName}`;
            }
        } else if(displayType === SzResolutionStepDisplayType.CREATE) {
            // both items are virtual entities
            let _resolvedEntity = this.resolvedVirtualEntity;
            retVal = 'Create Virtual Entity'+ (_resolvedEntity && _resolvedEntity.virtualEntityId ? ' '+_resolvedEntity.virtualEntityId : '');
        } else if(displayType === SzResolutionStepDisplayType.MERGE) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(displayType === SzResolutionStepDisplayType.ADD) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return (displayType !== SzResolutionStepDisplayType.INTERIM) ? `Step ${this._data.stepNumber}: ${retVal}` : retVal;
    }
    public get description(): string[] {
        let retVal = [];
        let displayType: SzResolutionStepDisplayType = this.getStepListItemCardType(this._data);
        let _resolvedEntity = this.resolvedVirtualEntity;

        if(this._data) {
            let eType = this.isInterimStep && this.hasChildren ? 'Interim Entity' : 'Virtual Entity';
            retVal.push(`Forms <span class="emphasized">${eType} ${this._data.resolvedVirtualEntityId}</span>`);
            if(this._data.matchInfo && this._data.matchInfo.matchKey) {
                retVal.push(`On <span class="emphasized">${this._data.matchInfo.matchKey}</span>`);
            }
            if(this._data.matchInfo && this._data.matchInfo.resolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.matchInfo.resolutionRule}</span>`);
            }
        }
        return retVal;
    }
    public get forms(): string {
        return (this._data && this._data.resolvedVirtualEntityId) ? (this._data.resolvedVirtualEntityId) : undefined;
    }
    public get resolutionRule(): string {
        if(this._data && this._data.matchInfo && this._data.matchInfo.resolutionRule) {
            return this._data.matchInfo.resolutionRule;
        }
        return undefined;
    }
    public get matchKey(): string {
        if(this._data && this._data.matchInfo && this._data.matchInfo.matchKey) {
            return this._data.matchInfo.matchKey;
        }
        return undefined;
    }
    public get dataSources(): string[] {
        let retVal;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            retVal = _resolvedEntity.recordSummaries.map((rs: SzDataSourceRecordSummary) => {
                return `${rs.dataSource} (${rs.recordCount})`;
            });
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
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this.id)) {
            let retVal = this._virtualEntitiesById.get(this.id);
            return retVal;
        } else {
            console.log(`no virtual entity: ${this.id}`, this._virtualEntitiesById);
        }
        return retVal;
    }


    openVirtualEntityDialog(evt) {
      console.log('openVirtualEntityDialog: ', evt, this.resolvedVirtualEntity, this._data, this.featureOrder);
      //return;
      //this._virtualEntityInfoLinkClick.next(evt);
      let targetEle = new ElementRef(evt.target);
      const dialogRef = this.dialog.open(SzHowRCVirtualEntityDialog, {
          panelClass: 'how-virtual-entity-dialog-panel',
          hasBackdrop: false,
          data: {
            target: targetEle,
            virtualEntity: this.resolvedVirtualEntity,
            stepData: this._data,
            featureOrder: this.featureOrder,
            event: evt
        }
      });
    }

    public pinStep() {
        console.log(`pinStep()`, this._data.resolvedVirtualEntityId, this._groupId);
        this.howUIService.pinStep(this._data.resolvedVirtualEntityId, this._groupId);
    }

    public unPinStep() {
        console.log(`unPinStep()`, this._data.resolvedVirtualEntityId, this._groupId);
        this.howUIService.unPinStep(this._data.resolvedVirtualEntityId);
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService,
        public dialog: MatDialog
    ){}

    ngOnInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
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