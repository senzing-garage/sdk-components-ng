import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, ElementRef, HostBinding } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { 
    EntityDataService as SzEntityDataService, 
    SzFeatureScore, SzResolutionStep, SzScoredFeature, SzVirtualEntity, SzVirtualEntityRecord, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzResolutionStepListItemType, SzResolutionStepDisplayType, SzResolutionStepNode, SzResolvedVirtualEntity } from '../../models/data-how';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowVirtualEntityDialog } from '../sz-how-virtual-entity-dialog.component';
import { SzPrefsService } from '../../services/sz-prefs.service';

/**
 * @internal
 * 
 * This is the base class that provides common methods, inputs, outputs, getters, and setters 
 * for step card components. This class is inherited by the basic step card component 
 * and the final card component.
*/
@Component({
    selector: 'sz-how-step-card-base',
    template: `<p>Step Card Base</p>`,
    styleUrls: ['./sz-how-card-base.component.scss']
})
export class SzHowStepCardBase implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    protected unsubscribe$ = new Subject<void>();
    protected _stepMap: {[key: string]: SzResolutionStep};
    //protected _data: SzResolutionStep | SzResolutionStepNode;
    protected _data: SzResolutionStepNode;
    protected _siblings: Array<SzResolutionStep | SzResolutionStepNode>;
    protected _isInterimStep: boolean;
    protected _sourceAndRecordCount: {records: number, dataSources: number};
    protected _parentStep: SzResolutionStep;
    protected _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    protected _highlighted: boolean           = false;
    protected _groupId: string;
    protected _groupIndex: number;
    // ----------------------------------- css classes -----------------------------------
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isStepExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isStepExpanded(this.id);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.CREATE;
    }
    @HostBinding('class.type-final') get cssTypeClass(): boolean {
        return false;
    }
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.isInterimStep;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.MERGE && !this.isInterimStep;
    }
    @HostBinding('class.group-collapsed') get cssGroupCollapsedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? !this.howUIService.isGroupExpanded(_grpId) : false;
    }
    @HostBinding('class.group-container') get cssGroupParentClass(): boolean {
        return this.isGroup;
    }
    @HostBinding('class.group-expanded') get cssGroupExpandedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? this.howUIService.isGroupExpanded(_grpId) : false;
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
    // ------------------------------ getters and setters    -----------------------------
    @Input() set groupIndex(value: number) {
        this._groupIndex = value;
    }

    @Input() protected set isInterimStep(value: boolean) {
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
    /*@Input() set data(value: SzResolutionStep) {
        this._data = value;
    }*/
    @Input() set data(value: SzResolutionStep | SzResolutionStepNode) {
        this._data = (value as SzResolutionStepNode);
    }
    @Input() set siblings(value: Array<SzResolutionStep | SzResolutionStepNode>) {
        this._siblings = value;
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
        vId = vId ? vId : this.id;
        //console.log(`SzHowStepCardBase.toggleExpansion(${vId})`);
        this.howUIService.toggleExpansion(vId, undefined, this.itemType);
    }
    public toggleGroupExpansion(gId?: string) {
        gId             = gId ? gId : this.id;
        // groups cannot be members of stacks
        let itemType    = this.isInterimStep ? SzResolutionStepListItemType.GROUP : this.isStackGroupMember ? SzResolutionStepListItemType.STACK : this.itemType;
        //console.log(`SzHowStepCardBase.toggleGroupExpansion(${gId}) match ${itemType}`, this.howUIService.getStepNodeById(gId, true), this.howUIService.stepNodes);
        this.howUIService.toggleExpansion(undefined, gId, itemType, true);
    }
    protected get isGroupCollapsed() {
        return !this.howUIService.isGroupExpanded(this._groupId);
    }
    protected get id(): string {
        return this._data && this._data.id ? this._data.id : this._data.resolvedVirtualEntityId ? this._data.resolvedVirtualEntityId : undefined;
    }
    get canExpand(): boolean {
        return true;
        /*let vId = (this.isGroupMember || this.groupTitle !== undefined) && this._groupId ? this._groupId : this.id;
        return !this.howUIService.isExpanded(vId);*/
    }
    protected get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
    }
    
    protected get isStack() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK)
    }
    protected get isGroup() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.GROUP)
    }
    protected get isStep() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP) ? true : ((_d as SzResolutionStepNode).itemType === undefined ? true : false);
    }
    protected get isInterim() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).isInterim === true) ? true :  false;
    }

    protected get stepType(): SzResolutionStepDisplayType {
        if((this._data as SzResolutionStepNode).stepType){
            return (this._data as SzResolutionStepNode).stepType;
        }
        // try and "sense" display type
        return this.getStepListItemCardType((this._data as SzResolutionStep));
    }
    protected get hasChildren(): boolean {
        return (this._data as SzResolutionStepNode).children && (this._data as SzResolutionStepNode).children.length > 0;
    }
    protected get children(): Array<SzResolutionStepNode | SzResolutionStep> {
        if(this.hasChildren) {
            return (this._data as SzResolutionStepNode).children;
        }
        return undefined;
    }
    get data() : SzResolutionStepNode {
        return this._data;
    }
    get groupId(): string {
        return this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
    }
    get isGroupMember(): boolean {
        return (this._data as SzResolutionStepNode).isMemberOfGroup;
    }
    get isStackGroupMember(): boolean {
        return this.howUIService.isStepMemberOfStack(this.id, this._groupId);
    }
    get isStackGroupMemberDebug(): boolean {
        return this.howUIService.isStepMemberOfStack(this.id, this._groupId, true);
    }
    get isUnpinned(): boolean {
        return !this.howUIService.isStepPinned(this._data.resolvedVirtualEntityId, this._groupId);
    }
    get canBeGrouped(): boolean {
        return false;
        //return this.howUIService.stepCanBeUnPinned(this._data.resolvedVirtualEntityId);
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
    get column1VirtualEntity(): SzVirtualEntity | undefined {
        let candidateOnLeft = this.candidateDataOnLeft;
        return candidateOnLeft ? (this._data && this._data.candidateVirtualEntity ? this._data.candidateVirtualEntity : undefined) : (this._data && this._data.inboundVirtualEntity ? this._data.inboundVirtualEntity : undefined) ;
    }
    get column2VirtualEntity(): SzVirtualEntity | undefined {
        let candidateOnLeft = this.candidateDataOnLeft;
        return candidateOnLeft ? (this._data && this._data.inboundVirtualEntity ? this._data.inboundVirtualEntity : undefined) : (this._data && this._data.candidateVirtualEntity ? this._data.candidateVirtualEntity : undefined);
    }
    get inboundVirtualEntity(): SzVirtualEntity | undefined {
        return (this._data && this._data.inboundVirtualEntity) ? this._data.inboundVirtualEntity : undefined ;
    }
    public get isCollapsed() {
        return !this.howUIService.isStepExpanded(this.id);
    }
    protected get isMergeStep() {
        return this.stepType === SzResolutionStepDisplayType.MERGE;
    }
    protected get isInterimStep() {
        return this.itemType === SzResolutionStepListItemType.GROUP && this.isInterim;
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
        } else if(this.isStackGroupMember) {
            if(this._groupIndex > 0){
                retVal = '';
            } else {
                retVal = 'Stack group member';
                if(this._siblings) {
                    let _retTypes = new Map<SzResolutionStepDisplayType, number>();
                    // get this type
                    _retTypes.set(SzHowUIService.getResolutionStepCardType(this._data), 1);
                    // get sibling types
                    this._siblings.forEach((step: SzResolutionStep) => {
                        let _retType = SzHowUIService.getResolutionStepCardType(step);
                        if(_retTypes.has(_retType)){
                            _retTypes.set(_retType, (_retTypes.get(_retType) + 1));
                        } else {
                            _retTypes.set(_retType, 1);
                        }
                    });
                    if(_retTypes.size > 0) {
                        retVal = '';
                        //console.log('_retTypes: ', _retTypes);
        
                        _retTypes.forEach((typeCount, retType) => {
                            //console.log(`\t\t${retType}`, typeCount);
                            if(retType === SzResolutionStepDisplayType.ADD) {
                                retVal += `${typeCount} x Add Record to Virtual Entity\n\r`;
                            }
                        });
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
            if(this._data.matchInfo && this._data.matchInfo.resolutionRule && this.showResolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.matchInfo.resolutionRule}</span>`);
            }
        }
        return retVal;
    }
    public get forms(): string {
        return (this._data && this._data.resolvedVirtualEntityId) ? (this._data.resolvedVirtualEntityId) : undefined;
    }
    public get showResolutionRule(): boolean {
        return this.prefs && this.prefs.how && this.prefs.how.showResolutionRule;
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
    public get hasDataSources(): number {
        let retVal = 0;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            retVal = _resolvedEntity.recordSummaries.length;
        }
        return retVal;
    }
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
            if(this._data.candidateVirtualEntity && this._data.candidateVirtualEntity.records && this._data.candidateVirtualEntity.records.length > 0){
                this._data.candidateVirtualEntity.records.forEach((_rec: SzVirtualEntityRecord) => {
                    _dataSources.set(_rec.dataSource,_rec.internalId);
                    _records.set(_rec.recordId,_rec.internalId)
                });
            }
            if(this._data.inboundVirtualEntity && this._data.inboundVirtualEntity.records && this._data.inboundVirtualEntity.records.length > 0){
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
                let strVal  = value === 1 ? `${key}:${cellSource.records[0].recordId}` : `${key} (${value})`;
                retVal.push(strVal);
            }
        }
        return retVal.join(' | ');
    }

    public get dataRows(): SzFeatureScore[] {
        let retVal = [];
        let candidateDataOnLeft = this.candidateDataOnLeft;

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
            if(this.howUIService.orderedFeatures && this.howUIService.orderedFeatures.length > 0) {
                //console.log('reordering virtual card features by config order: ', this.featureOrder);
                retVal.sort((
                    a: SzFeatureScore, 
                    b: SzFeatureScore
                ) => {
                    return this.howUIService.orderedFeatures.indexOf(a.featureType) - this.howUIService.orderedFeatures.indexOf(b.featureType);
                });
            }
        }
        //console.info('dataRows: ', retVal, this.featureOrder);
        return retVal;
    }
    public getDataRowColumn1Score(feature: SzFeatureScore): SzScoredFeature {
        let candidateDataOnLeft = this.candidateDataOnLeft;
        return candidateDataOnLeft ? feature.candidateFeature : feature.inboundFeature;
    }
    public getDataRowColumn2Score(feature: SzFeatureScore): SzScoredFeature {
        let candidateDataOnLeft = this.candidateDataOnLeft;
        return candidateDataOnLeft ? feature.inboundFeature : feature.candidateFeature;
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
            //console.log(`no virtual entity: ${this.id}`, this._virtualEntitiesById);
        }
        return retVal;
    }
    public getMatchKeyAsObjects(matchKey?: string): Map<string, boolean> {
        let retVal: Map<string, any> = new Map();
        if(!matchKey) {
            matchKey = (this._data && this._data.matchInfo && this._data.matchInfo.matchKey) ? this._data.matchInfo.matchKey : matchKey;
            if(!matchKey) { return retVal; }
        }
        if(matchKey && matchKey.split) {
            // break match key apart in to tokens
            let posTokens = matchKey.split('+').filter((v) => { return v && v.trim ? v.trim() !== '' : false}).map((token: string)=>{
                if(token.indexOf('-') > -1) {
                    // token has a negative pair in it
                    let _posTokenStr    = token.substring(0,token.indexOf('-'));
                    let _negTokenStr    = token.substring(token.indexOf('-'));
                    let _negTokens      = _negTokenStr.split('-').filter((v) => { return v && v.trim ? v.trim() !== '' : false});
                    retVal.set(_posTokenStr, true);
                    _negTokens.forEach((tokenStr: string) => {
                        retVal.set(tokenStr, false);
                    });
                    retVal.set(_posTokenStr, true);
                } else {
                    // no negative tokens so no need to split
                    retVal.set(token, true);
                }
            })
        }
        //console.log(`getMatchKeyAsObjects('${matchKey}'): `, retVal);
        return retVal;
    }
    private get candidateDataOnLeft(): boolean {
        let candidateOnLeft = true;
        if(this._data && this._data.candidateVirtualEntity && this._data.inboundVirtualEntity) {
            let candidateRecCount   = this._data.candidateVirtualEntity.records && this._data.candidateVirtualEntity.records.length ? this._data.candidateVirtualEntity.records : 0;
            let inboundRecCount     = this._data.inboundVirtualEntity.records && this._data.inboundVirtualEntity.records.length ? this._data.inboundVirtualEntity.records : 0;
            candidateOnLeft         = candidateRecCount <= inboundRecCount;
        }
        return candidateOnLeft;
    }
    protected isMatchKeyForFeaturePositive(feature: SzFeatureScore): boolean | undefined {
        let matchKeysAsObjects  = this.getMatchKeyAsObjects();
        if(matchKeysAsObjects && matchKeysAsObjects.has && matchKeysAsObjects.has(feature.featureType)) {
            return matchKeysAsObjects.get(feature.featureType);
        }
        return undefined;
    }
    public isCellHighlightedRed(feature: SzFeatureScore, featureValue: any): boolean {
        let matchKeyIsPositive  = this.isMatchKeyForFeaturePositive(feature);
        if(matchKeyIsPositive !== undefined && matchKeyIsPositive === false) {
            return true;
        }
        return false;
    }
    public isCellHighlightedYellow(feature: SzFeatureScore, featureValue: any): boolean {
        let matchKeyIsPositive  = this.isMatchKeyForFeaturePositive(feature);
        if(
            (feature.scoringBucket !== 'CLOSE' && feature.scoringBucket !== 'SAME') && 
            (
                matchKeyIsPositive === undefined || 
                (matchKeyIsPositive !== undefined && matchKeyIsPositive !== false)
            )
        ) {
            return true;
        }
        return false;
    }
    public isCellHighlightedGreen(feature: SzFeatureScore, featureValue: any): boolean {
        let matchKeyIsPositive  = this.isMatchKeyForFeaturePositive(feature);
        if(
            matchKeyIsPositive === true || 
            feature.scoringBucket === 'SAME' || 
            feature.scoringBucket === 'CLOSE'
        ) {
                return true;
        }
        return false;
    }
    openVirtualEntityDialog(evt) {
      console.log('openVirtualEntityDialog: ', evt, this.resolvedVirtualEntity, this._data, this.howUIService.orderedFeatures);
      //return;
      //this._virtualEntityInfoLinkClick.next(evt);
      let targetEle = new ElementRef(evt.target);
      const dialogRef = this.dialog.open(SzHowVirtualEntityDialog, {
          panelClass: 'how-virtual-entity-dialog-panel',
          hasBackdrop: false,
          data: {
            target: targetEle,
            virtualEntity: this.resolvedVirtualEntity,
            stepData: this._data,
            featureOrder: this.howUIService.orderedFeatures,
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
        protected howUIService: SzHowUIService,
        public dialog: MatDialog,
        private prefs: SzPrefsService
    ){}

    ngOnInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    protected getStepListItemCardType(step: SzResolutionStep): SzResolutionStepDisplayType {
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