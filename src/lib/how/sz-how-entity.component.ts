import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzHowFinalCardData } from '../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';

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
    selector: 'sz-how-entity',
    templateUrl: './sz-how-entity.component.html',
    styleUrls: ['./sz-how-entity.component.scss']
})
export class SzHowEntityComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
  
    @Input()
    entityId: SzEntityIdentifier;

    private _data: SzHowEntityResult;
    public finalCardsData: SzHowFinalCardData[];
    private _featureTypesOrdered: string[] | undefined;
    public get orderedFeatures(): string[] {
        return this._featureTypesOrdered
    }

    getData(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
        return this.entityDataService.howEntityByEntityID(
            this.entityId as number
        )
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService
    ){}

    ngOnInit() {
        this.getFeatureTypeOrderFromConfig();

        if(this.entityId) {
            // get entity data
            this.getData(this.entityId).subscribe((resp: SzHowEntityResponse) => {
                console.log(`how response: ${resp}`, resp.data);
                this._data = resp.data;

                if(this._data.finalStates && this._data.finalStates.length > 0) {
                    // has at least one final states
                    // for each final state get the virual step
                    // and populate the components
                    let _finalStatesData = this._data.finalStates
                    .filter((fStateObj) => {
                        return this._data.resolutionSteps && this._data.resolutionSteps[ fStateObj.virtualEntityId ] ? true : false;
                    })
                    .map((fStateObj) => {
                        return (Object.assign(this._data.resolutionSteps[ fStateObj.virtualEntityId ], {
                            resolvedVirtualEntity: fStateObj
                        }) as SzHowFinalCardData)
                    });
                    this.finalCardsData = _finalStatesData
                    console.log(`final step(s): `, this.finalCardsData);
                }
            })
        }

    }

    getFeatureTypeOrderFromConfig() {
        this.configDataService.getOrderedFeatures().subscribe((res: any)=>{
            this._featureTypesOrdered = res;
            console.log('getFeatureTypeOrderFromConfig: ', res);
        });
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}