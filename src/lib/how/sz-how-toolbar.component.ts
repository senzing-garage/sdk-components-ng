import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzConfigResponse, SzEntityIdentifier 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzHowFinalCardData } from '../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';
import { SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../services/sz-how-ui-coordinator.service';

@Component({
    selector: 'sz-how-toolbar',
    templateUrl: './sz-how-toolbar.component.html',
    styleUrls: ['./sz-how-toolbar.component.scss']
})
export class SzHowToolbarComponent implements OnInit, OnDestroy {
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

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){}

    ngOnInit() {}

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
            console.log(`step #${step.stepNumber}: `, this._stepMap[step.resolvedVirtualEntityId]);
            //retVal = ``;
            // check to see if "both" singletons
            /*if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
                retVal = 'C';
            } else {

            }*/
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
}