import { Component, OnInit, Input, ViewChild, HostBinding, EventEmitter, Output } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { 
    SzEntityFeature, SzEntityIdentifier, SzResolvedEntity, 
    SzVirtualEntity, SzVirtualEntityRecord, EntityDataService as SzEntityDataService, SzRecordIdentifiers, SzRecordIdentifier, SzVirtualEntityResponse, SzFeatureMode, SzResolutionStep, SzFeatureScore } from '@senzing/rest-api-client-ng';
import { take, takeUntil, tap, map, BehaviorSubject, Subject } from 'rxjs';
import { SzHowCardBaseComponent } from './sz-how-entity-card-base.component';
import { SzSearchService } from '../../../services/sz-search.service';
import { friendlyFeaturesName } from '../../../models/data-features';
import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../../services/sz-how-ui-coordinator.service';
import { SzHowStepHightlightEvent, SzMatchFeatureScore, SzVirtualEntityRecordsClickEvent } from '../../../models/data-how';

interface SzVirtualEntityRecordsByDataSource {
    [key: string]: Array<SzVirtualEntityRecord> 
}

/**
 * Display the "Why" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity entityId="5"&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity entityId="5"&gt;&lt;/sz-wc-why-entity&gt;<br/>
*/
@Component({
    selector: 'sz-how-virtual-card',
    templateUrl: './sz-how-virtual-card.component.html',
    styleUrls: ['./sz-how-virtual-card.component.scss']
})
export class SzHowVirtualCardComponent extends SzHowCardBaseComponent implements OnInit {

    public stepsPanelOpenState = false;
    private _data: SzVirtualEntity;
    private _preceedingStep: SzResolutionStep;
    private _currentStep: SzResolutionStep;
    private _resolvedEntity: SzResolvedEntity;
    private _sources: SzVirtualEntityRecordsByDataSource;
    private _cardType: string       = 'Virtual Entity';
    private _cardId: string;
    private _isHidden: boolean      = false;
    private _hasHighlightedFeatures = false;
    private _highlighted: boolean   = false;
    private _highlightedFeatures: {[key: string]: SzFeatureScore[]} = undefined
    private _highlightedFeaturesByInternalId: {[key: number]: SzMatchFeatureScore} = undefined;
    private _highlightedConstructionFeatures: SzMatchFeatureScore[]   = undefined;
    public get isHidden() {
        return this._isHidden;
    }

    @HostBinding('class.sz-how-entity-card') cssCardClass: boolean = true;
    @HostBinding('class.sz-how-singleton-card') get cssSingletonClass(): boolean {
        return this.singleton ? true : false;
    }
    @HostBinding('class.hidden') get cssHiddenClass(): boolean {
        return this._isHidden ? true : false;
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.highlightedFeatures') get cssHasHighlightedFeatures(): boolean {
        return this._hasHighlightedFeatures ? true : false;
    }
    
    @ViewChild(MatAccordion) override featuresAccordion: MatAccordion;
    @ViewChild(MatAccordion) override stepsAccordion: MatAccordion;

    @Input() set preceedingStep(value: SzResolutionStep) {
        if(value) {
            this._preceedingStep = value;
        }
    }
    private _recordLimit: number = 5;
    @Input() set recordLimit(value: number | string){
        this._recordLimit = parseInt(value as string);
    }
    get recordLimit(): number {
        return this._recordLimit;
    }
    @Input() set data(value: SzVirtualEntity) {
        if(value) {
            let oldValue = this._data;
            this._data = value;
            if(this._data && this._data.virtualEntityId && oldValue !== value) {
                this.getVirtualEntity().pipe(
                    take(1),
                    takeUntil(this.unsubscribe$)
                )
                .subscribe((res: SzResolvedEntity) => {
                    this._resolvedEntity    = res;
                    this.orderedFeatures   = this.getOrderedFeatures(res);
                    //console.log('@senzing/sdk-components-ng/sz-how-virtual-card.setData(): ', this._data, res);
                });
            }
        }
    }
    
    @Input() set cardType(value: string) {
        this._cardType = value;
    }
    @Input() set cardId(value: string | SzEntityIdentifier) {
        this._cardId = (value as SzEntityIdentifier as string);
    }

    @Input() set currentStep(value: SzResolutionStep) {
        if(value) {
            this._currentStep = value;
        }
    }

    @Input() featureOrder: string[];

    private _highlightedConstructionFeaturesChange: BehaviorSubject<SzFeatureScore[]> = new BehaviorSubject(this._highlightedConstructionFeatures);
    public highlightedConstructionFeaturesChange                        = this._highlightedConstructionFeaturesChange.asObservable();
    @Output() public highlightedConstructionFeaturesChanged             = new EventEmitter<[SzFeatureScore[], string]>();
    private _moreLinkClick: Subject<SzVirtualEntityRecordsClickEvent>   = new Subject();
    public moreLinkClick                                                = this._moreLinkClick.asObservable();
    @Output() public moreLinkClicked                                    = new EventEmitter<SzVirtualEntityRecordsClickEvent>();

    get preceedingStep(): SzResolutionStep | undefined {
        return this._preceedingStep;
    }
    public get cardType(): string {
        return this._cardType;
    }
    public get cardId(): string {
        return this._cardId ? this._cardId : (this._data && this._data.virtualEntityId !== undefined ? this._data.virtualEntityId : '');
    }
    public get resolvedEntity() {
        return this._resolvedEntity;
    }
    get currentStep(): SzResolutionStep | undefined {
        return this._currentStep;
    }
    
    get data(): SzVirtualEntity | undefined {
        return this._data;
    }

    get stepNumber() {
        return this._preceedingStep && this._preceedingStep.stepNumber ?  this._preceedingStep.stepNumber : 0;
    }
    
    public get stepTitle(): string {
        let retVal = '';
        if(this._data.singleton) {
            // this card is a singleton record
            retVal = 'Singleton Entity';
        } else if(this.preceedingStep && this.preceedingStep.resolvedVirtualEntityId) {
            // this card is the result of a preceeding step operation
            let iEnt = this.preceedingStep.inboundVirtualEntity;
            let cEnt = this.preceedingStep.candidateVirtualEntity;
            let sCount = (iEnt.singleton? 1:0) + (cEnt.singleton? 1:0);
            if(sCount === 2){
                retVal = 'Records Merged to Virtual Entity';
            } else if(sCount === 1) {
                // one singleton, one vent
                retVal = 'Add Record to Virtual Entity';
            } else {
                // two vents
                retVal = 'Merged Virtual Entities';
            }
        }
        return retVal;
    }

    get singleton(): boolean {
        let retVal = true;
        if(this._data && this._data.singleton !== undefined) {
            retVal = this._data.singleton;
        }
        return retVal;
    }
    get virtualEntityId() : string | undefined {;
        if(this._data && this._data.virtualEntityId !== undefined) {
            return this._data.virtualEntityId;
        }
        return undefined;
    }
    get records() : SzVirtualEntityRecord[] | undefined {;
        if(this._data && this._data.records !== undefined) {
            return this._data.records;
        }
        return undefined;
    }
    get sources() {
        // check if we have a cached version of this first
        if(!this._sources) {
            let _recordsByDataSource: {
                [key: string]: Array<SzVirtualEntityRecord> 
            } = {};
            this._data.records.forEach((dsRec) => {
                if(!_recordsByDataSource[dsRec.dataSource]) {
                    _recordsByDataSource[dsRec.dataSource] = [];
                }
                _recordsByDataSource[dsRec.dataSource].push(dsRec);
    
            });
            this._sources = _recordsByDataSource;
        }
        return this._sources;
    }
    
    getVirtualEntity(){
        let rIds: SzRecordIdentifiers = [];
        if(this._data){
            if(this._data.records) {
                // convert "SzVirtualEntityRecord" to "SzRecordIdentifier"
                rIds = this._data.records.map((vRec: SzVirtualEntityRecord)=>{
                    return {
                        src: vRec.dataSource,
                        id: vRec.recordId
                    } as SzRecordIdentifier
                })
            }
        }

        return this.entityDataService.getVirtualEntityByRecordIds(
                rIds, 
                undefined,
                undefined, SzFeatureMode.ATTRIBUTED
            )
            .pipe(
            /*tap(res => console.log('@senzing/sdk-components-ng/sz-how-virtual-card.getVirtualEntityByRecordIds: ' + rIds, res)),*/
            map((res: SzVirtualEntityResponse) => { return res.data.resolvedEntity})
        )
    }

    //---------------------------------------------------------------------
    public get names(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['NAME']) {
            //console.log('entity names: ', this.resolvedEntity.features['NAME']);
            return this.resolvedEntity.features['NAME'];
        //} else {
            //console.warn('entity names: ', this.resolvedEntity);
        }
        return undefined;
    }

    public get addresses(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['ADDRESS']) {
            return this.resolvedEntity.features['ADDRESS'];
        }
        return undefined;
    }

    public get dob(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['DOB']) {
            return this.resolvedEntity.features['DOB'];
        }
        return undefined;
    }
    public get phoneNumbers(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['PHONE']) {
            return this.resolvedEntity.features['PHONE'];
        }
        return undefined;
    }
    public get emails(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['EMAIL']) {
            return this.resolvedEntity.features['EMAIL'];
        }
        return undefined;
    }
    public get ssnNumbers(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['SSN']) {
            return this.resolvedEntity.features['SSN'];
        }
        return undefined;
    }
    public get dlNumbers(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['DL']) {
            return this.resolvedEntity.features['DL'];
        }
        return undefined;
    }
    public get matchInfo() {
        //this._preceedingStep.matchInfo
        return this._preceedingStep && this._preceedingStep.matchInfo ? this._preceedingStep.matchInfo : undefined;
    }
    public get featureScores() {
        let retVal: {[key: string]: SzMatchFeatureScore[]} = undefined;
        if(this._preceedingStep && this._preceedingStep.matchInfo && this._preceedingStep.matchInfo.featureScores) {
            retVal = {};
            for(let fKey in this._preceedingStep.matchInfo.featureScores) {
                let _fValues    = this._preceedingStep.matchInfo.featureScores[fKey];
                retVal[fKey]    = _fValues.map((_fVal) => {
                    return Object.assign(_fVal, {resolutionRule: this._preceedingStep.matchInfo.resolutionRule, matchKey: this._preceedingStep.matchInfo.matchKey});
                })
            }
        }
        /*
        this._preceedingStep && this._preceedingStep.matchInfo && this._preceedingStep.matchInfo.featureScores ? this._preceedingStep.matchInfo.featureScores : undefined;
        if(retVal !== undefined && this._preceedingStep && this._preceedingStep.matchInfo) {
            retVal.resolutionRule = this._preceedingStep.matchInfo.resolutionRule;
            retVal.matchKey       = this._preceedingStep.matchInfo.matchKey;
        }
        return this._preceedingStep && this._preceedingStep.matchInfo && this._preceedingStep.matchInfo.featureScores ? this._preceedingStep.matchInfo.featureScores : undefined;*/
        return retVal;
    }

    private _highlightedConstructionFeatureKey: string;
    public set highlightedConstructionFeatureKey(value: string) {
        // assign to local variable
        this._highlightedConstructionFeatureKey = value;
        //console.log(`highlightedFeatureKey('${value}'|'${this._highlightedConstructionFeatureKey}')`, this.featureScores);
        // get the feature bucket for this key
        if(this.featureScores && this.featureScores[value]) {
            this._highlightedConstructionFeaturesChange.next(this.featureScores[value]);
        }
    }
    public get highlightedConstructionFeatureKey(): string {
        return this._highlightedConstructionFeatureKey;
    }

    public onFeatureScoreBucketClick(event, featureBucketKey, el) {
        event.preventDefault();
        if (this.highlightedConstructionFeatureKey && this.highlightedConstructionFeatureKey === el.value) {
            el.checked = false;
            this.highlightedConstructionFeatureKey = null;
        } else {
            this.highlightedConstructionFeatureKey = el.value;
            el.checked = true;
        }
    }

    public get matchKey(): string {
        let retVal = [];
        if(this.matchInfo) {
            retVal = this.matchInfo.matchKey.split('+').filter((value) => value && value.trim && value.trim().length > 0);
        }
        return retVal.join(' + ');
    }
    public get matchCodes(): string {
        let retVal = '';
        if(this.featureScores && Object.keys(this.featureScores).length > 0) {
            let featureScoreCodes   = [];
            let fScores             = this.featureScores;
            //console.log('matchCodes: ', fScores);
            for(let _fTypeKey in fScores){
                let _fMatchArr           = fScores[_fTypeKey];
                let _fMatchBehaviorCodes = _fMatchArr.map((_fMatchVal)=> _fMatchVal.scoringBehavior.code);
                //console.log(`\t${_fTypeKey}:`, _fMatchArr, _fMatchBehaviorCodes)

                featureScoreCodes = featureScoreCodes.concat(_fMatchBehaviorCodes);
            }
            retVal = featureScoreCodes.join('+');
        }
        return retVal;
    }
    private keysWithTopLevelAccessors = ['NAME','ADDRESS','DOB','PHONE','EMAIL','SSN','DL'];
    public get otherFeatures(): {[key: string] : SzEntityFeature[]} | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features) {
            let keysWithoutCommonKeys   = Object.keys(this.resolvedEntity.features).filter((fName) => { return this.keysWithTopLevelAccessors.indexOf(fName) < 0; });
            let featuresWithoutMajorKeys = {};
            for(let _key in this.resolvedEntity.features) {
                if(keysWithoutCommonKeys.indexOf(_key) >= 0) { featuresWithoutMajorKeys[_key] = this.resolvedEntity.features[_key];}
            }
            //console.log('other features: ', featuresWithoutMajorKeys, keysWithoutCommonKeys);
            return featuresWithoutMajorKeys;
        }
        return undefined;
    }
    public orderedFeatures: {name: string, features: SzEntityFeature[]}[] | undefined;

    public getOrderedFeatures(entity: SzResolvedEntity): {name: string, features: SzEntityFeature[]}[] | undefined {
        if(entity && entity.features) {
            let orderedFeatures          = [];
            for(let _key in entity.features) {
                orderedFeatures.push({
                    name: _key,
                    features: entity.features[_key]
                });
            }            
            // first sort alphabetically
            orderedFeatures.sort((a: {name: string, features: SzEntityFeature[]}, b: {name: string, features: SzEntityFeature[]}) => {
                var textA = a.name.toUpperCase();
                var textB = b.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
            // order by order of "features from config" if we got it
            if(this.featureOrder && this.featureOrder.length > 0) {
                //console.log('reordering virtual card features by config order: ', this.featureOrder);
                orderedFeatures.sort((a: {name: string, features: SzEntityFeature[]}, b: {name: string, features: SzEntityFeature[]}) => {
                    return this.featureOrder.indexOf(a.name) - this.featureOrder.indexOf(b.name);
                })
                return orderedFeatures;
            }
            console.log('ordered features: ', orderedFeatures);
            return orderedFeatures;
        }

        return undefined;
    }

    public featureName(featureKey) {
        // by default show pure value
        let retValue = featureKey;
        // if we have specific overrides use those
        if(featureKey && friendlyFeaturesName.has(featureKey)) {
            retValue = friendlyFeaturesName.get(featureKey);
        // otherwise if not a "KEY" value just make it friendly
        } else if(featureKey && featureKey.indexOf('_') < 0) {
            // no '_' so just capital case string
            let _words = featureKey.split(' ');
            let _capitalized = _words.map((_w) => {
                return _w[0].toUpperCase() + _w.substr(1).toLowerCase();
            }).join(' ').trim();
            retValue = _capitalized;
        }
        //console.log(`featureName(${featureKey}): ${retValue}`, friendlyFeaturesName.get(featureKey));
        return retValue;
    }

    public featureCount(featureCollection: SzVirtualEntityRecordsByDataSource | SzEntityFeature[] | SzVirtualEntityRecord[] ) {
        if(featureCollection) {
            if(Object.keys(featureCollection)) {
                return Object.keys(featureCollection).length;
            } else if(featureCollection.length) {
                return length;
            }
        }
        return 0;
    }

    constructor(
        private searchService: SzSearchService,
        private entityDataService: SzEntityDataService,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){
        super();
    }
    ngOnInit() {
        this.uiCoordinatorService.stepExpansionChange.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onStepExpansionChanged.bind(this))
        this.uiCoordinatorService.onStepJump.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onStepJumpTo.bind(this));
        this.uiCoordinatorService.onStepFeaturesHighlightChange.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onStepFeaturesHighlightChange.bind(this));
        
        this.highlightedConstructionFeaturesChange.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((feats: SzFeatureScore[])=>{
            //console.log(`highlightedConstructionFeaturesChange.subscribe()`, feats);
            // first run our local handler
            this.onHighlightedConstructionFeaturesChange(feats);
            // now emit to any subscribers
            this.highlightedConstructionFeaturesChanged.emit([feats, this._preceedingStep && this._preceedingStep.resolvedVirtualEntityId ? this._preceedingStep.resolvedVirtualEntityId : undefined]);
        });
        this.moreLinkClick.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((event: SzVirtualEntityRecordsClickEvent)=>{
            this.moreLinkClicked.emit(event);
        });
    }

    private onHighlightedConstructionFeaturesChange(features: SzFeatureScore[]) {
        //console.log(`onHighlightedConstructionFeaturesChange: `, features);
        this._highlightedConstructionFeatures = features;
    }

    private onStepExpansionChanged(expansionEvent: SzHowStepUIStateChangeEvent) {
        if(!(this.data && this.data.virtualEntityId)) {
            console.warn('data for card not initialized properly');
            return;
        }
        if(expansionEvent && this.data && expansionEvent.visibleVirtualIds && expansionEvent.visibleVirtualIds.indexOf(this.data.virtualEntityId) > -1) {
            this._isHidden = false;
        } else if(expansionEvent && this.data && expansionEvent.hiddenVirtualIds && expansionEvent.hiddenVirtualIds.indexOf(this.data.virtualEntityId) > -1) {
            this._isHidden = true;
        }
        // check if any of the immediately preceeding step is hidden
        // if so, change the branchExpanded to false;
        if(this._preceedingStep) {
            let allCardsForPreviousStepGHidden = false;
            if(expansionEvent && this._preceedingStep && expansionEvent.hiddenVirtualIds && (expansionEvent.hiddenVirtualIds.indexOf(this._preceedingStep.candidateVirtualEntity.virtualEntityId) > -1 && expansionEvent.hiddenVirtualIds.indexOf(this._preceedingStep.inboundVirtualEntity.virtualEntityId) > -1)) {
                allCardsForPreviousStepGHidden = true;
                //console.log(`preceeding step is hidden ${this._preceedingStep.resolvedVirtualEntityId}`);
            }
            this.branchExpanded = !allCardsForPreviousStepGHidden;
        }

        //console.log(`onStepExpansionChanged: ${this.data.virtualEntityId}: ${this.branchExpanded}`, expansionEvent);
    }

    private onStepFeaturesHighlightChange(value: SzHowStepHightlightEvent) {
        //console.log(`onStepFeaturesHighlightChange IS this(${this._data.virtualEntityId}) === '${Object.keys(value)}' ? `, value);
        
        if(value && this._data && this._data.virtualEntityId && value && value.features && value.features[this._data.virtualEntityId]) {
            // this card is a member of highlighted cards
            this._hasHighlightedFeatures    = true;
            this._highlightedFeatures       = value.features;
            this._highlightedFeaturesByInternalId   = {};
            for(let k in value.features) {
                let _featArr = value.features[k];
                _featArr.forEach((featScore: SzFeatureScore) => {
                    this._highlightedFeaturesByInternalId[ featScore.inboundFeature.featureId ] = featScore;
                    this._highlightedFeaturesByInternalId[ featScore.inboundFeature.featureId ].resolutionRule  = value.resolutionRule;
                    this._highlightedFeaturesByInternalId[ featScore.inboundFeature.featureId ].matchKey        = value.matchKey;
                });
            }
            console.log(`onStepFeaturesHighlightChange IS this(${this._data.virtualEntityId}) === '${Object.keys(value.features)}' ? `, value, this._highlightedFeaturesByInternalId);
        } else {
            this._hasHighlightedFeatures            = false;
            this._highlightedFeatures               = undefined;
            this._highlightedFeaturesByInternalId   = undefined
        }
        // deselect any previously highlighted construction steps
        if(this._data.virtualEntityId !== value.sourceStepId) {
            // hide any child steps
            this._highlightedConstructionFeatureKey = undefined;
            this._highlightedConstructionFeatures   = undefined;
        }
    }

    public isFeatureValueInHighlightedItems(feature: SzEntityFeature) {
        if(feature) {
            // check "_highlightedFeatures" for 
            let _internalId = feature.primaryId
            if(this._highlightedFeaturesByInternalId && this._highlightedFeaturesByInternalId[_internalId]) {
                return true;
            }
        }
        if(this._hasHighlightedFeatures) {
            //return true;
        }
        return false;
    }
    public getHighlightedColorClassesForFeatureValue(feature: SzEntityFeature){
        let retVal = undefined;
        if(feature) {
            // check "_highlightedFeatures" for 
            let _internalId = feature.primaryId
            if(this._highlightedFeaturesByInternalId && this._highlightedFeaturesByInternalId[_internalId]) {
                return this.getHighlightCSSClassForSzMatchFeatureScore(this._highlightedFeaturesByInternalId[_internalId]);
            }
        }
        return retVal;
    }

    private getHighlightCSSClassForSzMatchFeatureScore(feat: SzMatchFeatureScore) {
        let retVal = undefined;
        if(feat) {
            let rValHighlightClass = 'hl-3-color';
            if(
                (feat.featureType && feat.matchKey.indexOf(`+${feat.featureType}`) >= 0) || 
                (feat.scoringBucket === 'SAME' || feat.scoringBucket === 'CLOSE')
            ){
                rValHighlightClass = 'hl-1-color';
            } else if(
                feat.featureType && feat.matchKey.indexOf(`-${feat.featureType}`) >= 0
            ) {
                rValHighlightClass  = 'hl-2-color';
            }
            return rValHighlightClass;
        }
        return retVal;
    }

    public isFeatureScoreBucketHighlighted(features: SzMatchFeatureScore[]) {
        //console.log(`isFeatureScoreBucketHighlighted: `,features);
        let retVal = false;
        if(this._highlightedConstructionFeatures) {
            let isFeatureInHighlightedItems = false;
            features.forEach((feat: SzFeatureScore) => {
                if(this._highlightedConstructionFeatures.includes(feat)) {
                    isFeatureInHighlightedItems = true;
                }
            });
            retVal = isFeatureInHighlightedItems;
        }
        return retVal;
    }
    public getHighlightedColorClasses(features: SzMatchFeatureScore[]) {
        let retVal = undefined;
        if(features) {
            retVal = features.map(this.getHighlightCSSClassForSzMatchFeatureScore.bind(this));
        }
        return retVal;
    }

    private onStepJumpTo(step: SzHowResolutionUIStep) {
        if(!step) return
        this._highlighted = (step && step.data && step.data.resolvedVirtualEntityId === this.virtualEntityId);
    }

    public onMoreLinkClick(dsKey: string, evt: MouseEvent) {
        let payload: SzVirtualEntityRecordsClickEvent = Object.assign(evt, {
            records: this.sources[dsKey],
            dataSourceName: dsKey
        });
        console.log('SzHowVirtualCardComponent.onMoreLinkClck: ', payload, evt);
        this._moreLinkClick.next(payload);
        //Array<SzVirtualEntityRecord>
    }

    toggleSteps() {
        if(this.branchExpanded) {
            this.collapseSteps();
        } else {
            this.expandSteps();
        }
    }

    expandSteps() {
        this.uiCoordinatorService.expandSteps(this.virtualEntityId);
        this.branchExpanded = true;
    }
    collapseSteps() {
        this.uiCoordinatorService.collapseSteps(this.virtualEntityId)
        this.branchExpanded = false;
    }
}