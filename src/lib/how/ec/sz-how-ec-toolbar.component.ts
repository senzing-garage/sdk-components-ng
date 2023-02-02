import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzConfigResponse, SzEntityIdentifier 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData } from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';
import { MatSelect } from '@angular/material/select';

@Component({
    selector: 'sz-how-ec-toolbar',
    templateUrl: './sz-how-ec-toolbar.component.html',
    styleUrls: ['./sz-how-ec-toolbar.component.scss']
})
export class SzHowECToolbarComponent implements OnInit, OnDestroy {
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