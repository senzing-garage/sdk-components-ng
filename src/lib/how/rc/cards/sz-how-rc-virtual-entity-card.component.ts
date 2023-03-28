import { Component, OnInit, Input, ViewChild, HostBinding, EventEmitter, Output } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { 
    SzEntityFeature, SzEntityIdentifier, SzResolvedEntity, 
    SzVirtualEntity, SzVirtualEntityRecord, EntityDataService as SzEntityDataService, SzRecordIdentifiers, SzRecordIdentifier, SzVirtualEntityResponse, SzFeatureMode, SzResolutionStep, SzFeatureScore } from '@senzing/rest-api-client-ng';
import { take, takeUntil, tap, map, BehaviorSubject, Subject } from 'rxjs';
import { SzSearchService } from '../../../services/sz-search.service';
import { friendlyFeaturesName } from '../../../models/data-features';
//import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../../services/sz-how-ui-coordinator.service';
import { 
    SzResolutionStepDisplayType, 
    SzResolvedVirtualEntity, 
    SzVirtualEntityRecordsClickEvent ,
    SzVirtualEntityRecordsByDataSource
} from '../../../models/data-how';
import { SzHowUIService } from '../../../services/sz-how-ui.service';

/**
 * Display the "Virtual Entity" information for how resolution step
*/
@Component({
    selector: 'sz-how-rc-virtual-entity-card',
    templateUrl: './sz-how-rc-virtual-entity-card.component.html',
    styleUrls: ['./sz-how-rc-virtual-entity-card.component.scss']
})
export class SzHowRCVirtualEntityCardComponent implements OnInit {

    public stepsPanelOpenState = false;
    private _data: SzResolvedVirtualEntity;
    private _stepData: SzResolutionStep;
    private _sources: SzVirtualEntityRecordsByDataSource;
    public _orderedFeatures: {name: string, features: SzEntityFeature[]}[] | undefined;
    private _drawerStates: Map<string, boolean>  = new Map([['SOURCES',false]]);

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
    @HostBinding('class.sz-how-entity-card') cssCardClass: boolean = true;
    
    @ViewChild(MatAccordion) featuresAccordion: MatAccordion;
    @ViewChild(MatAccordion) stepsAccordion: MatAccordion;

    private _recordLimit: number = 5;
    @Input() featureOrder: string[];

    @Input() set step(value: SzResolutionStep) {
        this._stepData = value;
    }
    @Input() set data(value: SzResolvedVirtualEntity) {
        this._data = value;
    }
    @Input() set virtualEntity(value: SzResolvedVirtualEntity) {
        this._data = value;
    }
    @Input() set recordLimit(value: number | string){
        this._recordLimit = parseInt(value as string);
    }
    get id(): SzEntityIdentifier {
        return this._data.virtualEntityId;
    }
    get recordLimit(): number {
        return this._recordLimit;
    }
    get data(): SzResolvedVirtualEntity | undefined {
        return this._data;
    }
    get orderedFeatures(): {name: string, features: SzEntityFeature[]}[] | undefined {
        let retVal = this._orderedFeatures;
        if(!retVal && this._data) {
            retVal = this.getOrderedFeatures(this._data);
            if(retVal) {
                // cache value;
                this._orderedFeatures = retVal;
                this._orderedFeatures.forEach((feat) => {
                    this._drawerStates.set(feat.name, true);
                });
            }
        }
        return retVal;
    }
    get virtualEntity(): SzResolvedVirtualEntity {
        return this._data;
    }
    
    public get title(): string {
        let retVal = 'Virtual Entity';
        if(this._data) {
            retVal = `Virtual Entity ${this.id}`;
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
        if(!this._sources && this._data && this._data.records) {
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

    get displayType(): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(this._stepData);
    }

    private _moreLinkClick: Subject<SzVirtualEntityRecordsClickEvent>   = new Subject();
    public moreLinkClick                                                = this._moreLinkClick.asObservable();
    @Output() public moreLinkClicked                                    = new EventEmitter<SzVirtualEntityRecordsClickEvent>();

    //---------------------------------------------------------------------
    public get names(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['NAME']) {
            //console.log('entity names: ', this.virtualEntity.features['NAME']);
            return this.virtualEntity.features['NAME'];
        //} else {
            //console.warn('entity names: ', this.virtualEntity);
        }
        return undefined;
    }

    public get addresses(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['ADDRESS']) {
            return this.virtualEntity.features['ADDRESS'];
        }
        return undefined;
    }

    public get dob(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['DOB']) {
            return this.virtualEntity.features['DOB'];
        }
        return undefined;
    }
    public get phoneNumbers(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['PHONE']) {
            return this.virtualEntity.features['PHONE'];
        }
        return undefined;
    }
    public get emails(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['EMAIL']) {
            return this.virtualEntity.features['EMAIL'];
        }
        return undefined;
    }
    public get ssnNumbers(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['SSN']) {
            return this.virtualEntity.features['SSN'];
        }
        return undefined;
    }
    public get dlNumbers(): SzEntityFeature[] | undefined {
        if(this.virtualEntity && this.virtualEntity.features && this.virtualEntity.features['DL']) {
            return this.virtualEntity.features['DL'];
        }
        return undefined;
    }
    public get matchInfo() {
        return this.step && this.step.matchInfo ? this.step.matchInfo : undefined;
    }
    public get featureScores() {
        return this.step && this.step.matchInfo && this.step.matchInfo.featureScores ? this.step.matchInfo.featureScores : undefined;
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
        if(this.virtualEntity && this.virtualEntity.features) {
            let keysWithoutCommonKeys   = Object.keys(this.virtualEntity.features).filter((fName) => { return this.keysWithTopLevelAccessors.indexOf(fName) < 0; });
            let featuresWithoutMajorKeys = {};
            for(let _key in this.virtualEntity.features) {
                if(keysWithoutCommonKeys.indexOf(_key) >= 0) { featuresWithoutMajorKeys[_key] = this.virtualEntity.features[_key];}
            }
            //console.log('other features: ', featuresWithoutMajorKeys, keysWithoutCommonKeys);
            return featuresWithoutMajorKeys;
        }
        return undefined;
    }
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

    public toggleExpansion(drawerId: string) {
        let currentVal = this.isExpanded(drawerId);
        this._drawerStates.set(drawerId, !currentVal);
    }
    public isExpanded(drawerId: string): boolean {
        let retVal = true;
        if(this._drawerStates.has(drawerId)) {
            retVal = this._drawerStates.get(drawerId);
        }
        return retVal;
    }
    public onDrawerOpen(drawerId: string) {
        this._drawerStates.set(drawerId, true);
    }
    public onDrawerClose(drawerId: string) {
        this._drawerStates.set(drawerId, false);
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

    public getOrderedFeaturesDebug() {
        let _of = this.getOrderedFeatures(this._data);
        console.log(`SzHowRCVirtualEntityCardComponent.getOrderedFeaturesDebug() `, _of);
    }

    constructor(
        private searchService: SzSearchService,
        private entityDataService: SzEntityDataService,
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {}

    public onMoreLinkClick(dsKey: string, evt: MouseEvent) {
        let payload: SzVirtualEntityRecordsClickEvent = Object.assign(evt, {
            records: this.sources[dsKey],
            dataSourceName: dsKey
        });
        console.log('SzHowVirtualCardComponent.onMoreLinkClck: ', payload, evt);
        this._moreLinkClick.next(payload);
        //Array<SzVirtualEntityRecord>
    }
}