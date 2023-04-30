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
      console.log(`expandNode(${id}, ${itemType})`, _stepNodes, this._stepNodes);
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
        console.log(`\texpanding node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}`);
        this.expandNode(id, itemType);
      } else {
        console.log(`\collapsing node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}`);
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
        /*
        //console.log(`checking children of "${_s.id}"`, _s);
        _retVal = (_s.id === id) ? [_s] : _retVal;
        // we already know that this root level entity contains the child node, search them
        // is the child a direct desc
        let _directChild = _s.children.find((_c) => { 
          return (_c as SzResolutionStepNode).id === id || (_c as SzResolutionStep).resolvedVirtualEntityId === id; 
        });
        
        if(_directChild) { 
          if(!_retVal) { _retVal = []; } 
          _retVal.push(_directChild);
          console.log(`\t item is DIRECT child..`, _directChild, _s);
          // double check that there are no nodes with the same id's that are children (groups of iterim entities have same id as child step)
          let _indirectChildren = this.getChildrenContainingNode(2, id, _s).flat(100);
        } else {
          // must be in a descendant
          let _indirectChildren = this.getChildrenContainingNode(2, id, _s).flat(100);
          //console.log(`\t item is indirect child..`, _indirectChildren, _s);
          if(_indirectChildren) { 
            if(!_retVal) { _retVal = []; } 
            _retVal = _retVal.concat(_indirectChildren);
          }
        }
        */
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
    private getRootNodeContainingNode(childNodeId: string): SzResolutionStepNode {
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
    private getParentContainingNode(childNodeId: string): SzResolutionStepNode {
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
    /*
    getChildContainingNode(lvl: number, id: string, node: SzResolutionStepNode): SzResolutionStep | SzResolutionStepNode {
      let indt = (new Array(lvl)).join('\t');
      if(node && node.id === id){ 
        //console.warn(`${indt}found it! ${node.id}==${id}`, node);
        return node; 
      } else {
        //console.log(`${indt}${node.id} is not the node(${id}), must be in child...`);
      }
      if(node && node.virtualEntityIds && node.virtualEntityIds.indexOf(id) > -1) {
        // node is actually in a child node
        let retVal = node.children.find(this.getChildContainingNode.bind(this, (lvl+1), id));
        if(retVal){ 
          //console.log(`${indt}node in child: `, retVal);
          return retVal;
        }
      }
      return undefined;
    }*/


    /*
    toggleExpansions(id: string, groupId?: string, finalEntityId?: string) {
      id = id ? id : (groupId ? groupId : undefined);
      if(!id && !finalEntityId) {
        console.warn('toggleExpansion: no id passed to method');
        return;
      }
      //let isExpanded = (!groupId) ? this._expandedStepsOrGroups.includes(id) : this._expandedGroups.includes(groupId);
      let isExpanded = (finalEntityId) ? this._expandedFinalEntities.includes(finalEntityId) : 
      (!groupId) ? this._expandedNodes.includes(id) : this._expandedGroups.includes(groupId);

      if(!isExpanded) {
        if(finalEntityId) {
          console.log(`\texpand final`);
          this.expandFinal(finalEntityId);
        } else if(!groupId) {
          console.log(`\texpand step`);
          this.expand(id);
        } else {
          console.log(`\texpand group ${id}`);
          this.expandGroup(id);
        }
      } else {
        if(finalEntityId) {
          console.log(`\collapse final ${finalEntityId}`);
          this.collapseFinal(finalEntityId);
        } else if(!groupId) {
          console.log(`\tcollapse step`);
          this.collapse(id);
        } else {
          console.log(`\tcollapse groups`);
          this.collapseGroup(id);
        }
      }
    }*/

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

    public pinStep(vId: string, gId: string) {
      if(!this.isStepPinned(vId)) {
        this._pinnedSteps.push(vId);
        if(gId && this._stepNodeGroups && this._stepNodeGroups.has(gId)) {
          let _stack              = this.getParentContainingNode(vId);
          let _parentGroup        = this.getParentContainingNode(gId);
          //let _members            = Object.assign([], _stack.children);
          //let _itemIndex          = _members.findIndex((step) => {
          //  return step.resolvedVirtualEntityId === vId ? true : false;
          //});
          console.log(`\t_stack:`,_stack);
          console.log(`\t_parentGroup`, _parentGroup);
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
              console.log(`\item index: ${_itemIndexInStack}`);
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
                    children: itemsAfterNode,
                  });
                  // 5M00000SSHHH 1T G00D
                  _newStack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(true, _newStack);
                  this._stepNodeGroups.set(_newStack.id, _newStack);
                  // 5M00000SSHHH 1T R33AL G00D!
                  itemsToRemoveFromStack  = itemsToRemoveFromStack.concat(itemsAfterNode);
                  itemsAfterNode          = [_newStack];
                }
                // now add to parent group
                let _newParentChildList = _parentGroup.children = [
                  ..._parentGroup.children.slice(0, (_indexOfStackInParent+2)),
                  ...itemsAfterNode,
                  ..._parentGroup.children.slice((_indexOfStackInParent+2))
                ];
                console.log(`\tnew parent node children: `, _newParentChildList);
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
                console.log(`removed items from stack ${_stack.id}`, _stack);
              }

              // update parent nodes virtual ids
              if(_parentGroup) {
                _parentGroup.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, _parentGroup);
              }

              /*
              if((_members.length - _itemIndexInStack) >= 1) {
                if(insertBeforeGroup.length > 0) {
                  // grab any items previous to step and add those too
                } else if(insertAfterGroup.length > 0) {
                  // grab any items after step being moved and add those too
                  // this is every scenario EXCEPT when step is first item in group
                  let _itemsToMove  = _members.splice(_itemIndexInStack, (_members.length - _itemIndexInStack));
                  
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
              }*/
              console.log(`\tindex of stack in parent: ${_indexOfStackInParent}`);
              console.log(`\titems before node: `, itemsBeforeNode);
              console.log(`\titems after node: `, itemsAfterNode);
              
              /*let _newStepList = [];
              if(_stack) {
                let _newStackItems = [];

                // remove any items in "insertBeforeGroup" from "resolutionSteps"
                let membersToKeep = _stack.children.filter((_s)=> {
                  return insertBeforeGroup.some((grp) => {
                    return (grp as SzResolutionStep).resolvedVirtualEntityId !== _s.resolvedVirtualEntityId;
                  })
                });
                // update stack list to NOT include items being moved to new group
                // that is BEFORE item being pinned
                _newStackItems = membersToKeep;
              }*/
              
              //console.log(`\tmoved items to group before step being pinned: `, itemsBeforeNode, _newStepList);
            }
          }
         } else {
          console.warn(`could not locate gId(${gId}) in stepsGroup: `, this._stepNodeGroups);
        }
      } else {
        console.warn(`step already pinned: ${vId}`);
      }
    }

    public pinStep1(vId: string, gId: string) {
      if(!this.isStepPinned(vId)) {
        this._pinnedSteps.push(vId);
        console.log(`pinStep(${vId}, ${gId})`);
        // find index of step in group members
        if(gId && this._stepNodeGroups && this._stepNodeGroups.has(gId)) {
          let _group              = this._stepNodeGroups.get(gId);
          let _groupIndexInList   = this._stepNodes.findIndex((s)=>{ return s.id === gId; });
          let _members            = Object.assign([], _group.children);
          let _itemIndex          = _members.findIndex((step) => {
            return step.resolvedVirtualEntityId === vId ? true : false;
          }); 
          let insertBeforeGroup: Array<SzResolutionStepGroup | SzResolutionStep[]> = [];
          let insertAfterGroup: Array<SzResolutionStepGroup | SzResolutionStep[]>  = [];
          console.log(`\thas gId: ${this._stepNodeGroups.has(gId)}`,this._stepNodeGroups);
          if(_itemIndex > -1) {
            let _indexOfGroupInList = this._stepNodes.findIndex((item: SzResolutionStepNode) => {
              return item.id === _group.id;
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
              this._stepNodes.forEach((step, _ind) => {
                let _cStep = step;

                if(_ind === _groupIndexInList) {
                  // remove existing steps from current step
                  let _cStep = (step as SzResolutionStepGroup);
                  
                  // before we add the step we should add preceeeding
                  // steps
                  _newStepList = _newStepList.concat(insertBeforeGroup);
                }
                if(_cStep && _cStep.children) {
                  if(_cStep.children && insertBeforeGroup) {
                    // remove any items in "insertBeforeGroup" from "resolutionSteps"
                    let membersToKeep = _cStep.children.filter((_s)=> {
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
                isStackGroup: true,
                resolutionSteps: (_membersOfNewGroup as SzResolutionStep[]),
                virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                  return (rStep as SzResolutionStep).resolvedVirtualEntityId; 
                })
              };
              insertAfterGroup.push(_newGroup);
              // update 
              if(!this._stepNodeGroups.has(_newGroup.id)) {
                this._stepNodeGroups.set(_newGroup.id, _newGroup);
              }
              console.log(`\treplaced individual items in after list with group: `, insertAfterGroup);
            }
            if(insertAfterGroup.length > 0) {
              // straight insert at index after group in _stepList
              let _foundIndex = false;
              this._stepNodes.forEach((step, _ind) => {
                // copy over item
                _newStepList.push(step);
                if(_ind === _groupIndexInList) {
                  // this is the one
                  _foundIndex = true;
                  // update the members for this group
                  step.children = _members;
                  console.log(`\t\tupdated resolution steps for #${step.id}`, step.children);
                  // now insert new group(s)
                  _newStepList = _newStepList.concat(insertAfterGroup);
                  console.log(`\t\tinserted new steps for #${step.id}`, insertAfterGroup, _newStepList);
                }

              });
              if(!_foundIndex) {
                let _group2IndexInList   = this._stepNodes.findIndex((s)=>{ 
                  return s.id === gId; 
                });
                console.warn(`never found item(#${gId}|${_groupIndexInList}|${_group2IndexInList}) in list??? `, _groupIndexInList, this._stepNodes, gId, this._stepNodeGroups);
              }
              //console.log(`new step list: `,_newStepList, this._stepsList, insertBeforeGroup);
              //this._stepsList = _newStepList;
            } 

            // insert any new groups
            let allGroupsAdded = insertBeforeGroup.concat(insertAfterGroup).filter((grpOrStp) => {
              return (grpOrStp as SzResolutionStepGroup).virtualEntityIds !== undefined; // filter out any items that aren't specifically "groups"
            });
            (allGroupsAdded as SzResolutionStepGroup[]).forEach((stepGroup) => {
              this._stepNodeGroups.set(stepGroup.id, stepGroup);
            });

            // update any existing groups
            if(this._stepNodeGroups.has(gId)) {
              _group.children = _members;
              this._stepNodeGroups.set(gId, _group);
              if(_group.children && _group.children.length === 1) {
                // remove step from group and delete group
                let _indexInNewList = _newStepList.findIndex((item) => {
                  if((item as SzResolutionStepGroup).id === _group.id) {
                    return true;
                  }
                  return false;
                });
                if(_indexInNewList > -1 && _newStepList[_indexInNewList] && _group && _group.children && _group.children[0]) {
                  //console.warn(`\tmove item to same spot as group in _newStepList: `, _newStepList[_indexInNewList], _group.resolutionSteps[0]);
                  _newStepList[_indexInNewList] = _group.children[0];
                  // now remove old group from stepGroups
                  this._stepNodeGroups.delete(_group.id);
                }
              }
            }

            // update step list
            console.log(`new step list: `,_newStepList, this._stepNodes, insertBeforeGroup);
            this._stepNodes = _newStepList;
          } 

        } else {
          console.warn(`could not locate gId(${gId}) in stepsGroup: `, this._stepNodeGroups);
        }

      } else {
        console.warn(`step already pinned: ${vId}`);
      }
    }

    public unPinStep(vId: string) {
      if(this.isStepPinned(vId)) {
        console.log(`unPinStep: ${vId}`, this._pinnedSteps);
        // this step is pinned
        let _previousItem: SzResolutionStepNode;
        let _nextItem: SzResolutionStepNode;
        let _stepIndex: number;
        let _stepToMove: SzResolutionStepNode;
        let _groupToMoveTo: SzResolutionStepNode;
        let _stepMovedToGroup: string;

        this._stepNodes.forEach((s, ind)=>{ 
          if(s.resolvedVirtualEntityId === vId) {
            _stepIndex  = ind;
            _stepToMove = s;
            if(ind > 0 && this._stepNodes[(ind - 1)]) {
              _previousItem = this._stepNodes[(ind - 1)];
            }
            if(this._stepNodes.length >= (ind + 1) && this._stepNodes[(ind + 1)]) {
              _nextItem = this._stepNodes[(ind + 1)]
            }
          }
        });
        // if previous item is either a step or a stack group we're going to add this step to that
        if(_previousItem) {
          let isStep  = _previousItem.itemType === SzResolutionStepListItemType.STEP  ? true : false;
          let isStack = _previousItem.itemType === SzResolutionStepListItemType.STACK ? true : false;
          if(isStack) {
            let _stackGroupToAddStepTo = _previousItem;
            _stepMovedToGroup = _stackGroupToAddStepTo.id;
            console.log(`previous item is a stack, add step to stack group`, _stackGroupToAddStepTo);

            if(_stackGroupToAddStepTo.children && _stackGroupToAddStepTo.children.push) {
              // add step to end
              _stackGroupToAddStepTo.children.push(_stepToMove);
              _stackGroupToAddStepTo.virtualEntityIds.push(_stepToMove.resolvedVirtualEntityId);
              // remove step from "stepsList"
              if(_stepToMove && _stepIndex && this._stepNodes[_stepIndex] && _stepToMove && this._stepNodes[_stepIndex].resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                this._stepNodes.splice(_stepIndex, 1);
              }
              // update "stepGroup" in "_stepGroups" with updated members/virtualIds
            }
          } else if(isStep) {
            console.log(`previous item is a step, create new group`);
            let _membersOfNewGroup = [_previousItem, _stepToMove];
            _groupToMoveTo     = {
              id: uuidv4(),
              itemType: SzResolutionStepListItemType.STACK,
              children: _membersOfNewGroup,
              virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                return (rStep as SzResolutionStep).resolvedVirtualEntityId; 
              })
            };
            _stepMovedToGroup = _groupToMoveTo.id;
            this._stepNodes[(_stepIndex -1)] = _groupToMoveTo;
            // update "stepGroups"
            this._stepNodeGroups.set(_groupToMoveTo.id, _groupToMoveTo);
            // remove original step from list
            this._stepNodes = this._stepNodes.filter((item) => {
              if((item as SzResolutionStep).resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                return false;
              }
              return true;
            });
          }
        }
        if(_nextItem) {
          let isStep                = _nextItem.itemType === SzResolutionStepListItemType.STEP  ? true : false;
          let isStack               = _nextItem.itemType === SzResolutionStepListItemType.STACK ? true : false;
          let _nextItemIsNotPinned  = isStep ? this.isStepPinned(_nextItem.resolvedVirtualEntityId) : true;

          if(isStep && _nextItemIsNotPinned) {
            // next item is a un-pinned step
            if(_stepMovedToGroup) {
              // use the group the other item was moved to
            } else {
              // create new group here
              console.log(`next item is a step item. `, _nextItem);
              let _membersOfNewGroup = [_stepToMove];
              _groupToMoveTo     = {
                id: uuidv4(),
                itemType: SzResolutionStepListItemType.STACK,
                children: _membersOfNewGroup,
                virtualEntityIds: _membersOfNewGroup.map((rStep) => { 
                  return rStep.resolvedVirtualEntityId; 
                })
              };
              _stepMovedToGroup = _groupToMoveTo.id;
              this._stepNodes[_stepIndex] = _groupToMoveTo;
              // update "stepGroups"
              this._stepNodeGroups.set(_groupToMoveTo.id, _groupToMoveTo);
              // remove original step from list
              this._stepNodes = this._stepNodes.filter((item) => {
                if(item.resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
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
              let targetStack = _nextItem;
              console.log(`\t\tmoving step to stack after item`, targetStack);
              let _nStepChildren: Array<SzResolutionStepNode | SzResolutionStep> = [_stepToMove];
              targetStack.children          = _nStepChildren.concat(targetStack.children)
              targetStack.virtualEntityIds  = targetStack.children.map((item: SzResolutionStep) => {
                return item.resolvedVirtualEntityId;
              });
              // now remove "_stepToMove" from stepsList
              console.log(`\t\tstep moved to new group`, targetStack, this._stepNodeGroups.get(targetStack.id));
              this._stepNodes = this._stepNodes.filter((item) => {
                if(item.resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                  return false;
                }
                return true;
              });
            }
          } else if(_stepMovedToGroup) {
            let targetStack     = this._stepNodes.find((s) => {
              return s.id === _stepMovedToGroup;
            });

            // we moved the item to a group
            if(isStack) {
              console.log(`\tnext item is a stack item. move stack item(s) to other stack`, (_nextItem as SzResolutionStep));

              // merge the two stacks
              // copy items from nextStack to previous stack
              let stackToMove       = _nextItem;

              if(stackToMove && stackToMove.children && targetStack && targetStack.children) {
                // copy all items from nextStack to prevStack
                let itemsToMerge = stackToMove.children;
                targetStack.children = targetStack.children.concat(itemsToMerge);
                // de-dupe jic
              }
              //_previousItem.resolutionSteps = _nextItem.resolutionSteps;
              targetStack.virtualEntityIds = targetStack.children.map((item: SzResolutionStep) => {
                return item.resolvedVirtualEntityId;
              });
              // now remove "stackToMove" from stepsList
              this._stepNodes = this._stepNodes.filter((item) => {
                // omit step that was moved
                if(item .resolvedVirtualEntityId === _stepToMove.resolvedVirtualEntityId) {
                  return false;
                }
                // omit stack that was merged
                if(item.id === stackToMove.id) {
                  return false;
                }
                return true;
              });
              // now remove "stackToMove.id" from "stepGroups"
              if(this._stepNodeGroups.has(stackToMove.id)) {
                this._stepNodeGroups.delete(stackToMove.id);
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
          if((indexInParent+1) < parentNode.children.length) { 
            itemsAfterNode    = itemsAfterNode.concat(parentNode.children.slice(indexInParent+1)); 
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
          if(!retVal && itemsAfterNode && itemsAfterNode.length > 0 && itemsAfterNode[(itemsAfterNode.length - 1)]) {
            // is next item a step or stack group AND
            // not an interim or merge step
            retVal = (
              (itemsAfterNode[(itemsAfterNode.length - 1)] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || 
              (itemsAfterNode[(itemsAfterNode.length - 1)] as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK) ? true : false;
          }
        }
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

    /*public isNodeMemberOfGroup(vId: string, gId?: string) {
      return false;
    }*/

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

    /*public static getGroupForMemberStep(step: SzResolutionStep | string, groups: Map<string, SzResolutionStepNode>): SzResolutionStepNode {
      let _retVal: SzResolutionStepNode;
      if(groups && step) {
        let _idToLookFor = ((step as SzResolutionStep).resolvedVirtualEntityId) ? (step as SzResolutionStep).resolvedVirtualEntityId : (step as string);
        let _sk = false;
        groups.forEach((groupToSearch: SzResolutionStepNode, key: string) => {
          if(!_sk && groupToSearch.virtualEntityIds && groupToSearch.virtualEntityIds.indexOf(_idToLookFor) > -1 || groupToSearch.id === _idToLookFor) {
            _retVal = groupToSearch;
          }
        });
      }
      return _retVal;
    }*/

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