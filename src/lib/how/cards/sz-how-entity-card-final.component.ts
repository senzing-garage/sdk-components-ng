import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { SzEntityData, SzEntityFeature, SzEntityIdentifier, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject, take, takeUntil, tap } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowFinalCardData } from '../../models/data-how';
import { SzHowCardBaseComponent } from './sz-how-entity-card-base.component';
import { SzSearchService } from '../../services/sz-search.service';

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
    selector: 'sz-how-entity-card-final',
    templateUrl: './sz-how-entity-card-final.component.html',
    styleUrls: ['./sz-how-entity-card-final.component.scss']
})
export class SzHowFinalCardComponent extends SzHowCardBaseComponent implements OnInit, OnDestroy {
  
    private _entityId: SzEntityIdentifier;
    @Input()
    set entityId(value: SzEntityIdentifier){
        if(this._entityId !== value) {
            this._entityId = value;
            this.getEntityData(this._entityId).pipe(
                take(1),
                takeUntil(this.unsubscribe$)
            ).subscribe((data: SzEntityData) => {
                this.entityData = data;
            })
        }
    }
    get entityId(): SzEntityIdentifier {
        return this._entityId;
    }

    @Input()
    virtualEntityId: SzVirtualEntity
    private _entityData: SzEntityData;
    private _resolvedEntity: SzResolvedEntity;
    public get resolvedEntity() {
        return this._resolvedEntity;
    }

    public set entityData(value: SzEntityData) {
        if(value) {
            this._entityData        = value;
            console.log('@senzing/sdk-components-ng/sz-how-entity-card-final.setEntityData()', value);
            if(value.resolvedEntity) {
                this._resolvedEntity    = value.resolvedEntity;
            }
        }
    }
    public get entityData(): SzEntityData {
        return this._entityData
    }

    @HostBinding('class.sz-how-entity-card') cssCardClass: boolean = true;

    public stepsPanelOpenState = false;

    private _data: SzHowFinalCardData;
    @Input()
    set data(value: SzHowFinalCardData) {
        this._data = value;
        console.log('@senzing/sdk-components-ng/sz-how-entity-card-final.setData(): ', this._data);
    }
    get data(): SzHowFinalCardData {
        return this._data;
    }
    private _sources: {
        [key: string]: Array<SzVirtualEntityRecord> 
    };
    get sources() {
        // check if we have a cached version of this first
        if(!this._sources) {
            let _recordsByDataSource: {
                [key: string]: Array<SzVirtualEntityRecord> 
            } = {};
            this._data.resolvedVirtualEntity.records.forEach((dsRec) => {
                if(!_recordsByDataSource[dsRec.dataSource]) {
                    _recordsByDataSource[dsRec.dataSource] = [];
                }
                _recordsByDataSource[dsRec.dataSource].push(dsRec);
    
            });
            this._sources = _recordsByDataSource;
        }
        return this._sources;
    }
    get stepNumber() {
        return this._data.stepNumber;
    }

    getEntityData(entityId: SzEntityIdentifier) {
        return this.searchService.getEntityById(entityId, true).
        pipe(
          tap(res => console.log('@senzing/sdk-components-ng/sz-how-entity-card-final.getEntityData: ' + this.entityId, res))
        )
    }

    public get names(): SzEntityFeature[] | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features && this.resolvedEntity.features['NAME']) {
            console.log('entity names: ', this.resolvedEntity.features['NAME']);
            return this.resolvedEntity.features['NAME'];
        } else {
            console.warn('entity names: ', this.resolvedEntity);
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
    private keysWithTopLevelAccessors = ['NAME','ADDRESS','DOB','PHONE','EMAIL','SSN','DL'];
    public get otherFeatures(): {[key: string] : SzEntityFeature[]} | undefined {
        if(this.resolvedEntity && this.resolvedEntity.features) {
            let keysWithoutCommonKeys   = Object.keys(this.resolvedEntity.features).filter((fName) => { return this.keysWithTopLevelAccessors.indexOf(fName) < 0; });
            let featuresWithoutMajorKeys = {};
            for(let _key in this.resolvedEntity.features) {
                if(keysWithoutCommonKeys.indexOf(_key) >= 0) { featuresWithoutMajorKeys[_key] = this.resolvedEntity.features[_key];}
            }
            console.log('other features: ', featuresWithoutMajorKeys, keysWithoutCommonKeys);
            return featuresWithoutMajorKeys;
        }
        return undefined;
    }

    /*
    private _data = {
        sources: [],
        names: [],
        addresses: [],
        emails: [],
        phone: [],
        ssn: [],
        dl: []
    }*/

    constructor(
        private searchService: SzSearchService
    ){
        super();
    }
    override ngOnInit() {}
    /**
     * unsubscribe when component is destroyed
     */
    override ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}