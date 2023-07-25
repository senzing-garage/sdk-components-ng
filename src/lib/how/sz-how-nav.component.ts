import { Component, OnInit, Input, OnDestroy, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntityRecord, SzFeatureScore 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzResolutionStepDisplayType, SzResolvedVirtualEntity } from '../models/data-how';
import { parseBool } from '../common/utils';
import { filter, Subject, takeUntil } from 'rxjs';
import { isNotNull } from '../common/utils';
import { SzHowUIService } from '../services/sz-how-ui.service';

/**
 * @internal 
 * model for counting how many steps match a specific parameter */
export interface SzHowNavComponentParameterCounts {
    'CREATE': number,
    'ADD': number,
    'MERGE': number,
    'LOW_SCORE_NAME': number,
    'LOW_SCORE_ADDRESS': number,
    'LOW_SCORE_PHONE': number
}
/** 
 * @internal
 * model that extends a resolution step with display specific metadata used in the matches list */
export interface SzResolutionStepListItem extends SzResolutionStep {
    actionType: SzResolutionStepDisplayType,
    title: string,
    cssClasses?: string[],
    description: {text: string, cssClasses: string[]}[],
    recordIds?: string[],
    dataSources?: string[],
    freeTextTerms?: string[],
    fullTextTerms?: string[],
}
/**
 * @internal
 * Provides a collapsible list of steps from a "How" report that can 
 * be used for quickly navigating a how report and filtering based on user 
 * parameters.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-nav></sz-how-nav>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-how-nav></sz-wc-how-nav>
*/
@Component({
    selector: 'sz-how-nav',
    templateUrl: './sz-how-nav.component.html',
    styleUrls: ['./sz-how-nav.component.scss']
})
export class SzHowNavComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** 
     * @internal
     * object of steps to navigate keyed by virtualId
     */
    private _stepMap: {[key: string]: SzResolutionStep} = {};
    /** 
     * @internal
     * map of virtual entities keyed by virtualId
     */
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    /** 
     * @internal 
     * when the list of steps is prepared for render it is extended with 
     * metadata and cached in this variable*/
    private _listSteps: SzResolutionStepListItem[];
    /** @internal when the full list of virtual entities is passed in or changed this subject emits */
    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    /** when the full list of virtual entities is passed in or changed this subject emits */
    public  virtualEntitiesDataChange   = this._virtualEntitiesDataChange.asObservable();
    /** whether or not to add the collapsed css class to the component */
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isNavExpanded;
    }
    /** whether or not to add the expanded css class to the component */
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isNavExpanded;
    }
    /** when a feature's score falls below this value it is counted as "low scoring" */
    @Input() public lowScoringFeatureThreshold: number = 80;
    /** map of virtual entities keyed by virtualId */
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
        this._virtualEntitiesDataChange.next(this._virtualEntitiesById);
    }
    /** an object of steps whos key value is the virtual id of the step */
    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
        this._parameterCounts = this.getParameterCounts();
    }
    /** an object of steps whos key value is the virtual id of the step */
    get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    /** returns an array of steps regardless of step type  */
    get allSteps(): SzResolutionStep[] {
        let retVal = [];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            _steps[0].resolvedVirtualEntityId
            retVal = _steps;
        }
        return retVal;
    }
    /** gets the total number of steps */
    get numberOfTotalSteps(): number {
        let retVal = 0;
        if(this._stepMap && Object.keys(this._stepMap)) {
            retVal = Object.keys(this._stepMap).length;
        }
        return retVal;
    }
    /** gets the total number of steps where two virtual entitities where merged together */
    get numberOfMergeSteps(): number {
        let retVal = 0;
        if(this.mergeSteps) {
            retVal = this.mergeSteps.length;
        }
        return retVal;
    }
    /** gets the total number of steps where an individual record was added to an existing virtual entity */
    get numberOfAddRecordSteps(): number {
        let retVal = 0;
        if(this.addRecordSteps) {
            retVal = this.addRecordSteps.length;
        }
        return retVal;
    }
    /** gets the total number of steps where two records created a new virtual entity */
    get numberOfCreateVirtualEntitySteps(): number {
        let retVal = 0;
        if(this.createEntitySteps) {
            retVal = this.createEntitySteps.length;
        }
        return retVal;
    }
    /** returns a array of resolution steps that merge virtual entities together */
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
    /** returns a array of resolution steps that add a record to a previously created virtual entity */
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
    /** returns a array of resolution steps where both the inbound AND candidate entities are singletons */
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

    /** sets whether or not the "collapsed" css class is applied to component */
    toggleExpanded() {
        this.howUIService.isNavExpanded = !this.howUIService.isNavExpanded;
    }

    // ---------------------------------------- start parameters
    /** @internal */
    private _filterByTextOrRecordId: string             = undefined;
    /** @internal */
    private _filterByVirtualEntityCreation: boolean     = false;
    /** @internal */
    private _filterByMergeInterimEntitites: boolean     = false;
    /** @internal */
    private _filterByAddRecordtoVirtualEntity: boolean  = false;
    /** @internal */
    private _filterByLowScoringNames: boolean           = false;
    /** @internal */
    private _filterByLowScoringAddresses                = false;
    /** @internal */
    private _filterByLowScoringPhoneNumbers: boolean    = false;
        // ---------------------------------------- public getters
        /** get the text or record id being searched for */
        get filterByTextOrRecordId(): string | undefined   { return this._filterByTextOrRecordId; }
        /** whether or not to include steps that created a new virtual entity  */
        get filterByVirtualEntityCreation(): boolean       { return this._filterByVirtualEntityCreation; }
        /** whether or not to include steps that merged one or more virtual entities */
        get filterByMergeInterimEntitites(): boolean       { return this._filterByMergeInterimEntitites; }
        /** whether or not to include steps where a record was added to a virtual entity */
        get filterByAddRecordtoVirtualEntity(): boolean    { return this._filterByAddRecordtoVirtualEntity; }
        /** whether or not to include steps where names where not a close or same match */
        get filterByLowScoringNames(): boolean             { return this._filterByLowScoringNames; }
        /** whether or not to include steps where addresses were not a close or same match */
        get filterByLowScoringAddresses(): boolean         { return this._filterByLowScoringAddresses; }
        /** whether or not to include steps where phone numbers were not a close or same match */
        get filterByLowScoringPhoneNumbers(): boolean      { return this._filterByLowScoringPhoneNumbers; }

        // ---------------------------------------- public setters
        /** get the text or record id being searched for */
        @Input() set filterByTextOrRecordId(value: string | undefined) {
            this._filterByTextOrRecordId = value;
        }
        /** whether or not to include steps that created a new virtual entity  */
        @Input() set filterByVirtualEntityCreation(value: boolean | undefined) {
            this._filterByVirtualEntityCreation = parseBool(value);
        }
        /** whether or not to include steps that merged one or more virtual entities */
        @Input() set filterByMergeInterimEntitites(value: boolean | undefined) {
            this._filterByMergeInterimEntitites = parseBool(value);
        }
        /** whether or not to include steps where a record was added to a virtual entity */
        @Input() set filterByAddRecordtoVirtualEntity(value: boolean | undefined) {
            this._filterByAddRecordtoVirtualEntity = parseBool(value);
        }
        /** whether or not to include steps where names were not a close or same match */
        @Input() set filterByLowScoringNames(value: boolean | undefined) {
            this._filterByLowScoringNames = parseBool(value);
        }
        /** whether or not to include steps where addresses were not a close or same match */
        @Input() set filterByLowScoringAddresses(value: boolean | undefined) {
            this._filterByLowScoringAddresses = parseBool(value);
        }
        /** whether or not to include steps where phone numbers were not a close or same match */
        @Input() set filterByLowScoringPhoneNumbers(value: boolean | undefined) {
            this._filterByLowScoringPhoneNumbers = parseBool(value);
        }
    // ---------------------------------------- end parameters

    // ---------------------------------------- start filtered collection getters
    
    /** list for steps extended with presentation and filtering specific data */
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
    /** 
     * @internal
     * generates extended presentation and filtering specific data for steps and returns them as an array of extended items */
    private getListSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[];
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
                _t.freeTextTerms    = this.getStepListItemFreeTextTerms(_t);
                return _t;
            });
        }
        return retVal;
    }
    /** the list of steps filtered by user selected parameters */
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
                // for matching individual words like compound terms like "Jenny Smith"
                // or "Create V2000-4"
                // result must match ALL words in search
                let _hasMatchingTerms   = _critTerms.every(sTermTag => {
                    return step.freeTextTerms.some((termTag) => {
                        return termTag.toUpperCase().startsWith(sTermTag.toUpperCase());
                    })
                });
                // for matching things like multi-word address, full name etc
                let _hasMatchingTerm    = step.freeTextTerms.some((termTag) => {
                    return termTag.toUpperCase().indexOf(_critTerm.toUpperCase()) > -1; // changed to match full search term at any position in keyterms
                    //return termTag.toUpperCase().startsWith(_critTerm.toUpperCase()); // has to match search term from the beginning of keyterm
                })
                return _hasMatchingRecords || _hasMatchingTerms || _hasMatchingTerm ? true : false;
            });
        }

        //console.log('filteredListSteps: ', oVal, retVal);

        return retVal;
    }

    /**
     * @internal 
     * map of counts for specific filtering criteria to show user how many items will be 
     * selected when a filter is applied
     */
    private _parameterCounts: SzHowNavComponentParameterCounts = {
        'CREATE': 0,
        'ADD': 0,
        'MERGE': 0,
        'LOW_SCORE_NAME':0,
        'LOW_SCORE_ADDRESS':0,
        'LOW_SCORE_PHONE':0
    }
    /** map of counts for specific filtering criteria to show user how many items will be 
     * selected when a filter is applied
     */
    public get parameterCounts(): SzHowNavComponentParameterCounts {
        return this._parameterCounts;
    }
    /** gets the number of steps for a particular filter from the pre-generated parameterCounts map */
    public getParameterCount(name: string): number {
        let retVal = 0;
        if(this._parameterCounts && this._parameterCounts[ name ] !== undefined) {
            retVal = this._parameterCounts[ name ];
        }
        return retVal;
    }
    /** gets a map of how many step items match a particular filter parameter */
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

        console.log('SzHowNavComponent.getParameterCounts: ', retVal, this.listSteps);

        return retVal;
    }
    /**
     * @internal 
     * get a array of recordId's present in a particular step.
     */
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
    /**
     * @internal 
     * get a array of datasources present in a particular step.
     */
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
    /**
     * @internal 
     * get a array of text tokens in a particular step so a user can perform text searches for steps that 
     * contain particular terms.
     */
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
        //console.log(`getStepListItemFreeTextTerms()`, ret, step, this._virtualEntitiesById);
        return ret;
    }    
    /**
     * @internal
     * get the type of card that the step will be displayed as.
     */
    private getStepListCardType(step: SzResolutionStep): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(step);
    }
    /**
     * @internal
     * get the title of a step to display in matches list
     */
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
    /**
     * @internal
     * get the description for a step that is displayed in the matches list. 
     */
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
    /**
     * @internal
     * get the css classes to apply to steps in the matches list.
     */
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
        /** listen for virtual entities being lazily passed in */
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
    /**
     * when a step is clicked this method collapses all other currently expanded steps, and expands the 
     * step specified and all ancestors in it's tree.
     */
    public stepClicked(step: SzResolutionStep) {
        this.howUIService.selectStep(step.resolvedVirtualEntityId);
    }
}