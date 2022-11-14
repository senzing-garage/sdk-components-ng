import { Injectable } from '@angular/core';

import {
  SzHowEntityResult,
  SzResolutionStep
} from '@senzing/rest-api-client-ng';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface SzResolutionStepUI extends SzResolutionStep {
    visible: boolean
    expanded: boolean
    preceedingSteps: SzResolutionStepUI[]
}

export class SzHowResolutionUIStep {
    private _step: SzResolutionStepUI;
    private _virtualEntityId: string;
    private _preceedingStepVirtualIds: string[];
    private _isExpanded: boolean = true;

    public get preceedingStepVirtualIds(): string [] {
        return this._preceedingStepVirtualIds;
    }

    constructor(resolutionStep: SzResolutionStep, resolutionSteps: {[key: string] : SzResolutionStep}) {
        let extendedStep = resolutionStep as SzResolutionStepUI;
        let preceedingVirtualIds = this.getVirtualIdsForStepChain(resolutionStep.resolvedVirtualEntityId, resolutionSteps)
        
        this._virtualEntityId   = resolutionStep.resolvedVirtualEntityId;
        this._step              = extendedStep;
        this._preceedingStepVirtualIds = preceedingVirtualIds;

        console.log('SzHowResolutionUIStep()', extendedStep, preceedingVirtualIds);
    }
    getVirtualIdsForStepChain(virtualEntityId: string, resolutionSteps: {[key: string] : SzResolutionStep}) {
        // get the immediately preceeding step by virtual id
        let step    = resolutionSteps[virtualEntityId];
        let rIds    = [];
        if(step) {
            if(step.candidateVirtualEntity) {
                rIds.push(step.candidateVirtualEntity.virtualEntityId);
                if(!step.candidateVirtualEntity.singleton){
                    // recurse
                    let candidateChainIds = this.getVirtualIdsForStepChain(step.candidateVirtualEntity.virtualEntityId, resolutionSteps)
                    rIds = rIds.concat(candidateChainIds);
                }
            }
            if(step.inboundVirtualEntity) {
                rIds.push(step.inboundVirtualEntity.virtualEntityId);
                if(!step.inboundVirtualEntity.singleton){
                    // recurse
                    let inboundChainIds = this.getVirtualIdsForStepChain(step.inboundVirtualEntity.virtualEntityId, resolutionSteps)
                    rIds = rIds.concat(inboundChainIds);
                }
            }
        }
        return rIds;
    }

    public collapse() {
        this._isExpanded = false;
    }
    public expand() {
        this._isExpanded = true;

    }
    public toggle() {
        this._isExpanded = !this._isExpanded;
    }
}

/**
 * Provides access to the /datasources api path.
 * See {@link https://github.com/Senzing/senzing-rest-api/blob/master/senzing-rest-api.yaml#L172}
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzHowUICoordinatorService {
    private _currentHowResult: SzHowEntityResult;
    private _resolutionStepsByVirtualId: {[key: string]: SzResolutionStep} = {};
    public _steps: {[key: string]: SzHowResolutionUIStep} = {};

    public get steps(): {[key: string]: SzHowResolutionUIStep} {
        return this._steps;
    }
    
    public set currentHowResult(value: SzHowEntityResult) {
        this._currentHowResult = value;
        this._resolutionStepsByVirtualId = value.resolutionSteps;

        let _stepsUI = {};
        for(let k in value.resolutionSteps) {
            let rStep = value.resolutionSteps[k];
            _stepsUI[k] = new SzHowResolutionUIStep(rStep, value.resolutionSteps);
        }
        this._steps = _stepsUI;

        console.log('SzDataSourcesService.setCurrentHowResult() ', this._steps);
    }

    constructor() {

    }

    public expandSteps(virtualEntityId: string) {
        let stepsToChangeState = [];
        let step: SzHowResolutionUIStep;
        if(virtualEntityId && this._steps && this._steps[virtualEntityId]) {
            step = this._steps[virtualEntityId];
            stepsToChangeState = step.preceedingStepVirtualIds;
        }
        console.log(`SzDataSourcesService.expandSteps(${virtualEntityId}): ${stepsToChangeState}`, step, this._steps, this);
    }
    public collapseSteps(virtualEntityId: string) {
        let stepsToChangeState = [];
        let step: SzHowResolutionUIStep;
        if(virtualEntityId && this._steps && this._steps[virtualEntityId]) {
            step = this._steps[virtualEntityId];
            stepsToChangeState = step.preceedingStepVirtualIds;
        }
        console.log(`SzDataSourcesService.collapseSteps(${virtualEntityId}): ${stepsToChangeState}`, step, this._steps, this);
    }
}