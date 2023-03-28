import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzConfigResponse, SzEntityIdentifier, SzVirtualEntityRecord, SzFeatureScore 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepDisplayType, SzResolutionStepListItem, SzResolvedVirtualEntity } from '../../models/data-how';
import { parseBool } from '../../common/utils';
import { filter, Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier, isNotNull } from '../../common/utils';
import { SzHowUIService } from '../../services/sz-how-ui.service';

import { MatSelect } from '@angular/material/select';

export interface SzHowRCNavComponentParameterCounts {
    'CREATE': number,
    'ADD': number,
    'MERGE': number,
    'LOW_SCORE_NAME': number,
    'LOW_SCORE_ADDRESS': number,
    'LOW_SCORE_PHONE': number
}

@Component({
    selector: 'sz-how-rc-nav',
    templateUrl: './sz-how-rc-nav.component.html',
    styleUrls: ['./sz-how-rc-nav.component.scss']
})
export class SzHowRCNavComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep} = {};
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isNavExpanded;
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isNavExpanded;
    }

    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    public  virtualEntitiesDataChange   = this._virtualEntitiesDataChange.asObservable();
    private _listSteps: SzResolutionStepListItem[];
    private _finalVirtualEntities: SzVirtualEntity[];
    public pdModels = [
        '',
        '',
        '',
        '',
    ];

    @Input() public finalEntityId: SzEntityIdentifier;
    @Input() public lowScoringFeatureThreshold: number = 80;
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
        this._virtualEntitiesDataChange.next(this._virtualEntitiesById);
    }

    @Input() set finalVirtualEntities(value: SzVirtualEntity[]) {
        this._finalVirtualEntities = value;
    }
    public get finalVirtualEntities(): SzVirtualEntity[] {
        return this._finalVirtualEntities;
    }

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
        this._stepMap = value;
        this._parameterCounts = this.getParameterCounts();
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

    toggleExpanded() {
        this.howUIService.isNavExpanded = !this.howUIService.isNavExpanded;
    }

    // ---------------------------------------- start parameters
    private _filterByTextOrRecordId: string             = undefined;
    private _filterByVirtualEntityCreation: boolean     = false;
    private _filterByMergeInterimEntitites: boolean     = false;
    private _filterByAddRecordtoVirtualEntity: boolean  = false;
    private _filterByLowScoringNames: boolean           = false;
    private _filterByLowScoringAddresses                = false;
    private _filterByLowScoringPhoneNumbers: boolean    = false;
        // ---------------------------------------- public getters
        get filterByTextOrRecordId(): string | undefined   { return this._filterByTextOrRecordId; }
        get filterByVirtualEntityCreation(): boolean       { return this._filterByVirtualEntityCreation; }
        get filterByMergeInterimEntitites(): boolean       { return this._filterByMergeInterimEntitites; }
        get filterByAddRecordtoVirtualEntity(): boolean    { return this._filterByAddRecordtoVirtualEntity; }
        get filterByLowScoringNames(): boolean             { return this._filterByLowScoringNames; }
        get filterByLowScoringAddresses(): boolean         { return this._filterByLowScoringAddresses; }
        get filterByLowScoringPhoneNumbers(): boolean      { return this._filterByLowScoringPhoneNumbers; }

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
        @Input() set filterByLowScoringPhoneNumbers(value: boolean | undefined) {
            this._filterByLowScoringPhoneNumbers = parseBool(value);
        }
    // ---------------------------------------- end parameters

    // ---------------------------------------- start filtered collection getters
    
    public get listSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[] = [];
        if(!this._listSteps) {
            this._listSteps = this.getListSteps();
        }
        if(this._listSteps){
            retVal = this._listSteps;
        }
        return retVal;
    }

    private getListSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[] = [];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            retVal = _steps.map((_s: SzResolutionStep) => {
                let _t: SzResolutionStepListItem = Object.assign({
                    actionType: this.getStepListCardType(_s),
                    cssClasses: this.getStepListItemCssClasses(_s), 
                    title: this.getStepListItemTitle(_s),
                    description: this.getStepListItemDescription(_s),
                    recordIds: this.getStepListItemRecords(_s),
                    dataSources: this.getStepListItemDataSources(_s)
                }, _s);
                _t.freeTextTerms = this.getStepListItemFreeTextTerms(_t)
                return _t;
            });
        }
        return retVal;
    }

    public get filteredListSteps(): SzResolutionStepListItem[] {
        let oVal    = this.listSteps;
        let retVal  = oVal.filter((step: SzResolutionStepListItem) => {
            let _hasParamsChecked   = false;
            let _inc                = false;

            if(this._filterByVirtualEntityCreation) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.CREATE;
            }
            if(this._filterByAddRecordtoVirtualEntity) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.ADD;
            }
            if(this._filterByMergeInterimEntitites) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.MERGE;
            }
            // now check for low-scoring features
            if(this._filterByLowScoringNames || this.filterByLowScoringAddresses || this.filterByLowScoringPhoneNumbers) {
                _hasParamsChecked = true;
                let hasLowScoringFeature = false;
                if(this._filterByLowScoringNames && step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['NAME']){
                    // has name features
                    let nameScores = step.matchInfo.featureScores['NAME'];
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = nameScores.some((featScore: SzFeatureScore) => {
                            return !(featScore.score > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING NAME!!', step);
                        }
                    }
                }
                if(this.filterByLowScoringAddresses && step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['ADDRESS']){
                    // has name features
                    let nameScores = step.matchInfo.featureScores['ADDRESS'];
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = nameScores.some((featScore: SzFeatureScore) => {
                            return !(featScore.score > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING ADDRESS!!', step);
                        }
                    }
                }
                if(this.filterByLowScoringPhoneNumbers && step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['PHONE']) {
                    // has phone features
                    let phoneScores = step.matchInfo.featureScores['PHONE'];
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = phoneScores.some((featScore: SzFeatureScore) => {
                            return !(featScore.score > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING PHONE!!', step);
                        }
                    }
                }
                if(hasLowScoringFeature) {
                    _inc = true;
                }
            }

            // if no parameters are selected just return everything
            return _hasParamsChecked ? _inc : true;
        });

        // we do the free text search OUTSIDE of main criteria check loop so that 
        // the checkbox parameters are an "OR" operation by themselves, but become 
        // a "AND" operation in conjunction with free text search
        if(this._filterByTextOrRecordId && isNotNull(this._filterByTextOrRecordId)){
            // check if text is in record Id's
            let _critStr            = this._filterByTextOrRecordId.toUpperCase().trim();
            
            let _critTerms          = _critStr.split(' ');
            let _critTerm           = _critStr;

            retVal  = retVal.filter((step: SzResolutionStepListItem) => {
                // record id's specifically
                let _hasMatchingRecords = step.recordIds.some((recordId: string) => {
                    return recordId.toUpperCase().trim().startsWith(_critStr);
                });
                // for matching individual words like compound ters like "Jenny Smith"
                // or "Create V2000-4"
                // result must match ALL words in search
                let _hasMatchingTerms   = _critTerms.every(sTermTag => {
                    return step.freeTextTerms.some((termTag) => {
                        return termTag.toUpperCase().startsWith(sTermTag.toUpperCase());
                    })
                });
                // for matching things like multi-word address, full name etc
                let _hasMatchingTerm    = step.freeTextTerms.some((termTag) => {
                    return termTag.toUpperCase().startsWith(_critTerm.toUpperCase());
                })             
                return _hasMatchingRecords || _hasMatchingTerms || _hasMatchingTerm ? true : false;
            });
        }

        //console.log('filteredListSteps: ', oVal, retVal);

        return retVal;
    }


    private _parameterCounts: SzHowRCNavComponentParameterCounts = {
        'CREATE': 0,
        'ADD': 0,
        'MERGE': 0,
        'LOW_SCORE_NAME':0,
        'LOW_SCORE_ADDRESS':0,
        'LOW_SCORE_PHONE':0
    }
    public get parameterCounts(): SzHowRCNavComponentParameterCounts {
        return this._parameterCounts;
    }

    public getParameterCount(name: string): number {
        let retVal = 0;
        if(this._parameterCounts && this._parameterCounts[ name ] !== undefined) {
            retVal = this._parameterCounts[ name ];
        }
        return retVal;
    }

    private getParameterCounts() {
        let retVal = {
            'CREATE': 0,
            'ADD': 0,
            'MERGE': 0,
            'LOW_SCORE_NAME':0,
            'LOW_SCORE_ADDRESS':0,
            'LOW_SCORE_PHONE':0
        }
        this.listSteps.forEach((step: SzResolutionStepListItem) => {
            if(step.actionType == SzResolutionStepDisplayType.CREATE) {
                retVal.CREATE = retVal.CREATE+1;
            }
            if(step.actionType == SzResolutionStepDisplayType.ADD) {
                retVal.ADD = retVal.ADD+1;
            }
            if(step.actionType == SzResolutionStepDisplayType.MERGE) {
                retVal.MERGE = retVal.MERGE+1;
            }
            if(step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['NAME'] && step.matchInfo.featureScores['NAME'].some){
                // check for low scoring name
                let hasLowScoringFeature = step.matchInfo.featureScores['NAME'].some((featScore: SzFeatureScore) => {
                    return !(featScore.score > this.lowScoringFeatureThreshold);
                });
                if(hasLowScoringFeature) {
                    retVal.LOW_SCORE_NAME = retVal.LOW_SCORE_NAME+1;
                }
            }
            if(step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['ADDRESS'] && step.matchInfo.featureScores['ADDRESS'].some){
                // check for low scoring name
                let hasLowScoringFeature = step.matchInfo.featureScores['ADDRESS'].some((featScore: SzFeatureScore) => {
                    return !(featScore.score > this.lowScoringFeatureThreshold);
                });
                if(hasLowScoringFeature) {
                    retVal.LOW_SCORE_ADDRESS = retVal.LOW_SCORE_ADDRESS+1;
                }
            }
            if(step.matchInfo && step.matchInfo.featureScores && step.matchInfo.featureScores['PHONE'] && step.matchInfo.featureScores['PHONE'].some){
                // check for low scoring name
                let hasLowScoringFeature = step.matchInfo.featureScores['PHONE'].some((featScore: SzFeatureScore) => {
                    return !(featScore.score > this.lowScoringFeatureThreshold);
                });
                if(hasLowScoringFeature) {
                    retVal.LOW_SCORE_PHONE = retVal.LOW_SCORE_PHONE+1;
                }
            }
        });

        console.log('SzHowRCNavComponent.getParameterCounts: ', retVal, this.listSteps);

        return retVal;
    }

    private getStepListItemRecords(step: SzResolutionStep): string[] {
        let retVal = [];
        if(step && step.candidateVirtualEntity && step.candidateVirtualEntity.records && step.candidateVirtualEntity.singleton) {
            retVal = retVal.concat(step.candidateVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.recordId;
            }));
        }
        if(step && step.inboundVirtualEntity && step.inboundVirtualEntity.records && step.inboundVirtualEntity.singleton) {
            retVal = retVal.concat(step.inboundVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.recordId;
            }));
        }
        return retVal;
    }

    private getStepListItemDataSources(step: SzResolutionStep): string[] {
        let retVal = [];
        if(step && step.candidateVirtualEntity && step.candidateVirtualEntity.records) {
            retVal = retVal.concat(step.candidateVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.dataSource;
            }));
        }
        if(step && step.inboundVirtualEntity && step.inboundVirtualEntity.records) {
            retVal = retVal.concat(step.inboundVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.dataSource;
            }));
        }
        return retVal;
    }

    private getStepListItemFreeTextTerms(step: SzResolutionStepListItem): string[] {
        let retVal = [];
        if(step.title) {
            retVal = retVal.concat(step.title.split(' '));
        }
        if(step.description && step.description.length > 0) {
            /*
            let _desc = [{text: 'Virtual Entity V509570-S1', cssClasses: []},
            {text: 'Virtual Entity V401992-S2', cssClasses: Array(1)},
            {text: 'Virtual Entity V401992-S3', cssClasses: Array(1)}]
            .forEach((desc: {text: string, cssClasses: string[]}) => {
                retVal = retVal.concat(desc.text.split(' '));
            });*/
            step.description.forEach((desc: {text: string, cssClasses: string[]}) => {
                retVal = retVal.concat(desc.text.split(' '));
            });
            retVal = retVal.concat(step.title.split(' '));
        }
        if(step.resolvedVirtualEntityId && this._virtualEntitiesById && this._virtualEntitiesById.has && this._virtualEntitiesById.has(step.resolvedVirtualEntityId)) {
            // add important data from result entity in to search
            let termsToAdd = [];
            let itemToScan  = this._virtualEntitiesById.get(step.resolvedVirtualEntityId);
            if(itemToScan.bestName) { 
                termsToAdd.push(itemToScan.bestName); 
            } else if(itemToScan.entityName) {
                termsToAdd.push(itemToScan.entityName); 
            }
            if(itemToScan.features && Object.keys(itemToScan.features).length > 0) {
                // has features, add them
                for(var _k in itemToScan.features) {
                    // each one of these items is an array
                    termsToAdd = termsToAdd.concat(itemToScan.features[_k].map((_f)=>{
                        return _f.primaryValue ? _f.primaryValue : undefined;
                    })).filter((_fVal) => { return _fVal && _fVal !== undefined; });
                }
            }
            retVal = retVal.concat(termsToAdd);
        }
        let ret = [...new Set(retVal)];
        console.log(`getStepListItemFreeTextTerms()`, ret, step, this._virtualEntitiesById);
        return ret;
    }    

    private getStepListCardType(step: SzResolutionStep): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(step);
    }

    private getStepListItemTitle(step: SzResolutionStep): string {
        let retVal = '';
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            retVal = 'Create Virtual Entity';
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
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
        let listItemVerb    = this.getStepListCardType(step);
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
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {
        this.pdModels = ['','','',''];
        this._virtualEntitiesDataChange.pipe(
            takeUntil(this.unsubscribe$),
            filter((val) => { return val !== undefined; })
        ).subscribe((val) => {
            console.warn(`virtual entities changed: `, val);
            // this will change list data for search
            // re-initialize
            this._listSteps = this.getListSteps();
            console.warn(`re-initialized search data: `, this._listSteps);
        })
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

    public stepClicked(step: SzResolutionStep) {
        this.howUIService.selectStep(step.resolvedVirtualEntityId);
    }
}