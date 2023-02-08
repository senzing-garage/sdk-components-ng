import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzConfigResponse, SzEntityIdentifier, SzVirtualEntityRecord 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepDisplayType, SzResolutionStepListItem } from '../../models/data-how';
import { parseBool } from '../../common/utils';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';
import { MatSelect } from '@angular/material/select';

@Component({
    selector: 'sz-how-rc-nav',
    templateUrl: './sz-how-rc-nav.component.html',
    styleUrls: ['./sz-how-rc-nav.component.scss']
})
export class SzHowRCNavComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep} = {};
    @Input() public finalEntityId: SzEntityIdentifier;

    private _finalVirtualEntities: SzVirtualEntity[];
    @Input() set finalVirtualEntities(value: SzVirtualEntity[]) {
        this._finalVirtualEntities = value;
    }
    public get finalVirtualEntities(): SzVirtualEntity[] {
        return this._finalVirtualEntities;
    }
    public pdModels = [
        '',
        '',
        '',
        '',
    ];

    get finalVirtualEntityStepNumber(): number {
        let retVal = 0;
        if(this._finalVirtualEntities)
            if(this._finalVirtualEntities.length == 1 && this._stepMap[this._finalVirtualEntities[0].virtualEntityId]) {
                // single result
                this._finalVirtualEntities[0].virtualEntityId
                retVal = parseInt( this._stepMap[this._finalVirtualEntities[0].virtualEntityId].stepNumber as unknown as string) + 1;
            } else {
                // hold on to your hat, this is kind of wild

            }
        return retVal;
    }

    public get numberOfSteps() {
        let retVal = 0;
        if(this._stepMap) {
            retVal = Object.keys(this._stepMap).length;
        }
        return retVal;
    }

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        console.info('set stepsByVirtualId: ',value);
        this._stepMap = value;
    }
    get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    get allSteps(): SzResolutionStep[] {
        let retVal = [];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            _steps[0].resolvedVirtualEntityId
            retVal = _steps;
        }
        return retVal;
    }
    get numberOfTotalSteps(): number {
        let retVal = 0;
        if(this._stepMap && Object.keys(this._stepMap)) {
            retVal = Object.keys(this._stepMap).length;
        }
        return retVal;
    }
    get numberOfMergeSteps(): number {
        let retVal = 0;
        if(this.mergeSteps) {
            retVal = this.mergeSteps.length;
        }
        return retVal;
    }
    get numberOfAddRecordSteps(): number {
        let retVal = 0;
        if(this.addRecordSteps) {
            retVal = this.addRecordSteps.length;
        }
        return retVal;
    }
    get numberOfCreateVirtualEntitySteps(): number {
        let retVal = 0;
        if(this.createEntitySteps) {
            retVal = this.createEntitySteps.length;
        }
        return retVal;
    }
    
    get mergeSteps(): SzResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzResolutionStep) => {
                // check if merge step
                if(!(step.candidateVirtualEntity.singleton && 
                    step.inboundVirtualEntity.singleton) && 
                    (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)
                ) {
                    return true;
                }
                return false;
            });
        }
        return retVal;
    }
    get addRecordSteps(): SzResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzResolutionStep) => {
                // check if merge step
                if(!(step.candidateVirtualEntity.singleton && 
                    step.inboundVirtualEntity.singleton) && 
                    (step.candidateVirtualEntity.singleton === true || step.inboundVirtualEntity.singleton === true)
                ) {
                    return true;
                }
                return false;
            });
            if(_tVal) {
                retVal = _tVal;
            }
        }
        return retVal;
    }
    get createEntitySteps(): SzResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzResolutionStep) => {
                // check if merge step
                if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
                    return true;
                }
                return false;
            });
            retVal = _tVal;
        }
        return retVal;
    }

    // ---------------------------------------- start parameters
    private _filterByTextOrRecordId: string             = undefined;
    private _filterByVirtualEntityCreation: boolean     = false;
    private _filterByMergeInterimEntitites: boolean     = false;
    private _filterByAddRecordtoVirtualEntity: boolean  = false;
    private _filterByLowScoringNames: boolean           = false;
    private _filterByLowScoringAddresses                = false;
        // ---------------------------------------- public getters
        get filterByTextOrRecordId(): string | undefined   { return this._filterByTextOrRecordId; }
        get filterByVirtualEntityCreation(): boolean       { return this._filterByVirtualEntityCreation; }
        get filterByMergeInterimEntitites(): boolean       { return this._filterByMergeInterimEntitites; }
        get filterByAddRecordtoVirtualEntity(): boolean    { return this._filterByAddRecordtoVirtualEntity; }
        get filterByLowScoringNames(): boolean             { return this._filterByLowScoringNames; }
        get filterByLowScoringAddresses(): boolean         { return this._filterByLowScoringAddresses; }
        // ---------------------------------------- public setters
        @Input() set filterByTextOrRecordId(value: string | undefined) {
            this._filterByTextOrRecordId = value;
        }
        @Input() set filterByVirtualEntityCreation(value: boolean | undefined) {
            this._filterByVirtualEntityCreation = parseBool(value);
        }
        @Input() set filterByMergeInterimEntitites(value: boolean | undefined) {
            this._filterByMergeInterimEntitites = parseBool(value);
        }
        @Input() set filterByAddRecordtoVirtualEntity(value: boolean | undefined) {
            this._filterByAddRecordtoVirtualEntity = parseBool(value);
        }
        @Input() set filterByLowScoringNames(value: boolean | undefined) {
            this._filterByLowScoringNames = parseBool(value);
        }
        @Input() set filterByLowScoringAddresses(value: boolean | undefined) {
            this._filterByLowScoringAddresses = parseBool(value);
        }
    // ---------------------------------------- end parameters

    // ---------------------------------------- start filtered collection getters
    
    public get listSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[] = [];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            _steps[0].resolvedVirtualEntityId
            retVal = _steps.map((_s: SzResolutionStep) => {
                let _t: SzResolutionStepListItem = Object.assign({
                    actionType: this.getStepListItemType(_s),
                    cssClasses: this.getStepListItemCssClasses(_s), 
                    title: this.getStepListItemTitle(_s),
                    description: this.getStepListItemDescription(_s)
                }, _s);
                return _t;
            });
        }
        //retVal[0].
        return retVal;
    }

    public get filteredListSteps(): SzResolutionStepListItem[] {
        let retVal = this.listSteps;

        return retVal;
    }


    private getStepListItemType(step: SzResolutionStep): SzResolutionStepDisplayType {
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            return SzResolutionStepDisplayType.CREATE;
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            return SzResolutionStepDisplayType.ADD;
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            return SzResolutionStepDisplayType.MERGE;
        }
        return undefined;
    }


    private getStepListItemTitle(step: SzResolutionStep): string {
        let retVal = '';
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            retVal = 'Create Virtual Entity';
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        }
        return retVal;
    }

    private getStepListItemDescription(step: SzResolutionStep): {text: string, cssClasses: string[]}[] {
        let retVal = [];
        if(step){
            if(step.candidateVirtualEntity) {
                if(step.candidateVirtualEntity.singleton && step.candidateVirtualEntity.records) {
                    retVal = retVal.concat(step.candidateVirtualEntity.records.map((rec: SzVirtualEntityRecord) => {
                        return {text: (rec.dataSource + ':'+ rec.recordId), cssClasses: ['candidate','singleton']};
                    }));
                } else {
                    retVal.push({text: (`Virtual Entity ${step.candidateVirtualEntity.virtualEntityId}`), cssClasses: ['candidate']});
                }
            }
            if(step.inboundVirtualEntity) {
                if(step.inboundVirtualEntity.singleton && step.inboundVirtualEntity.records) {
                    retVal = retVal.concat(step.inboundVirtualEntity.records.map((rec: SzVirtualEntityRecord) => {
                        return {text: (rec.dataSource + ':'+ rec.recordId), cssClasses: ['inbound','singleton']};
                    }));
                } else {
                    retVal.push({text: (`Virtual Entity ${step.inboundVirtualEntity.virtualEntityId}`), cssClasses: ['inbound']});
                }
            }
            retVal.push({text: (`Virtual Entity ${step.resolvedVirtualEntityId}`), cssClasses: ['resolved']});
        }
        return retVal;
    }

    private getStepListItemCssClasses(step: SzResolutionStep) {
        let listItemVerb    = this.getStepListItemType(step);
        let cssClasses      = [];
        if(listItemVerb === SzResolutionStepDisplayType.ADD)    { cssClasses = cssClasses.concat(['record', 'add']); }
        if(listItemVerb === SzResolutionStepDisplayType.CREATE) { cssClasses = cssClasses.concat(['virtual-entity','create']); }
        if(listItemVerb === SzResolutionStepDisplayType.MERGE)  { cssClasses = cssClasses.concat(['virtual-entity', 'merge']); }

        return cssClasses;
    }


    // ---------------------------------------- end filtered collection getters

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){}

    ngOnInit() {
        this.pdModels = ['','','',''];
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public getIconForStep(step: SzResolutionStep) {
        let retVal = 'merge';
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            retVal = 'merge';
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'ramp_left';
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'merge';
        }
        return retVal;
    }

    public stepDescription(step: SzResolutionStep) {
        let retVal = '';
        if(step && step.resolvedVirtualEntityId && this._stepMap && this._stepMap[step.resolvedVirtualEntityId]){
            let isStepOneOfFinalEntities = false;
            if(this._finalVirtualEntities) {
                isStepOneOfFinalEntities = this._finalVirtualEntities.some((vEnt: SzVirtualEntity) => {
                    return vEnt.virtualEntityId === step.resolvedVirtualEntityId;
                });
            }
            if(isStepOneOfFinalEntities) {
                retVal = (this._finalVirtualEntities && this._finalVirtualEntities.length === 1) ? `Entity ${this.finalEntityId}` : `Entity ${step.resolvedVirtualEntityId}`;
            } else {
                retVal = `Virtual Entity ${step.resolvedVirtualEntityId}`;
            }
        }
        return retVal;
    }

    public jumpTo(virtualEntityId: string) {
        this.uiCoordinatorService.jumpTo(virtualEntityId);
        this.pdModels[0] = virtualEntityId;
        this.pdModels[1] = virtualEntityId;
        this.pdModels[2] = virtualEntityId;
        this.pdModels[3] = virtualEntityId;
        console.log('reset other menus', this.pdModels);
    }
}