import { Injectable } from '@angular/core';

import {
    SzFeatureScore,
  SzHowEntityResult,
  SzResolutionStep
} from '@senzing/rest-api-client-ng';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { SzHowStepHightlightEvent, SzResolutionStepUI } from '../models/data-how';

export class SzHowResolutionUIStep {
    private _step: SzResolutionStepUI;
    private _virtualEntityId: string;
    private _preceedingStepVirtualIds: string[];
    private _isExpanded: boolean = true;

    public get preceedingStepVirtualIds(): string[] {
        return this._preceedingStepVirtualIds;
    }
    public get data() {
        return this._step;
    }
    public get virtualEntityId(): string {
        return this._step.resolvedVirtualEntityId;
    }

    constructor(resolutionStep: SzResolutionStep, resolutionSteps: {[key: string] : SzResolutionStep}) {
        let extendedStep        = resolutionStep as SzResolutionStepUI;
        let preceedingVirtualIds = this.getVirtualIdsForStepChain(resolutionStep.resolvedVirtualEntityId, resolutionSteps)
        this._virtualEntityId   = resolutionStep.resolvedVirtualEntityId;
        this._step              = extendedStep;
        this._preceedingStepVirtualIds = preceedingVirtualIds;
        //console.log('SzHowResolutionUIStep()', extendedStep, preceedingVirtualIds);
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

export interface SzHowStepUIStateChangeEvent {
    visibleVirtualIds: string[],
    hiddenVirtualIds: string[]
}

/**
 * Provides access to the /datasources api path.
 * See {@link http://github.com/Senzing/senzing-rest-api/blob/master/senzing-rest-api.yaml#L172}
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
    private _finalStepVirtualId: string;

    private _stepVisibilityStateChange = new BehaviorSubject<SzHowStepUIStateChangeEvent>({visibleVirtualIds: [], hiddenVirtualIds: []});
    public stepExpansionChange = this._stepVisibilityStateChange.asObservable();

    private _jumpToStep = new BehaviorSubject<SzHowResolutionUIStep | undefined>(undefined);
    public onStepJump = this._jumpToStep.asObservable();

    private _stepFeaturesHighlightChange = new Subject<SzHowStepHightlightEvent | undefined>();
    public onStepFeaturesHighlightChange = this._stepFeaturesHighlightChange.asObservable();

    private _highlightedSteps: SzHowResolutionUIStep[] = [];
    public get hasHighlightedSteps(): boolean {
        return this._highlightedSteps && this._highlightedSteps.length > 0 ? true : false;
    }

    public get steps(): {[key: string]: SzHowResolutionUIStep} {
        return this._steps;
    }
    
    public set currentHowResult(value: SzHowEntityResult) {
        this._currentHowResult = value;
        this._resolutionStepsByVirtualId = value && value.resolutionSteps ? value.resolutionSteps : {};
        this._finalStepVirtualId = undefined;

        let _stepsUI = {};
        if(value && value.resolutionSteps) {
            for(let k in value.resolutionSteps) {
                let rStep = value.resolutionSteps[k];
                _stepsUI[k] = new SzHowResolutionUIStep(rStep, value.resolutionSteps);
            }
        }
        this._steps = _stepsUI;
        // get steps for last step and expand
        if(value && value.finalStates && value.finalStates.length > 0) {
            this._finalStepVirtualId = value.finalStates[0].virtualEntityId;
            this.expandSteps( this._finalStepVirtualId );
        }
        //console.log('SzHowUICoordinatorService.setCurrentHowResult() ', this._steps);
    }

    constructor() {}

    public expandSteps(virtualEntityId: string) {
        let stepsToChangeState = [];
        let step: SzHowResolutionUIStep;
        if(virtualEntityId && this._steps && this._steps[virtualEntityId]) {
            step = this._steps[virtualEntityId];
            stepsToChangeState = step.preceedingStepVirtualIds;
            
            // we need all step ids that are parents of this primary id
            let stepsResultOf       = [virtualEntityId];
            for(let sk in this._steps) {
                let hasVEntityInSteps = this._steps[sk].preceedingStepVirtualIds.indexOf(virtualEntityId) > -1;
                if(hasVEntityInSteps) {
                    stepsResultOf.push(sk);
                }
            }
            // force steps that are result of virtualId 
            // to continue to display
            stepsToChangeState = stepsToChangeState.concat(stepsResultOf);

            // now set anything not in the visible results to hidden
            let stepsNotInChain    = Object.keys(this._resolutionStepsByVirtualId)
            .filter((kname) => {
                return stepsToChangeState.indexOf(kname) <= 0 && kname !== this._finalStepVirtualId;
            });

            let eventPayload = {
                visibleVirtualIds: stepsToChangeState,
                hiddenVirtualIds: stepsNotInChain
            }
            this._stepVisibilityStateChange.next(eventPayload);
        }
        //console.log(`SzHowUICoordinatorService.expandSteps(${virtualEntityId}): ${stepsToChangeState}`, step, this._steps, this);
    }
    public collapseSteps(virtualEntityId: string) {
        let stepsToChangeState = [];
        let step: SzHowResolutionUIStep;
        if(virtualEntityId && this._steps && this._steps[virtualEntityId]) {
            step = this._steps[virtualEntityId];
            stepsToChangeState  = step.preceedingStepVirtualIds;
            let stepsNotInChain    = Object.keys(this._resolutionStepsByVirtualId)
            .filter((kname) => {
                return stepsToChangeState.indexOf(kname) <= 0;
            });

            let eventPayload = {
                visibleVirtualIds: stepsNotInChain,
                hiddenVirtualIds: stepsToChangeState
            }
            this._stepVisibilityStateChange.next(eventPayload);
        }
    }

    public jumpTo(stepId: string) {
        // 99.9% of the time stepId is a virtualEntityId
        // unless it's the first(two singletons) or 
        // last step(when the result is multiple entities)
        if(this._steps[stepId]){
            this._highlightedSteps = [this._steps[stepId]];
            // first make sure we can see the step being jumped to
            this.expandSteps(stepId);
            // now jump to step
            this._jumpToStep.next(this._steps[stepId]);
            //console.log('Jump To: ', stepId);
        }
    }

    public highlightStepFeatures(virtualEntityId: string, features: SzFeatureScore[]) {
        // get the UI object for step
        if(this._steps && this._steps[virtualEntityId]) {
            // now get the inbound AND candidate ID's
            let _payload: SzHowStepHightlightEvent = {
                features: {},
                sourceStepId: virtualEntityId
            };
            _payload.features[this._steps[virtualEntityId].data.candidateVirtualEntity.virtualEntityId]  = features;
            _payload.features[this._steps[virtualEntityId].data.inboundVirtualEntity.virtualEntityId]    = features;
            if(this._steps[virtualEntityId].data && this._steps[virtualEntityId].data.matchInfo){
                if(this._steps[virtualEntityId].data.matchInfo.resolutionRule) {
                    _payload.resolutionRule = this._steps[virtualEntityId].data.matchInfo.resolutionRule;
                }
                if(this._steps[virtualEntityId].data.matchInfo.matchKey) {
                    _payload.matchKey = this._steps[virtualEntityId].data.matchInfo.matchKey;
                }
            }
            //this._highlightFeaturesForCards(_payload);
            this._stepFeaturesHighlightChange.next(_payload);
        }
    }

    public clear() {
        this.currentHowResult   = undefined;
        this._highlightedSteps  = [];
        this._jumpToStep.next(undefined); // we need to publish a null to reset
    }
}