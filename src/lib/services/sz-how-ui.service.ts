import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuidv4} from 'uuid';
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
    private _pinnedSteps: string[]              = [];
    private _expandedFinalEntities: string[]    = [];
    private _expandedStepsOrGroups: string[]    = [];
    private _expandedGroups: string[]           = [];
    private _expandedVirtualEntities: string[]  = [];
    private _stepGroups: Map<string, SzResolutionStepGroup> = new Map<string, SzResolutionStepGroup>();
    private _stepsList: Array<SzResolutionStep | SzResolutionStepGroup>;
    private _finalEntities: SzVirtualEntity[]   = [];
    private _onGroupExpansionChange   = new Subject<string>()
    private _onStepExpansionChange    = new Subject<string>();
    private _onFinalExpansionChange   = new Subject<string>();
    private _userHasChangedStepState  = new Map<string, boolean>();
    private static _entityDataService: SzEntityDataService;
    private _onStepChildExpansionChange;

    public onGroupExpansionChange     = this._onGroupExpansionChange.asObservable();
    public onStepExpansionChange      = this._onStepExpansionChange.asObservable();
    public onFinalExpansionChange     = this._onFinalExpansionChange.asObservable();

    public set finalStates(value: SzVirtualEntity[]) {
      if(value && this._finalEntities && this._finalEntities.length > 0) {
        // when we initially set final entities populate expanded arr
        // so the trees are expanded by default
        this._expandedFinalEntities = value.map((fEnt) => {
          return fEnt.virtualEntityId;
        });
      }
      this._finalEntities = value;
    }

    public set stepGroups(value: Map<string, SzResolutionStepGroup>) {
      this._stepGroups              = value;
    }

    public set stepsList(value: Array<SzResolutionStep | SzResolutionStepGroup>) {
      this._stepsList = value;
    }

    public get stepsList(): Array<SzResolutionStep | SzResolutionStepGroup> {
      return this._stepsList;
    }

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
    isFinalEntityExpanded(vId: string): boolean {
      return this._expandedFinalEntities.includes(vId);
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
    expandFinal(virtualEntityId: string) {
      //console.log(`expandFinal(${virtualEntityId})`, this.isFinalEntityExpanded(virtualEntityId));

      if(!this.isFinalEntityExpanded(virtualEntityId)) {
        this._expandedFinalEntities.push(virtualEntityId);
        this._onFinalExpansionChange.next(virtualEntityId);
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
    collapseFinal(virtualEntityId: string) {
      console.log(`collapseFinal(${virtualEntityId})`, this.isFinalEntityExpanded(virtualEntityId));
      if(this.isFinalEntityExpanded(virtualEntityId)) {
        let _itemIndex  = this._expandedFinalEntities.indexOf(virtualEntityId);
        if(this._expandedFinalEntities[_itemIndex] && this._expandedFinalEntities.splice) {
          this._expandedFinalEntities.splice(_itemIndex, 1);
        }
        this._onFinalExpansionChange.next(virtualEntityId);
      }
    }    
    public get expandedStepsOrGroups() {
      return this._expandedStepsOrGroups;
    }

    toggleExpansion(id: string, groupId?: string, finalEntityId?: string) {
      id = id ? id : (groupId ? groupId : undefined);
      if(!id && !finalEntityId) {
        console.warn('toggleExpansion: no id passed to method');
        return;
      }
      //let isExpanded = (!groupId) ? this._expandedStepsOrGroups.includes(id) : this._expandedGroups.includes(groupId);
      let isExpanded = (finalEntityId) ? this._expandedFinalEntities.includes(finalEntityId) : 
      (!groupId) ? this._expandedStepsOrGroups.includes(id) : this._expandedGroups.includes(groupId);

      if(!isExpanded) {
        if(finalEntityId) {
          console.log(`\texpand final`);
          this.expandFinal(finalEntityId);
        } else if(!groupId) {
          console.log(`\texpand step`);
          this.expand(id);
        } else {
          console.log(`\texpand group`);
          this.expandGroup(id);
        }
      } else {
        if(finalEntityId) {
          console.log(`\collapse final`);
          this.collapseFinal(finalEntityId);
        } else if(!groupId) {
          console.log(`\tcollapse step`);
          this.collapse(id);
        } else {
          console.log(`\tcollapse groups`);
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

    public pinStep(vId: string, gId: string) {
      if(!this.isStepPinned(vId)) {
        this._pinnedSteps.push(vId);
        console.log(`pinStep(${vId}, ${gId})`);
        // find index of step in group members
        if(gId && this._stepGroups && this._stepGroups.has(gId)) {
          let _group              = this._stepGroups.get(gId);
          let _groupIndexInList   = this._stepsList.findIndex((s)=>{ return (s as SzResolutionStepGroup).id === gId; });
          let _members            = Object.assign([], _group.resolutionSteps);
          let _itemIndex          = _members.findIndex((step) => {
            return step.resolvedVirtualEntityId === vId ? true : false;
          }); 
          let insertBeforeGroup: Array<SzResolutionStepGroup | SzResolutionStep[]> = [];
          let insertAfterGroup: Array<SzResolutionStepGroup | SzResolutionStep[]>  = [];
          console.log(`\thas gId: ${this._stepGroups.has(gId)}`,this._stepGroups);
          if(_itemIndex > -1) {
            let _indexOfGroupInList = this._stepsList.findIndex((item: SzResolutionStepGroup | SzResolutionStep) => {
              return (item as SzResolutionStepGroup).id === _group.id;
            });

            // remove member from group
            if(_members[_itemIndex] && _members.splice) {
              if(_itemIndex === 0) {
                // insert before
                insertBeforeGroup   = insertBeforeGroup.concat(_members.splice(_itemIndex, 1));
              } else {
                // insert after
                insertAfterGroup    = insertAfterGroup.concat(_members.splice(_itemIndex, 1));
              }
            }

            // if there are at least two members after the member being
            // pinned we are making a new group with those steps
            // in them
            if((_members.length - _itemIndex) >= 1) {
              if(insertBeforeGroup.length > 0) {
                // grab any items previous to step and add those too
              } else if(insertAfterGroup.length > 0) {
                // grab any items after step being moved and add those too
                // this is every scenario EXCEPT when step is first item in group
                let _itemsToMove  = _members.splice(_itemIndex, (_members.length - _itemIndex));
                
                if(_itemsToMove && _itemsToMove.length >= 2) {
                  console.log(`\t\titems to be moved to new group: `, _itemsToMove);
                  insertAfterGroup = insertAfterGroup.concat(_itemsToMove);
                } else if(_itemsToMove && _itemsToMove.length === 1) {
                  insertAfterGroup = insertAfterGroup.concat(_itemsToMove);
                  console.log(`\t\tadditional item to be removed from group: `, _itemsToMove);
                }
              }

              if(_members.length === 1) {
                // there is only one member left in group
                // so remove this item too and delete the group
                console.log(`\t\tthere is only one item left in group, move it and delete group: `, _members);
              }
            }
            //console.log(`\tmembers removed from group: `, _members, _group.resolutionSteps, this._stepsList);
            console.log(`\titems to move to before group: `, insertBeforeGroup);
            console.log(`\titems to move to after group: `, insertAfterGroup);
            let _newStepList = [];

            if(insertBeforeGroup.length > 0){
              // we need to move these items to before the item being
              // pinned
              this._stepsList.forEach((step, _ind) => {
                let _cStep = (step as SzResolutionStepGroup);

                if(_ind === _groupIndexInList) {
                  // remove existing steps from current step
                  let _cStep = (step as SzResolutionStepGroup);
                  
                  // before we add the step we should add preceeeding
                  // steps
                  _newStepList = _newStepList.concat(insertBeforeGroup);
                }
                if(_cStep && _cStep.resolutionSteps) {
                  if(_cStep.resolutionSteps && insertBeforeGroup) {
                    // remove any items in "insertBeforeGroup" from "resolutionSteps"
                    let membersToKeep = _cStep.resolutionSteps.filter((_s)=> {
                      return insertBeforeGroup.some((grp) => {
                        return (grp as SzResolutionStep).resolvedVirtualEntityId !== _s.resolvedVirtualEntityId;
                      })
                    });
                    if(membersToKeep.length > 0) {
                      //_cStep.resolutionSteps = membersToKeep;
                    }
                    console.log(`\t\tmembersToKeep: `, membersToKeep);
                  }
                }
                _newStepList.push(step);
              });
              console.log(`\tmoved items to group before step being pinned: `, insertBeforeGroup, _newStepList);

            }

            if(insertAfterGroup.length > 2) {
              // we need to create a new group
              // since this is an "insertAfter" we already know that the item 
              // at index 0 is step being pinned. so just slice array.
              let _membersOfNewGroup = insertAfterGroup.slice(1);
              insertAfterGroup  = [insertAfterGroup[0]]; // delete all the items we sliced off
              let _newGroup: SzResolutionStepGroup     = {
                id: uuidv4(),
                resolutionSteps: (_membersOfNewGroup as SzResolutionStep[]),
                virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                  return (rStep as SzResolutionStep).resolvedVirtualEntityId; 
                })
              };
              insertAfterGroup.push(_newGroup);
              // update 
              if(!this._stepGroups.has(_newGroup.id)) {
                this._stepGroups.set(_newGroup.id, _newGroup);
              }
              console.log(`\treplaced individual items in after list with group: `, insertAfterGroup);
            }
            if(insertAfterGroup.length > 0) {
              // straight insert at index after group in _stepList
              let _foundIndex = false;
              this._stepsList.forEach((step, _ind) => {
                // copy over item
                _newStepList.push(step);
                if(_ind === _groupIndexInList) {
                  // this is the one
                  _foundIndex = true;
                  // update the members for this group
                  (step as SzResolutionStepGroup).resolutionSteps = _members;
                  console.log(`\t\tupdated resolution steps for #${(step as SzResolutionStepGroup).id}`, (step as SzResolutionStepGroup).resolutionSteps);
                  // now insert new group(s)
                  _newStepList = _newStepList.concat(insertAfterGroup);
                  console.log(`\t\tinserted new steps for #${(step as SzResolutionStepGroup).id}`, insertAfterGroup, _newStepList);
                }

              });
              if(!_foundIndex) {
                let _group2IndexInList   = this._stepsList.findIndex((s)=>{ 
                  return (s as SzResolutionStepGroup).id === gId; 
                });
                console.warn(`never found item(#${gId}|${_groupIndexInList}|${_group2IndexInList}) in list??? `, _groupIndexInList, this._stepsList, gId, this._stepGroups);
              }
              //console.log(`new step list: `,_newStepList, this._stepsList, insertBeforeGroup);
              //this._stepsList = _newStepList;
            } 

            // insert any new groups
            let allGroupsAdded = insertBeforeGroup.concat(insertAfterGroup).filter((grpOrStp) => {
              return (grpOrStp as SzResolutionStepGroup).virtualEntityIds !== undefined; // filter out any items that aren't specifically "groups"
            });
            (allGroupsAdded as SzResolutionStepGroup[]).forEach((stepGroup) => {
              this._stepGroups.set(stepGroup.id, stepGroup);
            });

            // update any existing groups
            if(this._stepGroups.has(gId)) {
              _group.resolutionSteps = _members;
              this._stepGroups.set(gId, _group);
              if(_group.resolutionSteps && _group.resolutionSteps.length === 1) {
                // remove step from group and delete group
                let _indexInNewList = _newStepList.findIndex((item) => {
                  if((item as SzResolutionStepGroup).id === _group.id) {
                    return true;
                  }
                  return false;
                });
                if(_indexInNewList > -1 && _newStepList[_indexInNewList] && _group && _group.resolutionSteps && _group.resolutionSteps[0]) {
                  //console.warn(`\tmove item to same spot as group in _newStepList: `, _newStepList[_indexInNewList], _group.resolutionSteps[0]);
                  _newStepList[_indexInNewList] = _group.resolutionSteps[0];
                  // now remove old group from stepGroups
                  this._stepGroups.delete(_group.id);
                }
              }
            }

            // update step list
            console.log(`new step list: `,_newStepList, this._stepsList, insertBeforeGroup);
            this._stepsList = _newStepList;
          } 

        } else {
          console.warn(`could not locate gId(${gId}) in stepsGroup: `, this._stepGroups);
        }

      } else {
        console.warn(`step already pinned: ${vId}`);
      }
    }

    public unPinStep(vId: string) {
      if(this.isStepPinned(vId)) {
        console.log(`unPinStep: ${vId}`, this._pinnedSteps);
        // this step is pinned
        let _previousItem;
        let _nextItem;
        let _stepIndex: number;
        let _stepToMove: SzResolutionStep;
        let _groupToMoveTo: SzResolutionStepGroup;
        let _stepMovedToGroup: string;

        this._stepsList.forEach((s, ind)=>{ 
          if((s as SzResolutionStep).resolvedVirtualEntityId === vId) {
            _stepIndex  = ind;
            _stepToMove = (s as SzResolutionStep);
            if(ind > 0 && this._stepsList[(ind - 1)]) {
              _previousItem = this._stepsList[(ind - 1)];
            }
            if(this._stepsList.length >= (ind + 1) && this._stepsList[(ind + 1)]) {
              _nextItem = this._stepsList[(ind + 1)]
            }
          }
        });
        // if previous item is either a step or a stack group we're going to add this step to that
        if(_previousItem) {
          let isStep  = (_previousItem as SzResolutionStep).resolvedVirtualEntityId ? true : false;
          let isStack = (_previousItem as SzResolutionStepGroup).resolutionSteps ? true : false;
          if(isStack) {
            let _stackGroupToAddStepTo = (_previousItem as SzResolutionStepGroup);
            _stepMovedToGroup = _stackGroupToAddStepTo.id;
            console.log(`previous item is a stack, add step to stack group`, _stackGroupToAddStepTo);

            if(_stackGroupToAddStepTo.resolutionSteps && _stackGroupToAddStepTo.resolutionSteps.push) {
              // add step to end
              _stackGroupToAddStepTo.resolutionSteps.push(_stepToMove);
              _stackGroupToAddStepTo.virtualEntityIds.push(_stepToMove.resolvedVirtualEntityId);
              // remove step from "stepsList"
              if(_stepToMove && _stepIndex && this._stepsList[_stepIndex] && _stepToMove && (this._stepsList[_stepIndex] as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                this._stepsList.splice(_stepIndex, 1);
              }
              // update "stepGroup" in "_stepGroups" with updated members/virtualIds
            }
          } else if(isStep) {
            console.log(`previous item is a step, create new group`);
            let _membersOfNewGroup = [_previousItem, _stepToMove];
            _groupToMoveTo     = {
              id: uuidv4(),
              resolutionSteps: (_membersOfNewGroup as SzResolutionStep[]),
              virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                return (rStep as SzResolutionStep).resolvedVirtualEntityId; 
              })
            };
            _stepMovedToGroup = _groupToMoveTo.id;
            this._stepsList[(_stepIndex -1)] = _groupToMoveTo;
            // update "stepGroups"
            this._stepGroups.set(_groupToMoveTo.id, _groupToMoveTo);
            // remove original step from list
            this._stepsList = this._stepsList.filter((item) => {
              if((item as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                return false;
              }
              return true;
            });
          }
        }
        if(_nextItem) {
          let isStep                = (_nextItem as SzResolutionStep).resolvedVirtualEntityId ? true : false;
          let isStack               = (_nextItem as SzResolutionStepGroup).resolutionSteps ? true : false;
          let _nextItemIsNotPinned  = isStep ? this.isStepPinned((_nextItem as SzResolutionStep).resolvedVirtualEntityId) : true;

          if(isStep && _nextItemIsNotPinned) {
            // next item is a un-pinned step
            if(_stepMovedToGroup) {
              // use the group the other item was moved to
            } else {
              // create new group here
              console.log(`next item is a step item. `, (_nextItem as SzResolutionStep));
              let _membersOfNewGroup = [_stepToMove];
              _groupToMoveTo     = {
                id: uuidv4(),
                resolutionSteps: (_membersOfNewGroup as SzResolutionStep[]),
                virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                  return (rStep as SzResolutionStep).resolvedVirtualEntityId; 
                })
              };
              _stepMovedToGroup = _groupToMoveTo.id;
              this._stepsList[_stepIndex] = _groupToMoveTo;
              // update "stepGroups"
              this._stepGroups.set(_groupToMoveTo.id, _groupToMoveTo);
              // remove original step from list
              this._stepsList = this._stepsList.filter((item) => {
                if((item as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                  return false;
                }
                return true;
              });
            }
          }

          if(!_stepMovedToGroup) {
            // so there was no "previous" step or stack
            // AND
            // next item was not a step OR was pinned
            console.warn(`\tstep was not moved to a group prior to executing "nextItem" block`);
            if(isStack) {
              // just move step to stack
              let targetStack = (_nextItem as SzResolutionStepGroup);
              console.log(`\t\tmoving step to stack after item`, targetStack);
              targetStack.resolutionSteps   = [_stepToMove].concat(targetStack.resolutionSteps)
              targetStack.virtualEntityIds  = targetStack.resolutionSteps.map((item: SzResolutionStep) => {
                return item.resolvedVirtualEntityId;
              });
              // now remove "_stepToMove" from stepsList
              console.log(`\t\tstep moved to new group`, targetStack, this._stepGroups.get(targetStack.id));
              this._stepsList = this._stepsList.filter((item) => {
                if((item as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                  return false;
                }
                return true;
              });
            }
          } else if(_stepMovedToGroup) {
            let targetStack     = this._stepsList.find((s) => {
              return (s as SzResolutionStepGroup).id === _stepMovedToGroup;
            }) as SzResolutionStepGroup;

            // we moved the item to a group
            if(isStack) {
              console.log(`\tnext item is a stack item. move stack item(s) to other stack`, (_nextItem as SzResolutionStep));

              // merge the two stacks
              // copy items from nextStack to previous stack
              let stackToMove       = (isStack) ? (_nextItem as SzResolutionStepGroup) : _nextItem;

              if(stackToMove && stackToMove.resolutionSteps && targetStack && targetStack.resolutionSteps) {
                // copy all items from nextStack to prevStack
                let itemsToMerge = (stackToMove as SzResolutionStepGroup).resolutionSteps;
                targetStack.resolutionSteps = targetStack.resolutionSteps.concat(itemsToMerge);
                // de-dupe jic
              }
              //_previousItem.resolutionSteps = _nextItem.resolutionSteps;
              targetStack.virtualEntityIds = (targetStack as SzResolutionStepGroup).resolutionSteps.map((item: SzResolutionStep) => {
                return item.resolvedVirtualEntityId;
              });
              // now remove "stackToMove" from stepsList
              this._stepsList = this._stepsList.filter((item) => {
                // omit step that was moved
                if((item as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                  return false;
                }
                // omit stack that was merged
                if((item as SzResolutionStepGroup).id === (stackToMove as SzResolutionStepGroup).id) {
                  return false;
                }
                return true;
              });
              // now remove "stackToMove.id" from "stepGroups"
              if(this._stepGroups.has(stackToMove.id)) {
                this._stepGroups.delete(stackToMove.id);
              }
            }
          }
        }
        // remove step from pinned items list
        let _existingIndex = this._pinnedSteps.indexOf(vId);
        console.log(`remove item(#${_existingIndex}) from pinnedSteps: `, this._pinnedSteps[_existingIndex]);
        if(_existingIndex > -1 && this._pinnedSteps[_existingIndex]) {
          this._pinnedSteps.splice(_existingIndex, 1);
        }
      }
    }

    public stepCanBeUnPinned(vId: string): boolean {
      let retVal = false;
      // if either the item before or after is a step card
      // OR
      // the item before or after is a stepGroup then the
      // item can be unpinned
      this._stepsList.forEach((item, ind) => {
        if((item as SzResolutionStep).resolvedVirtualEntityId === vId) {
          // this is the item
          if(ind > 0 && this._stepsList[(ind - 1)]) {
            // is previous item a step or stack group AND
            // not an interim or merge step
            retVal = ((this._stepsList[(ind - 1)] as SzResolutionStep).resolvedVirtualEntityId || (this._stepsList[(ind - 1)] as SzResolutionStepGroup).resolutionSteps) ? true : false;
          }
          if((ind+1) < this._stepsList.length && this._stepsList[(ind+1)] && !retVal) {
            // there are items after item
            // check if it is a step or stack group
            retVal = ((this._stepsList[(ind + 1)] as SzResolutionStep).resolvedVirtualEntityId || (this._stepsList[(ind + 1)] as SzResolutionStepGroup).resolutionSteps) ? true : false;
          }
        }
      });
      return retVal;
    }

    public isStepPinned(vId: string, gId?: string): boolean {
      return this._pinnedSteps.includes(vId);
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