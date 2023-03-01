import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
    SzFeatureScore,
    SzHowEntityResult,
    SzResolutionStep,
    SzVirtualEntity
} from '@senzing/rest-api-client-ng';
import { SzHowFinalCardData, SzVirtualEntityRecordsClickEvent, SzResolvedVirtualEntity, SzResolutionStepDisplayType } from '../models/data-how';

/**
 * Provides access to the /datasources api path.
 * See {@link https://github.com/Senzing/senzing-rest-api/blob/master/senzing-rest-api.yaml}
 *
 * @export
 */
@Injectable({
    providedIn: 'root'
})
export class SzHowUIService {
    private _pinnedSteps: SzResolutionStep[];
    private _expandedSteps: SzResolutionStep[];
    private _expandedVirtualEntities: SzVirtualEntity[];
    private _stepGroups: Map<string, SzResolutionStep[]>;

    private _onStepExpansionChange;
    private _onStepChildExpansionChange;

    public static getStepListItemType(step: SzResolutionStep, stepNumber?: number): SzResolutionStepDisplayType {
      if(step && step !== undefined) {
        console.log(`#${stepNumber} getStepListItemType: `, step);
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
          // both items are records
          return SzResolutionStepDisplayType.CREATE;
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
          // both items are virtual entities
          return SzResolutionStepDisplayType.MERGE;
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
          // one of the items is record, the other is virtual
          return SzResolutionStepDisplayType.ADD;
        }
      }
      return undefined;
    }
}