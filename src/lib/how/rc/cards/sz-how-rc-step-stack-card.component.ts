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
import { SzHowUIService } from '../../../services/sz-how-ui.service';

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
    selector: 'sz-how-rc-step-stack-card',
    templateUrl: './sz-how-rc-step-stack-card.component.html',
    styleUrls: ['./sz-how-rc-step-stack-card.component.scss']
})
export class SzHowRCStepCardStackComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _data: SzResolutionStep[];
    public get steps(): SzResolutionStep[] {
        return this._data;
    }
    @Input() set steps(value: SzResolutionStep[]) {
        this._data = value;
    }

    get numberOfCards(): number {
        let retVal = 0;
        if(this._data && this._data.length) {
            retVal = this._data.length;
        }
        return retVal;
    }

    get title(): string {
        let retVal = 'Steps';
        if(this._data) {
            let _retTypes = new Map<SzResolutionStepDisplayType, number>();
            this._data.forEach((step: SzResolutionStep) => {
                let _retType = SzHowUIService.getStepListItemType(step);
                if(_retTypes.has(_retType)){
                    _retTypes.set(_retType, (_retTypes.get(_retType) + 1));
                } else {
                    _retTypes.set(_retType, 1);
                }
            });
            if(_retTypes.size > 0) {
                retVal = '';
                console.log('_retTypes: ', _retTypes);

                _retTypes.forEach((typeCount, retType) => {
                    console.log(`\t\t${retType}`, typeCount);
                    if(retType === SzResolutionStepDisplayType.ADD) {
                        retVal += `${typeCount} x Add Record to Virtual Entity\n\r`;
                    }
                });
            }
        }
        return retVal;
    }

    getStepTitle(step: SzResolutionStep): string {
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

    isStepDisplayType(step: SzResolutionStep, typeVerb: SzResolutionStepDisplayType): boolean {
        let stepType = SzHowUIService.getStepListItemType(step);
        return stepType === typeVerb;
        /*
        if(typeVerb === 'MERGE') { return stepType === SzResolutionStepDisplayType.MERGE; }
        if(typeVerb === 'CREATE') { return stepType === SzResolutionStepDisplayType.CREATE; }
        if(typeVerb === 'ADD') { return stepType === SzResolutionStepDisplayType.ADD; }
        if(typeVerb === 'ADD') { return stepType === SzResolutionStepDisplayType.ADD; }
        if(typeVerb === 'ADD') { return stepType === SzResolutionStepDisplayType.ADD; }
        if(typeVerb === 'ADD') { return stepType === SzResolutionStepDisplayType.ADD; }

        return false;*/
    } 

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}