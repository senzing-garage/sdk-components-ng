import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
    SzFeatureScore,
    SzHowEntityResult,
    SzResolutionStep,
    SzVirtualEntity
} from '@senzing/rest-api-client-ng';
import { SzResolutionStepDisplayType, SzResolutionStepGroup } from '../models/data-how';

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
    private _pinnedSteps: string[];
    private _expandedStepsOrGroups: string[]    = [];
    private _expandedVirtualEntities: string[]  = [];

    private _onGroupExpansionChange = new Subject<string>()
    private _onStepExpansionChange  = new Subject<string>();
    private _onStepChildExpansionChange;

    public onGroupExpansionChange   = this._onGroupExpansionChange.asObservable();
    public onStepExpansionChange    = this._onStepExpansionChange.asObservable();

    idIsGroupId(vId: string): boolean {
      // group id format "de9b1c0f-67a9-4b6d-9f63-bc90deabe3e4"
      return vId && vId.split && vId.split('-').length > 4 ? true : false;
    }
    idIsStepId(vId: string): boolean {
      // step id format "V401992-S7"
      return vId && vId.split && vId.split('-').length <= 2 ? true : false;
    }

    isStepExpanded(virtualEntityId: string): boolean {
      return this._expandedStepsOrGroups.includes(virtualEntityId);
    }
    isGroupExpanded(groupId: string): boolean {
      return this._expandedStepsOrGroups.includes(groupId);
    }
    isExpanded(vId: string) {
      return this._expandedStepsOrGroups.includes(vId);
    }
    expand(vId: string) {
      if(!this.isExpanded(vId)) {
        this._expandedStepsOrGroups.push(vId);
        if(this.idIsGroupId(vId)) { this._onGroupExpansionChange.next(vId); }
        if(this.idIsStepId(vId)) { this._onStepExpansionChange.next(vId); }
      }
      console.info(`SzHowUIService.expand(${vId})`, this._expandedStepsOrGroups);
    }
    collapse(vId: string) {
      if(this.isExpanded(vId)) {
        let _itemIndex  = this._expandedStepsOrGroups.indexOf(vId);
        if(this._expandedStepsOrGroups[_itemIndex] && this._expandedStepsOrGroups.splice) {
          this._expandedStepsOrGroups.splice(_itemIndex, 1);
          if(this.idIsGroupId(vId)) { this._onGroupExpansionChange.next(vId); }
          if(this.idIsStepId(vId)) { this._onStepExpansionChange.next(vId); }
        }
      }
      console.info(`SzHowUIService.collapse(${vId})`, this._expandedStepsOrGroups);
    }
    expandStep(virtualEntityId: string) {
      if(!this.isStepExpanded(virtualEntityId)) {
        this._expandedStepsOrGroups.push(virtualEntityId);
      }
    }
    collapseStep(virtualEntityId: string) {
      if(this.isStepExpanded(virtualEntityId)) {
        let _itemIndex  = this._expandedStepsOrGroups.indexOf(virtualEntityId);
        if(this._expandedStepsOrGroups[_itemIndex] && this._expandedStepsOrGroups.splice) {
          this._expandedStepsOrGroups.splice(_itemIndex, 1);
        }
      }
    }
    expandGroup(groupId: string) {
      if(!this.isGroupExpanded(groupId)) {
        this._expandedStepsOrGroups.push(groupId);
      }
    }
    collapseGroup(groupId: string) {
      if(this.isGroupExpanded(groupId)) {
        let _itemIndex  = this._expandedStepsOrGroups.indexOf(groupId);
        if(this._expandedStepsOrGroups[_itemIndex] && this._expandedStepsOrGroups.splice) {
          this._expandedStepsOrGroups.splice(_itemIndex, 1);
        }
      }
    }


    public static getStepListItemType(step: SzResolutionStep, stepNumber?: number): SzResolutionStepDisplayType {
      if(step && step !== undefined) {
        //console.log(`#${stepNumber} getStepListItemType: `, step);
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