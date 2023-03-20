import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  EntityDataService as SzEntityDataService,
  SzFeatureScore,
  SzHowEntityResult,
  SzEntityIdentifier,
  SzResolutionStep,
  SzVirtualEntity,
  SzHowEntityResponse
} from '@senzing/rest-api-client-ng';
import { SzResolutionStepDisplayType, SzResolutionStepGroup, SzResolutionStepListItemType } from '../models/data-how';
import { SzPrefsService } from './sz-prefs.service';
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
    private _expandedGroups: string[]           = [];
    private _expandedVirtualEntities: string[]  = [];
    private _stepGroups: Map<string, SzResolutionStepGroup> = new Map<string, SzResolutionStepGroup>();

    private _onGroupExpansionChange = new Subject<string>()
    private _onStepExpansionChange  = new Subject<string>();
    private _onStepChildExpansionChange;

    public onGroupExpansionChange   = this._onGroupExpansionChange.asObservable();
    public onStepExpansionChange    = this._onStepExpansionChange.asObservable();

    public set stepGroups(value: Map<string, SzResolutionStepGroup>) {
      this._stepGroups              = value;
    }
    private _userHasChangedStepState    = new Map<string, boolean>();
    private static _entityDataService: SzEntityDataService;

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
      return this._expandedGroups.includes(groupId);
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
      //console.info(`SzHowUIService.expand(${vId})`, this._expandedStepsOrGroups);
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
      //console.info(`SzHowUIService.collapse(${vId})`, this._expandedStepsOrGroups);
    }
    expandStep(virtualEntityId: string) {
      //console.info(`SzHowUIService.expandStep(${virtualEntityId}): ${this.isStepExpanded(virtualEntityId)}`);
      if(!this.isStepExpanded(virtualEntityId)) {
        this._expandedStepsOrGroups.push(virtualEntityId);
        this._userHasChangedStepState.set(virtualEntityId, true)
        this._onStepExpansionChange.next(virtualEntityId);
      }
    }
    collapseStep(virtualEntityId: string) {
      if(this.isStepExpanded(virtualEntityId)) {
        let _itemIndex  = this._expandedStepsOrGroups.indexOf(virtualEntityId);
        if(this._expandedStepsOrGroups[_itemIndex] && this._expandedStepsOrGroups.splice) {
          this._expandedStepsOrGroups.splice(_itemIndex, 1);
          this._onStepExpansionChange.next(virtualEntityId);
        }
      }
    }
    expandGroup(groupId: string) {
      if(!this.isGroupExpanded(groupId)) {
        this._expandedGroups.push(groupId);
        this._onGroupExpansionChange.next(groupId);
        // check if group has only one member card
        // if a user expands a collapsed group it 
        // doesnt make sense to make them click expand again
        // right after
        let _group = this._stepGroups.get(groupId);
        if(_group && _group.interimSteps && _group.interimSteps.length === 1 && !this._userHasChangedStepState.has(groupId)) {
          // step will have the same id as the group so just use that
          this.expandStep(groupId);
        }
      }
    }
    collapseGroup(groupId: string) {
      if(this.isGroupExpanded(groupId)) {
        let _itemIndex  = this._expandedGroups.indexOf(groupId);
        if(this._expandedGroups[_itemIndex] && this._expandedGroups.splice) {
          this._expandedGroups.splice(_itemIndex, 1);
        }
        this._onGroupExpansionChange.next(groupId);
      }
    }
    public get expandedStepsOrGroups() {
      return this._expandedStepsOrGroups;
    }

    toggleExpansion(id: string, groupId?: string) {
      id = id ? id : (groupId ? groupId : undefined);
      if(!id) {
        console.warn('toggleExpansion: no id passed to method');
        return;
      }
      let isExpanded = (!groupId) ? this._expandedStepsOrGroups.includes(id) : this._expandedGroups.includes(groupId);
      if(!isExpanded) {
        if(!groupId) {
          this.expand(id);
        } else {
          this.expandGroup(id);
        }
      } else {
        if(!groupId) {
          this.collapse(id);
        } else {
          this.collapseGroup(id);
        }
      }
    }

    public collapseAll(idsToExclude?: string | string[], emitEvent?: boolean) {
      let _stepIdsLeft           = [];
      let _groupIdsLeft          = [];

      if(idsToExclude) {
        _stepIdsLeft           = this._expandedStepsOrGroups.filter((gId: string) => {
          if((idsToExclude as string) && (idsToExclude as string).substring) {
            // is single id
            return gId === (idsToExclude as string)
          } else {
            return (idsToExclude as string[]).includes(gId);
          }
        });
        _groupIdsLeft           = this._expandedGroups.filter((gId: string) => {
          if((idsToExclude as string) && (idsToExclude as string).substring) {
            // is single id
            return gId === (idsToExclude as string)
          } else {
            return (idsToExclude as string[]).includes(gId);
          }
        });
      }
      this._expandedStepsOrGroups = _stepIdsLeft;
      this._expandedGroups        = _groupIdsLeft;
      if(emitEvent !== false) {
        this._onStepExpansionChange.next(undefined);
        this._onGroupExpansionChange.next(undefined);
      }
    }

    public selectStep(vId: string) {
      let vIdInGroups = (this._stepGroups && this._stepGroups.has(vId)) ? true : false;
      let stepGroup   = vIdInGroups ? this._stepGroups.get(vId) : undefined;
      //console.log(`SzHowUIService.selectStep()`, vIdInGroups, stepGroup);
      if(vIdInGroups) {
        // is group
          // clear out any other selected
          this.collapseAll(undefined, false);
          // expand group
          this.expandGroup(vId);
          // also expand step(s)
          this.expandStep(vId);
      } else {
        // is not in group
        if(!(this._expandedStepsOrGroups && this._expandedStepsOrGroups.includes(vId))) {
          // clear out any other selected
          this.collapseAll(undefined, false);
          // expand step
          this.expandStep(vId);
          // check if step is actually a member of a group
          let groupForStep  = SzHowUIService.getGroupForMemberStep(vId, this._stepGroups);
          if(groupForStep) {
            this.expandGroup(groupForStep.id);
          }
        }
      }
    }

    public static getGroupForMemberStep(step: SzResolutionStep | string, groups: Map<string, SzResolutionStepGroup>): SzResolutionStepGroup {
      let _retVal: SzResolutionStepGroup;
      if(groups && step) {
        let _idToLookFor = ((step as SzResolutionStep).resolvedVirtualEntityId) ? (step as SzResolutionStep).resolvedVirtualEntityId : (step as string);
        let _sk = false;
        groups.forEach((groupToSearch: SzResolutionStepGroup, key: string) => {
          if(!_sk && groupToSearch.virtualEntityIds && groupToSearch.virtualEntityIds.indexOf(_idToLookFor) > -1 || groupToSearch.id === _idToLookFor) {
            _retVal = groupToSearch;
          }
        });
      }
      return _retVal;
    }

    public static getResolutionStepListItemType(item: SzResolutionStep | SzResolutionStepGroup): SzResolutionStepListItemType {
      if(item && item !== undefined) {
        let itemIsGroup   = (item as SzResolutionStepGroup).virtualEntityIds && (item as SzResolutionStepGroup).interimSteps ? true : false;
        let itemsIsStack  = (item as SzResolutionStepGroup).virtualEntityIds && (item as SzResolutionStepGroup).resolutionSteps && !itemIsGroup ? true : false;
        
        if(itemIsGroup) {
          // item is a interim entity whos children are a collection of steps AND/OR stacks (single with subtree)
          return SzResolutionStepListItemType.GROUP;
        } else if(itemsIsStack) {
          // item is a collection of steps but not an interim entity (collapsible multi-step)
          return SzResolutionStepListItemType.STACK;
        } else {
          // item is neither a collection of steps or a interim entity group (single)
          return SzResolutionStepListItemType.STEP;
        }
      }
      return undefined;
    }

    public static getResolutionStepCardType(step: SzResolutionStep, stepNumber?: number): SzResolutionStepDisplayType {
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

    constructor(
      public entityDataService: SzEntityDataService,
      public prefs: SzPrefsService
    ) {
      SzHowUIService._entityDataService = entityDataService;
    }

    // --------------------------------------- start data/api functions

    public static getHowDataForEntity(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
      return this._entityDataService.howEntityByEntityID(
          entityId as number
      )
    }
    // --------------------------------------- end   data/api functions

}