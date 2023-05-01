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
import { SzResolutionStepDisplayType, SzResolutionStepGroup, SzResolutionStepListItemType, SzResolutionStepNode } from '../models/data-how';
import { SzPrefsService } from './sz-prefs.service';
import { stack } from 'd3';

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
    private _navigationExpanded: boolean        = true;
    private _pinnedSteps: string[]              = [];
    private _expandedNodes: string[]            = [];
    private _expandedGroups: string[]           = [];
    private _stepNodeGroups: Map<string, SzResolutionStepNode>  = new Map<string, SzResolutionStepNode>();
    private _stepNodes: Array<SzResolutionStepNode>;
    private _onGroupExpansionChange   = new Subject<string>()
    private _onStepExpansionChange    = new Subject<string>();
    private _userHasChangedStepState  = new Map<string, boolean>();
    private static _entityDataService: SzEntityDataService;
    public onGroupExpansionChange     = this._onGroupExpansionChange.asObservable();
    public onStepExpansionChange      = this._onStepExpansionChange.asObservable();

    public set stepNodeGroups(value: Map<string, SzResolutionStepNode>) {
      this._stepNodeGroups          = value;
    }
    public set stepNodes(value: Array<SzResolutionStepNode>) {
      this._stepNodes = value;
    }
    public get stepNodes(): Array<SzResolutionStepNode> {
      return this._stepNodes;
    }
    public get isNavExpanded(): boolean {
      return this._navigationExpanded;
    }
    public set isNavExpanded(value: boolean) {
      this._navigationExpanded = value;
    }
    public get expandedNodes() {
      return this._expandedNodes;
    }
    public get expandedGroups() {
      return this._expandedGroups;
    }
    isStepExpanded(virtualEntityId: string): boolean {
      return this._expandedNodes.includes(virtualEntityId);
    }
    isGroupExpanded(groupId: string): boolean {
      return this._expandedGroups.includes(groupId);
    }
    collapseNode(id: string, itemType?: SzResolutionStepListItemType, forceState?: boolean) {
      let _stepNodes = this.getStepNodeById(id);
      //console.log(`collapseNode(${id}, ${itemType})`,_stepNodes, this._stepNodes);

      if(_stepNodes && (!itemType || itemType === SzResolutionStepListItemType.STEP) && this.isStepExpanded(id)) {
        // remove from expanded nodes
        let _itemIndex  = this._expandedNodes.indexOf(id);
        if(this._expandedNodes[_itemIndex] && this._expandedNodes.splice) {
          this._expandedNodes.splice(_itemIndex, 1);
          this._onStepExpansionChange.next(id);
        }
      }
      if(id && (!this._stepNodes || (this._stepNodes && this._stepNodes.length === 0))) {
        // okay, this has been called prematurely (before we actually have the nodelist)
        // if we have a "type" we can pretty safely just modify the arrays
        if(itemType && (itemType === SzResolutionStepListItemType.STACK || itemType === SzResolutionStepListItemType.GROUP || itemType === SzResolutionStepListItemType.FINAL)) {
          if(this.isGroupExpanded(id)) {
            let _itemIndex  = this._expandedGroups.indexOf(id);
            if(this._expandedGroups[_itemIndex] && this._expandedGroups.splice) {
              this._expandedGroups.splice(_itemIndex, 1);
            }
            this._onGroupExpansionChange.next(id);
          }
        } else if(itemType && (itemType === SzResolutionStepListItemType.STEP)) {
          let _itemIndex  = this._expandedNodes.indexOf(id);
          if(this._expandedNodes[_itemIndex] && this._expandedNodes.splice) {
            this._expandedNodes.splice(_itemIndex, 1);
            this._onStepExpansionChange.next(id);
          }
        }
      }
      if(_stepNodes && _stepNodes.forEach) {
        _stepNodes.filter((_fn) => (itemType && _fn.itemType === itemType || !itemType)).forEach((_n) => {
          // should we collapse group(s) also matching this?
          if(_n && _n.children && _n.children.length) {
            // this is a group
            if(this.isGroupExpanded(_n.id)) {
              let _itemIndex  = this._expandedGroups.indexOf(_n.id);
              if(this._expandedGroups[_itemIndex] && this._expandedGroups.splice) {
                this._expandedGroups.splice(_itemIndex, 1);
              }
              this._onGroupExpansionChange.next(_n.id);
            }
          }
        });
      }
    }
    expandNode(id: string, itemType?: SzResolutionStepListItemType) {
      let _stepNodes = this.getStepNodeById(id);
      //console.log(`expandNode(${id}, ${itemType})`, _stepNodes, this._stepNodes);
      if(_stepNodes && (!itemType || itemType === SzResolutionStepListItemType.STEP) && !this.isStepExpanded(id)) {
        // add to expanded nodes
        this._expandedNodes.push(id);
        this._userHasChangedStepState.set(id, true)
        //console.log(`"${id} added to expanded nodes: ${this._expandedNodes}"`, _stepNodes);
      }
      if(id && (!this._stepNodes || (this._stepNodes && this._stepNodes.length === 0))) {
        // okay, this has been called prematurely (before we actually have the nodelist)
        // if we have a "type" we can pretty safely just modify the arrays
        if(itemType && (itemType === SzResolutionStepListItemType.STACK || itemType === SzResolutionStepListItemType.GROUP || itemType === SzResolutionStepListItemType.FINAL)) {
          if(!this.isGroupExpanded(id)) {
            this._expandedGroups.push(id);
            this._onGroupExpansionChange.next(id);
          }
        } else if(itemType && (itemType === SzResolutionStepListItemType.STEP)) {
          this._expandedNodes.push(id);
          this._onStepExpansionChange.next(id);
        }
      }
      if(_stepNodes && _stepNodes.forEach) {
        _stepNodes.filter((_fn) => (itemType && _fn.itemType === itemType || !itemType)).forEach((_n) => {
          //if(itemType){ console.log(`${_n.id} matches ${itemType}`, _n); }
          // make sure any parent nodes are also expanded
          this.expandParentNodes(_n);

          // if it's a group 
          if(_n.itemType === SzResolutionStepListItemType.GROUP 
            || _n.itemType === SzResolutionStepListItemType.FINAL 
            || _n.itemType === SzResolutionStepListItemType.STACK) {
            //this.expandGroup(_n.id);
            if(!this.isGroupExpanded(id)) {
              this._expandedGroups.push(id);
              this._onGroupExpansionChange.next(id);
              // check to see if there is only one child
              // if so expand that one too
              if(_n.children && _n.children.length === 1) {                
                let childType = (_n.children[0] as SzResolutionStepNode).itemType ? (_n.children[0] as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
                let childId   = (_n.children[0] as SzResolutionStepNode).id ? (_n.children[0] as SzResolutionStepNode).id : _n.children[0].resolvedVirtualEntityId;
                this.expandNode(childId, childType);
              }
            }
          }
          // mark step as expanded
          if(_n.itemType === SzResolutionStepListItemType.STEP) {
            if(!this.isStepExpanded(id)) {
              this._expandedNodes.push(id);
              this._userHasChangedStepState.set(id, true)
              this._onStepExpansionChange.next(id);
            }
          }
        });
      }
    }
    toggleExpansion(id: string, groupId?: string, itemType?: SzResolutionStepListItemType) {
      let isExpanded = (!groupId || groupId === undefined) ? this._expandedNodes.includes(id) : (groupId ? this._expandedGroups.includes(groupId) : false);
      id = id ? id : (groupId ? groupId : undefined);
      if(!isExpanded) {
        //console.log(`\texpanding node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}`);
        this.expandNode(id, itemType);
      } else {
        //console.log(`\collapsing node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}`);
        this.collapseNode(id, itemType);
      }
    }
    private expandParentNodes(node: SzResolutionStepNode) {
      //let _group      = this._stepNodeGroups.get(id);
      let _stepNodes  = this._stepNodes;
      if(node.itemType !== SzResolutionStepListItemType.FINAL){
        // we need to start at the final node, not the child
        _stepNodes
          .filter((_s: SzResolutionStepNode) => {
            return (_s && _s.itemType === SzResolutionStepListItemType.FINAL && _s.virtualEntityIds.indexOf(node.id) > -1);
          })
          .forEach(this.expandNodesContainingChild.bind(this, node.id));
      }
      //console.log(`expandParentNodes(${node.id}):`, this._expandedGroups, _stepNodes);
    }
    public expandChildNodes(groupId, itemType?: SzResolutionStepListItemType, childNodeTypes?: SzResolutionStepListItemType[]) {
      let _stepNodes = this.getStepNodeById(groupId);
      if(_stepNodes && _stepNodes.forEach) {
        _stepNodes.filter((_fn) => (itemType && _fn.itemType === itemType || !itemType)).forEach((_n) => {
          // type match
          if(_n && _n.children && _n.children.filter) {
            _n.children.filter((_c) => { 
              return ((childNodeTypes && (_c as SzResolutionStepNode).itemType && childNodeTypes.includes((_c as SzResolutionStepNode).itemType)) || !childNodeTypes);
            }).forEach((_cn) => {
              // call expand for each child matching the type
              this.expandNode(((_cn as SzResolutionStepNode).id ? (_cn as SzResolutionStepNode).id : _cn.resolvedVirtualEntityId), ((_cn as SzResolutionStepNode).itemType ? (_cn as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP));
            });
          }
        });
      }
    }
    
    private expandNodesContainingChild(stepId: string, node: SzResolutionStepNode) {
      if(node && node.virtualEntityIds && node.virtualEntityIds.indexOf(stepId) > -1) {
        // node is a child of this node
        if(!this.isGroupExpanded(node.id)) { 
          this._expandedGroups.push(node.id); 
          //console.log(`\t\tadded "${node.id} to [${this._expandedGroups.join(',')}]"`);
        }
        // check the children recursively
        if(node.children && node.children.forEach) {
          node.children.forEach(this.expandNodesContainingChild.bind(this, stepId));
        }
      } else {
        //console.warn(`\t\t"${stepId} not found in [${ node && node.virtualEntityIds ? node.virtualEntityIds.join(',') : ''}]"`);
      }
    }

    public getStepNodeById(id: string, debug?: boolean): SzResolutionStepNode[] {
      let _stepNodes  = this._stepNodes;
      let _retVal;
      if(!_stepNodes || (_stepNodes && _stepNodes.length <= 0)) { return undefined; }
      _stepNodes
      .filter((_s: SzResolutionStepNode) => {
        return (_s && _s.itemType === SzResolutionStepListItemType.FINAL && _s.virtualEntityIds.indexOf(id) > -1);
      }).forEach((_s) => {
        let _indirectChildren = this.getChildrenContainingNode(id, _s).flat(100);
        if(_indirectChildren) { 
          if(!_retVal) { _retVal = []; } 
          _retVal = _retVal.concat(_indirectChildren);
        }
      })
      //console.warn(`getStepNodeById(${id}): `,_retVal);
      return _retVal;
    }

    getChildrenContainingNode(id: string, node: SzResolutionStepNode): Array<SzResolutionStep | SzResolutionStepNode> {
      let retVal: Array<SzResolutionStep | SzResolutionStepNode> = [];

      if(node && node.id === id){
        retVal.push((node as SzResolutionStepNode));
      }
      if(node && node.children) {
        let _childrenContaining = node.children.map(
          this.getChildrenContainingNode.bind(
            this,
            id
          )
        );

        retVal = retVal.concat(_childrenContaining);
        //console.log(`${indt}appended matching children to return value: `, retVal);
      }
      return retVal;
    }
    public getRootNodeContainingNode(childNodeId: string): SzResolutionStepNode {
      if(this._stepNodes) {
        return this._stepNodes.find((_rn) => {
          return _rn.virtualEntityIds.includes(childNodeId);
        })
      }
      return undefined;
    }
    private getParentsContainingNode(childNodeId: string, startingNode?: SzResolutionStepNode): SzResolutionStepNode[] {
      let retVal: Array<SzResolutionStepNode> = [];
      startingNode = startingNode ? startingNode : this.getRootNodeContainingNode(childNodeId); // change this to pull root final node when undefined

      if(startingNode && startingNode.virtualEntityIds && startingNode.virtualEntityIds.includes(childNodeId)){
        // child node is present in tree
        // limit to direct descendents
        if(startingNode && startingNode.children && startingNode.children.some) {
          //has direct descendent
          let _dd = startingNode.children.some((_n) => {
            return (_n as SzResolutionStepNode).id === childNodeId || _n.resolvedVirtualEntityId === childNodeId
          });
          if(_dd) {
            retVal.push((startingNode as SzResolutionStepNode));
          }
        }
      }
      if(startingNode && startingNode.children) {
        // we only need to subscan groups since items that are
        // not groups are handled by the previous logic block
        let _childrenContaining = startingNode.children
        .filter((_cn) => { return (_cn as SzResolutionStepNode).itemType && (_cn as SzResolutionStepNode).itemType !== SzResolutionStepListItemType.STEP})
        .map(
          this.getParentsContainingNode.bind(
            this,
            childNodeId
          )
        ).map((_pn) => _pn as SzResolutionStepNode).flat();
        retVal = retVal.concat(_childrenContaining);
      }
      return retVal;
    }
    public getParentContainingNode(childNodeId: string): SzResolutionStepNode {
      let _retValArr = this.getParentsContainingNode(childNodeId);
      if(_retValArr) {
        if(_retValArr.length > 1) {
          console.warn(`more than one node is parent of child!`);
          // take ... first I guess??
          return _retValArr[0];
        } else if(_retValArr.length === 1) {
          // only one item in array, pop
          return _retValArr[0];
        }
      }
      return undefined;
    }

    public collapseAll(idsToExclude?: string | string[], emitEvent?: boolean) {
      let _stepIdsLeft           = [];
      let _groupIdsLeft          = [];

      if(idsToExclude) {
        _stepIdsLeft           = this._expandedNodes.filter((gId: string) => {
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
      this._expandedNodes   = _stepIdsLeft;
      this._expandedGroups  = _groupIdsLeft;
      if(emitEvent !== false) {
        this._onStepExpansionChange.next(undefined);
        this._onGroupExpansionChange.next(undefined);
      }
    }

    public static getVirtualEntityIdsForNode(isNested: boolean, step: SzResolutionStepNode) {
      let retVal: string[] = [];

      if(isNested) {
        // this is already a sub-child make sure id is in return value
        retVal.push(step.id ? step.id : step.resolvedVirtualEntityId);
      }
      if(step && step.children && step.children.map) {
        retVal = retVal.concat(step.children.map(this.getVirtualEntityIdsForNode.bind(this, true)));
        if(retVal && retVal.flat){ retVal = retVal.flat(); }
      }
      return retVal = Array.from(new Set(retVal)); // de-dupe any values
    }
    public static setVirtualEntityIdsForNode(isNested: boolean, step: SzResolutionStepNode) {
      let retVal: string[] = [];
      if(isNested) {
        // this is already a sub-child make sure id is in return value
        retVal.push(step.id ? step.id : step.resolvedVirtualEntityId);
      }
      if(step && step.children && step.children.map) {
        retVal = retVal.concat(
          step.children.map(this.setVirtualEntityIdsForNode.bind(this, true))
        );
        if(retVal && retVal.flat){ retVal = retVal.flat(); }
        step.virtualEntityIds = retVal;
      }
      retVal = Array.from(new Set(retVal)); // de-dupe any values;
      step.virtualEntityIds = retVal;

      return retVal;
    }

    public unPinStep(vId: string) {
      if(this.isStepPinned(vId)) {
        //console.log(`unPinStep: ${vId}`, this._pinnedSteps);
        this._pinnedSteps.splice(this._pinnedSteps.indexOf(vId),1);
        let parentNode = this.getParentContainingNode(vId);
        if(parentNode && parentNode.children) {
          let itemsBeforeNode: (SzResolutionStepNode | SzResolutionStep)[]          = [];
          let itemsAfterNode:  (SzResolutionStepNode | SzResolutionStep)[]          = [];
          let indexInParent = parentNode.children.findIndex((step) => {
            return (step as SzResolutionStepNode).id ? (step as SzResolutionStepNode).id === vId : step.resolvedVirtualEntityId === vId ? true : false;
          });
          let itemNode = parentNode.children && parentNode.children.length >= indexInParent && parentNode.children[indexInParent] ? parentNode.children[indexInParent] : undefined;
          if(itemNode) {
            // located node
            itemsBeforeNode     = itemsBeforeNode.concat(parentNode.children.slice(0, (indexInParent - 0)));
            if((indexInParent+1) < parentNode.children.length) { 
              itemsAfterNode      = itemsAfterNode.concat(parentNode.children.slice((indexInParent + 1))); 
            }
            let _pItem            = itemsBeforeNode && itemsBeforeNode.length > 0 ? (itemsBeforeNode[(itemsBeforeNode.length - 1)] as SzResolutionStepNode) : undefined;
            let _nItem            = itemsAfterNode  && itemsAfterNode.length  > 0 ? (itemsAfterNode[0] as SzResolutionStepNode) : undefined;
            let pItemIsStack      = _pItem ? _pItem.itemType === SzResolutionStepListItemType.STACK : false;
            let nItemIsStack      = _nItem ? _nItem.itemType === SzResolutionStepListItemType.STACK : false;
            let itemsToRemoveFromParent = [];
            /*console.log(`\t _pItem(${(indexInParent - 1)})`,_pItem, parentNode.children[(indexInParent - 1)], itemsBeforeNode[(itemsBeforeNode.length - 1)], parentNode.children.slice(0, (indexInParent - 1)), parentNode.children.slice(0, (indexInParent - 0)));
            console.log(`\t _nItem`,_nItem, parentNode.children[(indexInParent + 1)], itemsAfterNode[0], parentNode.children.slice((indexInParent + 1)));
            console.log(`\tpItemIsStack ? ${pItemIsStack}`);
            console.log(`\tnItemIsStack  ? ${nItemIsStack}`);*/

            if(pItemIsStack && nItemIsStack) {
              // merge two stacks
              _pItem.children.push(itemNode);
              _pItem.children = _pItem.children.concat(_nItem.children);
              // add items to list of item to be removed from parent
              itemsToRemoveFromParent.push(itemNode);
              itemsToRemoveFromParent = itemsToRemoveFromParent.concat(_nItem.children);
              // get rid of stack after current item
              itemsToRemoveFromParent.push(_nItem);
              //console.log(`\t\tmerged two stacks in to a single stack`);
            } else if(pItemIsStack) {
              // add current item to previous stack
              _pItem.children.push(itemNode);
              itemsToRemoveFromParent.push(itemNode);
              //console.log(`\t\tadded current item to previous stack`);
              if(_nItem && (_nItem.itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_pItem) === SzResolutionStepDisplayType.ADD)) {
                // add contiguous next items to pItem stack
                let isContiguous     = true;
                let _itemsToMove     = [];
                itemsAfterNode.forEach((_n) => {
                  // for each step that is a "ADD" step add to _childrenOfNewStack
                  let isStackableType = (_n as SzResolutionStepNode).stepType ? (_n as SzResolutionStepNode).stepType === SzResolutionStepDisplayType.ADD   : SzHowUIService.getResolutionStepCardType(_n) === SzResolutionStepDisplayType.ADD;  // if not set assume "STEP"
                  let isStep          = (_n as SzResolutionStepNode).itemType ? (_n as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP : true;  // if not set assume "STEP"
                  if(isContiguous && isStep && isStackableType) {
                    _itemsToMove.push((_n as SzResolutionStepNode));
                    //console.log(`\t\t${(_n as SzResolutionStepNode).id}|${(_n as SzResolutionStepNode).stepType} added to array: `,_itemsToMove)
                    itemsToRemoveFromParent.push(_n as SzResolutionStepNode);
                  } else {
                    //console.warn(`\t\t${(_n as SzResolutionStepNode).id}|${(_n as SzResolutionStepNode).stepType}|${isStackableType} is NOT correct type`)
                    // break
                    isContiguous = false;
                  }
                });
                _pItem.children = _pItem.children.concat(_itemsToMove);
              }
              //console.log(`\t\tadded following items to previous stack`);
            } else if(nItemIsStack) {
              // add current item to following stack
              _nItem.children = [itemNode].concat(_nItem.children);
              if(_pItem && (_pItem.itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_pItem) === SzResolutionStepDisplayType.ADD)){
                // append contiguous previous items to beggining of children
                let previousStepsToAdd      = [];
                let itemsBeforeNodeInRev    = itemsBeforeNode;
                let isContiguous            = true;
                itemsBeforeNodeInRev.reverse().forEach((_n) => {
                  // for each step that is a "ADD" step add to _childrenOfNewStack
                  if(isContiguous && (_n as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_n) === SzResolutionStepDisplayType.ADD) {
                    previousStepsToAdd.push((_n as SzResolutionStepNode));
                    itemsToRemoveFromParent.push(_n as SzResolutionStepNode);
                  } else {
                    // break
                    isContiguous = false;
                  }
                });
                // flip array back around
                itemsBeforeNodeInRev.reverse();
                _nItem.children = itemsBeforeNodeInRev.concat(_nItem.children);
              }
              itemsToRemoveFromParent.push(itemNode);
              //console.log(`\t\tadded current item to following stack`);
            } else if(_pItem && (_pItem.itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_pItem) === SzResolutionStepDisplayType.ADD)) {
              // previous item exists and is a step we can add to the current node 
              // to create a new stack
              let _childrenOfNewStack     = [];
              let itemsBeforeNodeInRev    = itemsBeforeNode;
              let isContiguous            = true;
              itemsBeforeNodeInRev.reverse().forEach((_n) => {
                // for each step that is a "ADD" step add to _childrenOfNewStack
                if(isContiguous && (_n as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_n) === SzResolutionStepDisplayType.ADD) {
                  _childrenOfNewStack.push((_n as SzResolutionStepNode));
                  itemsToRemoveFromParent.push(_n as SzResolutionStepNode);
                } else {
                  // break
                  isContiguous = false;
                }
              });
              // flip array back around
              itemsBeforeNodeInRev.reverse();
              if(nItemIsStack) {
                // add contiguous items to beginning of stack after item
                let newStepList = itemsBeforeNodeInRev;
                newStepList.push(itemNode);
                newStepList     = newStepList.concat(_nItem.children);
                _nItem.children = newStepList;
                itemsToRemoveFromParent.push(itemNode);
                // update stack in "_stepNodeGroups"
                this._stepNodeGroups.set(_nItem.id, _nItem);
                //console.log(`\tadded previous steps and current item to following stack`, newStepList);
              } else {
                // just create the new one
                // create new stack group for previous contiguous steps
                let newStack = {
                  id: uuidv4(),
                  itemType: SzResolutionStepListItemType.STACK,
                  children: itemsBeforeNodeInRev
                }
                // add current item to children
                newStack.children.push(itemNode);
                itemsToRemoveFromParent.push(itemNode);
                parentNode.children[indexInParent] = newStack;
                // update stack in "_stepNodeGroups"
                this._stepNodeGroups.set(newStack.id, newStack);
                this._expandedGroups.push(newStack.id); // by default stack should be expanded
                //console.log(`\tcreated new stack from current item and previous step`, newStack);
              }
            } else if(_nItem && (_nItem.itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_nItem) === SzResolutionStepDisplayType.ADD)) {
              // following immediate item is a type of step we can group in to a new stack
              // create new stack group for following contiguous steps
              let itemsToAdd    = [itemNode];
              let isContiguous  = true;
              if(itemsAfterNode && itemsAfterNode.forEach) {
                itemsAfterNode.forEach((_n) => {
                  // for each step that is a "ADD" step add to _childrenOfNewStack
                  if(isContiguous && (_n as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || SzHowUIService.getResolutionStepCardType(_n) === SzResolutionStepDisplayType.ADD) {
                    itemsToAdd.push((_n as SzResolutionStepNode));
                    itemsToRemoveFromParent.push(_n as SzResolutionStepNode);
                  } else {
                    // break
                    isContiguous = false;
                  }
                });
              }
              if(pItemIsStack) {
                // previous item is stack
                // just append to that
                _nItem.children = _nItem.children.concat(itemsToAdd);
                itemsToRemoveFromParent.push(itemNode);
                // update virtualIds
                _nItem.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, _nItem);
                // update stack in "_stepNodeGroups"
                this._stepNodeGroups.set(_nItem.id, _nItem);
                //console.log(`\tadded previous steps and current item to following stack`, newStepList);
              } else {
                // create new stack
                let newStack: SzResolutionStepNode = {
                  id: uuidv4(),
                  itemType: SzResolutionStepListItemType.STACK,
                  children: itemsToAdd
                }
                // update virtualIds
                newStack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, newStack);
                itemsToRemoveFromParent.push(itemNode);
                parentNode.children[indexInParent] = newStack;
                // update stack in "_stepNodeGroups"
                this._stepNodeGroups.set(newStack.id, newStack);
                this._expandedGroups.push(newStack.id); // by default stack should be expanded
              }
              //console.log(`\tnext item is a step, create a new stack or append to previous`, itemsAfterNode);
            }
            // remove any items found in "itemsToRemoveFromParent"
            if(itemsToRemoveFromParent && itemsToRemoveFromParent.length > 0) {
              let newChildren = parentNode.children.filter((_sn)=> {
                return !itemsToRemoveFromParent.some((itr) => {
                  let _mId =  itr.id ? itr.id : itr.resolvedVirtualEntityId;
                  return (_sn as SzResolutionStepNode).id ? (_sn as SzResolutionStepNode).id === _mId : _sn.resolvedVirtualEntityId === _mId;
                })
              });
              parentNode.children = newChildren
              //console.log(`\tremoved children from parent: `, newChildren, parentNode);
            }
            // update virtualEntityIds for parent
            //parentNode.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(parentNode.itemType !== SzResolutionStepListItemType.FINAL, parentNode);
            SzHowUIService.setVirtualEntityIdsForNode(parentNode.itemType !== SzResolutionStepListItemType.FINAL, parentNode);
            //console.log(`\tupdated virtualEntityIds for parent: ${parentNode.virtualEntityIds}`);
          }
        }
      }
    }

    public pinStep(vId: string, gId: string) {
      if(!this.isStepPinned(vId)) {
        this._pinnedSteps.push(vId);
        if(gId && this._stepNodeGroups && this._stepNodeGroups.has(gId)) {
          let _stack              = this.getParentContainingNode(vId);
          let _parentGroup        = this.getParentContainingNode(gId);
          //console.log(`\t_stack:`,_stack);
          //console.log(`\t_parentGroup`, _parentGroup);
          if(_stack && _parentGroup){
            // we can safely create new stacks, split by index
            let itemsBeforeNode: (SzResolutionStepNode | SzResolutionStep)[]          = [];
            let itemsAfterNode:  (SzResolutionStepNode | SzResolutionStep)[]          = [];
            let itemsToRemoveFromStack:  (SzResolutionStepNode | SzResolutionStep)[]  = [];
            let _members              = Object.assign([], _stack.children);
            let _itemIndexInStack     = _members.findIndex((step) => {
              return step.id ? step.id === vId : step.resolvedVirtualEntityId === vId ? true : false;
            });
            let _indexOfStackInParent = _parentGroup.children.findIndex((step) => {
              return (step as SzResolutionStepNode).id ? (step as SzResolutionStepNode).id === _stack.id : step.resolvedVirtualEntityId === _stack.id ? true : false;
            });
            let itemToPin             = _members[_itemIndexInStack];
            if(_itemIndexInStack > -1) { 
              //console.log(`\item index: ${_itemIndexInStack}`);
              itemsBeforeNode     = itemsBeforeNode.concat(_members.slice(0, _itemIndexInStack));
              if((_itemIndexInStack+1) < _members.length) { 
                itemsAfterNode    = itemsAfterNode.concat(_members.slice(_itemIndexInStack+1)); 
              }

              // move current item to "after" the stack
              if(_indexOfStackInParent > -1) {
                itemToPin = Object.assign({
                  id: (itemToPin as SzResolutionStepNode).id ? (itemToPin as SzResolutionStepNode).id : itemToPin.resolvedVirtualEntityId,
                  itemType: (itemToPin as SzResolutionStepNode).itemType ? (itemToPin as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP,
                  stepType: (itemToPin as SzResolutionStepNode).stepType ? (itemToPin as SzResolutionStepNode).stepType : SzHowUIService.getResolutionStepCardType(itemToPin)
                }, itemToPin);
                _parentGroup.children.splice(_indexOfStackInParent+1, 0, itemToPin);
                itemsToRemoveFromStack.push(itemToPin);
              }

              // if there are at least two members after the member being
              // pinned we are making a new group with those steps
              // in them
              if(itemsAfterNode.length >= 1) {
                // extend any items with the proper metadata
                itemsAfterNode = itemsAfterNode.map((_an) => {
                  return Object.assign({
                    id: (_an as SzResolutionStepNode).id ? (_an as SzResolutionStepNode).id : _an.resolvedVirtualEntityId,
                    itemType: (_an as SzResolutionStepNode).itemType ? (_an as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP,
                    stepType: (_an as SzResolutionStepNode).stepType ? (_an as SzResolutionStepNode).stepType : SzHowUIService.getResolutionStepCardType(itemToPin)
                  }, _an);
                });
                itemsToRemoveFromStack  = itemsToRemoveFromStack.concat(itemsAfterNode);
                // if there are at least two members after the member being
                // pinned we are making a new group with those steps
                // in them
                if(itemsAfterNode.length >= 2) {
                  // 5M000SSHHH 1T!
                  let _newStack = Object.assign({
                    id: uuidv4(),
                    itemType: SzResolutionStepListItemType.STACK,
                    children: itemsAfterNode
                  });
                  // 5M00000SSHHH 1T G00D
                  _newStack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(true, _newStack);
                  this._stepNodeGroups.set(_newStack.id, _newStack);
                  this._expandedGroups.push(_newStack.id); // by default stack should be expanded
                  // 5M00000SSHHH 1T R33AL G00D!
                  itemsToRemoveFromStack  = itemsToRemoveFromStack.concat(itemsAfterNode);
                  itemsAfterNode          = [_newStack];
                }
                // now add to parent group
                _parentGroup.children = [
                  ..._parentGroup.children.slice(0, (_indexOfStackInParent+2)),
                  ...itemsAfterNode,
                  ..._parentGroup.children.slice((_indexOfStackInParent+2))
                ];
                //console.log(`\tnew parent node children: `, _newParentChildList);
              }

              // remove any items from stack that have been moved
              if(itemsToRemoveFromStack && itemsToRemoveFromStack.length > 0) {
                let idsOfItemsToRemove = itemsToRemoveFromStack.map((_nr) => {
                  return (_nr as SzResolutionStepNode).id ? (_nr as SzResolutionStepNode).id : _nr.resolvedVirtualEntityId;
                });
                _stack.children = _stack.children.filter((_nr) => {
                  return !idsOfItemsToRemove.includes(((_nr as SzResolutionStepNode).id ? (_nr as SzResolutionStepNode).id : _nr.resolvedVirtualEntityId));
                });
                // if there is less than 2 items left in stack
                // convert from stack to single item
                if(_stack && _stack.children && _stack.children.length <= 1) {

                  _parentGroup.children = [
                    ..._parentGroup.children.slice(0, _indexOfStackInParent),
                    ..._stack.children.map((_step) => {
                      return Object.assign({
                        id: (_step as SzResolutionStepNode).id ? (_step as SzResolutionStepNode).id : _step.resolvedVirtualEntityId,
                        itemType: (_step as SzResolutionStepNode).itemType ? (_step as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP,
                        stepType: (_step as SzResolutionStepNode).stepType ? (_step as SzResolutionStepNode).stepType : SzHowUIService.getResolutionStepCardType(_step)
                      }, _step);
                    }),
                    ..._parentGroup.children.slice(_indexOfStackInParent+1)
                  ];
                  if(this._stepNodeGroups.has(_stack.id)) { this._stepNodeGroups.delete(_stack.id); }
                }
                // update virtualIds
                _stack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(true, _stack);
                // update stack in "_stepNodeGroups"
                if(this._stepNodeGroups.has(_stack.id)) {
                  this._stepNodeGroups.set(_stack.id, _stack);
                }
                //console.log(`removed items from stack ${_stack.id}`, _stack);
              }

              // update parent nodes virtual ids
              if(_parentGroup) {
                _parentGroup.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, _parentGroup);
              }
              /*console.log(`\tindex of stack in parent: ${_indexOfStackInParent}`);
              console.log(`\titems before node: `, itemsBeforeNode);
              console.log(`\titems after node: `, itemsAfterNode);*/
            }
          }
         } else {
          console.warn(`could not locate gId(${gId}) in stepsGroup: `, this._stepNodeGroups);
        }
      } else {
        //console.warn(`step already pinned: ${vId}`);
      }
    }

    public stepCanBeUnPinned(vId: string, debug?: boolean): boolean {
      let retVal = false;
      let parentNode = this.getParentContainingNode(vId);
      if(parentNode && parentNode.children) {
        let itemsBeforeNode: (SzResolutionStepNode | SzResolutionStep)[]          = [];
        let itemsAfterNode:  (SzResolutionStepNode | SzResolutionStep)[]          = [];
        let indexInParent = parentNode.children.findIndex((step) => {
          return (step as SzResolutionStepNode).id ? (step as SzResolutionStepNode).id === vId : step.resolvedVirtualEntityId === vId ? true : false;
        });
        let itemNode = parentNode.children && parentNode.children.length >= indexInParent && parentNode.children[indexInParent] ? parentNode.children[indexInParent] : undefined;
        if(itemNode) {
          // located node
          itemsBeforeNode     = itemsBeforeNode.concat(parentNode.children.slice(0, indexInParent));
          if((indexInParent + 1) < parentNode.children.length) { 
            itemsAfterNode    = itemsAfterNode.concat(parentNode.children.slice(indexInParent + 1)); 
          }
          if(debug) {
            console.log(`stepCanBeUnPinned: `, itemsBeforeNode, itemsAfterNode);
          }
          // if either the item before or after is a step card
          // OR
          // the item before or after is a stepGroup then the
          // item can be unpinned
          if(itemsBeforeNode && itemsBeforeNode.length > 0 && itemsBeforeNode[(itemsBeforeNode.length - 1)]) {
            // is previous item a step or stack group AND
            // not an interim or merge step
            retVal = (
              (itemsBeforeNode[(itemsBeforeNode.length - 1)] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || 
              (itemsBeforeNode[(itemsBeforeNode.length - 1)] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK) ? true : false;
          }
          if(!retVal && itemsAfterNode && itemsAfterNode.length > 0 && itemsAfterNode[0]) {
            // is next item a step or stack group AND
            // not an interim or merge step
            retVal = (
              (itemsAfterNode[0] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || 
              (itemsAfterNode[0] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK) ? true : false;
          }
        } else {
          console.warn(`\tcould not find itemNode!! `, parentNode, parentNode.children[indexInParent]);
        }
      } else if(debug) {
        console.warn(`stepCanBeUnPinned(${vId}): parentNode has no children `, parentNode);
      }
      return retVal;
    }

    public get stepGroupStacks(): SzResolutionStepNode[] {
      let retVal;
      let _groupsAsArray  = Array.from(this._stepNodeGroups.values());
      if(_groupsAsArray && _groupsAsArray.filter) {
        retVal = _groupsAsArray.filter((_val: SzResolutionStepNode)=>{
          return _val.itemType === SzResolutionStepListItemType.STACK;
        });
      }
      return retVal;
    }

    public isStepMemberOfStack(vId: string, gId?: string) {
      if(vId) {
        if(gId) {
          // we are looking in a specific group
          let _groupSpecified = this._stepNodeGroups.has(gId) ? this._stepNodeGroups.get(gId) : undefined;
          //console.log(`isStepMemberOfStack(${vId}, ${gId})`, _groupSpecified, ((_groupSpecified && _groupSpecified.virtualEntityIds) ? _groupSpecified.virtualEntityIds.indexOf(vId) > -1 : false), this._stepNodeGroups);
          if(_groupSpecified) {
            // group exists
            if(_groupSpecified && _groupSpecified.virtualEntityIds) {
              return _groupSpecified.virtualEntityIds.indexOf(vId) > -1 ? true : false;
            }
          }
        } else {
          // check all groups
          let _stackGroups = this.stepGroupStacks;
          if(_stackGroups && _stackGroups.length > 0) {
            let _memberInGroup = _stackGroups.find((grp: SzResolutionStepNode) => {
              return grp.virtualEntityIds.indexOf(vId) > -1 ? true : false;
            });
            if(_memberInGroup) {
              return true;
            }
          }
        }
      }
      return false;
    }

    public isStepPinned(vId: string, gId?: string): boolean {
      return this._pinnedSteps.includes(vId);
    }

    public selectStep(vId: string) {
      // clear out any other selected
      this.collapseAll(undefined, false);
      // expand node
      this.expandNode(vId);
      return;
    }

    public static getResolutionStepListItemType(item: SzResolutionStep | SzResolutionStepNode): SzResolutionStepListItemType {
      if(item && item !== undefined) {
        let itemIsGroup   = (item as SzResolutionStepNode).virtualEntityIds && (item as SzResolutionStepNode).itemType ===  SzResolutionStepListItemType.GROUP ? true : false;
        let itemsIsStack  = (item as SzResolutionStepNode).virtualEntityIds && (item as SzResolutionStepNode).itemType ===  SzResolutionStepListItemType.STACK && !itemIsGroup ? true : false;
        
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
        if(step.candidateVirtualEntity && step.candidateVirtualEntity.singleton && step.inboundVirtualEntity && step.inboundVirtualEntity.singleton) {
          // both items are records
          return SzResolutionStepDisplayType.CREATE;
        } else if(step.candidateVirtualEntity && !step.candidateVirtualEntity.singleton && step.inboundVirtualEntity && !step.inboundVirtualEntity.singleton) {
          // both items are virtual entities
          return SzResolutionStepDisplayType.MERGE;
        } else if(!(step.candidateVirtualEntity && step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && ((step.candidateVirtualEntity && step.candidateVirtualEntity.singleton === false) || (step.inboundVirtualEntity && step.inboundVirtualEntity.singleton === false))) {
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