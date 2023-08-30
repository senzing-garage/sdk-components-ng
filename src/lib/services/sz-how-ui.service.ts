import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { v4 as uuidv4} from 'uuid';
import {
  EntityDataService as SzEntityDataService,
  SzEntityIdentifier,
  SzResolutionStep,
  SzHowEntityResponse
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzPrefsService } from './sz-prefs.service';
import { SzResolutionStepDisplayType, SzResolutionStepListItemType, SzResolutionStepNode } from '../models/data-how';

/**
 * Provides methods, eventing, and utilities used to display the 
 * result of a "How" operation. A "How" report displays all the steps 
 * that were taken to resolve multiple input streams to a single entity.
 * 
 * @export
 */
@Injectable({
    providedIn: 'root'
})
export class SzHowUIService {
  /** @internal */
  private static _entityDataService: SzEntityDataService;
  /** @internal */
  private _expandedNodes: string[]            = [];
  /** @internal */
  private _expandedGroups: string[]           = [];
  /** @internal */
  private _navigationExpanded: boolean        = true;
  /** @internal */
  private _pinnedSteps: string[]              = [];
  /** @internal */
  private _orderedFeatureTypes: string[] | undefined;
  /** @internal */
  private _onGroupExpansionChange   = new Subject<string>()
  /** @internal */
  private _onStepExpansionChange    = new Subject<string>();
  /** @internal */
  private _stepNodeGroups: Map<string, SzResolutionStepNode>  = new Map<string, SzResolutionStepNode>();
  /** @internal */
  private _stepNodes: Array<SzResolutionStepNode>;
  /** @internal */
  private _userHasChangedStepState  = new Map<string, boolean>();
  /** when a group is expanded or collapsed this observeable emits the id of the group that was changed */
  public onGroupExpansionChange     = this._onGroupExpansionChange.asObservable();
  /** when a group is expanded or collapsed this observeable emits the id of the group that was changed */
  public onStepExpansionChange      = this._onStepExpansionChange.asObservable();
  /** 
   * An array of all the groups currently expanded.
   * Groups include "Interim Entities" than can have children,
   * Stacks of multiple "Add Record" Operations and "Final Entity" nodes
   */
  public get expandedGroups() {
    return this._expandedGroups;
  }
  /** 
   * An array of all step cards currently expanded.
   * Cards can all be collapsed and are often children of 
   * Group nodes.
   */
  public get expandedNodes() {
    return this._expandedNodes;
  }
  /** is the navigation rail expanded */
  public get isNavExpanded(): boolean {
    return this._navigationExpanded;
  }
  /** is the navigation rail expanded */
  public set isNavExpanded(value: boolean) {
    this._navigationExpanded = value;
  }
  /** this is the features ordered by what is returned from the config request */
  public get orderedFeatures(): string[] | undefined {
    return this._orderedFeatureTypes
  }
  /** get just the nodes found in "stepNodeGroups" that are of type "STACK" */
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
  /** set the step node groups present in an initial "how" presentation. */
  public set stepNodeGroups(value: Map<string, SzResolutionStepNode>) {
    this._stepNodeGroups          = value;
  }
  /** set the step nodes present in an initial "how" presentation. This input 
   * should be in the form of a fully nested array. The array should start at the 
   * top level with "Final Cards" and each final card should have "children" nodes, and 
   * each of those children nodes can have children etc.
   */
  public set stepNodes(value: Array<SzResolutionStepNode>) {
    this._stepNodes = value;
  }
  /** get the step nodes present in the current "how" presentation. This input 
   * should be in the form of a fully nested array. The array should start at the 
   * top level with "Final Cards" and each final card should have "children" nodes, and 
   * each of those children nodes can have children etc.
   */
  public get stepNodes(): Array<SzResolutionStepNode> {
    return this._stepNodes;
  }
  /**
   * Collapse all nodes and groups currently expanded.
   * @param idsToExclude id's of expanded steps that should not be collapsed.
   * @param emitEvent if set does not emit the "onStepExpansionChange" and "onGroupExpansionChange" events (useful for initialization bulk stet)
   */
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
  /**
   * Collapse a node found in either "stepNodes"
   * @param id the id of the node or group. commonly in format of "V00000-S0" if node 
   * represents a step or "170e0833-0522-406d-bf07-1c50e7" uid string if step group wrapper that 
   * isn't an actual resolution step itself.
   * @param itemType some groups have the same id's as steps inside them(interim merge steps) which are 
   * actually "GROUP"'s, this parameter allows you to specify between node's and groups with the same ID's.
   */
  public collapseNode(id: string, itemType?: SzResolutionStepListItemType, debug?: boolean) {
    let _stepNodes = this.getStepNodeById(id, debug);
    if(debug) console.log(`collapseNode(${id}, ${itemType})`,_stepNodes, this._stepNodes);

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
  /**
   * Expand all children of a specific node group.
   * @param groupId the id of the node group that the children belong to
   * @param itemType optionally specify the type of node that the group is. For instance, 
   * an Interim entity might have the same Id as a step inside of that node. This allows you to 
   * specify that you want just the group or the node inside the group.
   * @param childNodeTypes optionally only expand children of this type.
   */
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
  /**
   * Expand a node found in "stepNodes"
   * @param id the id of the node or group. commonly in format of "V00000-S0" if node 
   * represents a step or "170e0833-0522-406d-bf07-1c50e7" uid string if step group wrapper that 
   * isn't an actual resolution step itself.
   * @param itemType some groups have the same id's as steps inside them(interim merge steps) which are 
   * actually "GROUP"'s, this parameter allows you to specify between node's and groups with the same ID's.
   */
  expandNode(id: string, itemType?: SzResolutionStepListItemType, debug?: boolean) {
    let _stepNodes = this.getStepNodeById(id);
    //console.log(`expandNode(${id}, ${itemType}): ["${this._expandedNodes.join('",')}]`, _stepNodes, this._stepNodes);
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
  /**
   * Recursively expand all parent nodes of a specific child. This is a recursive method used for tree 
   * traversal and not meant to be used externally.
   * @internal
   * @param stepId The id of the child node
   * @param node The node at the top of the tree you want to expand
   */
  private expandNodesContainingChild(stepId: string, typesToExclude: SzResolutionStepListItemType, node: SzResolutionStepNode) {
    if(node && node.virtualEntityIds && node.virtualEntityIds.indexOf(stepId) > -1) {
      // node is a child of this node
      let nodeIsExcludedType = typesToExclude && typesToExclude.length > 0 ? typesToExclude.indexOf(node.stepType) < 0 : false;
      if(!this.isGroupExpanded(node.id) && !nodeIsExcludedType) { 
        this._expandedGroups.push(node.id); 
        //console.log(`\t\tadded "${node.id} to [${this._expandedGroups.join(',')}]"`, typesToExclude);
      }
      // check the children recursively
      if(node.stepType !== SzResolutionStepListItemType.STACK && node.stepType !== SzResolutionStepListItemType.GROUP && node.children && node.children.forEach) {
        node.children.filter((cNode) => {
          return (cNode as SzResolutionStepNode).stepType !== SzResolutionStepListItemType.STACK;
        }).forEach(this.expandNodesContainingChild.bind(this, stepId, typesToExclude));
      }
    } else {
      //console.warn(`\t\t"${stepId} not found in [${ node && node.virtualEntityIds ? node.virtualEntityIds.join(',') : ''}]"`);
    }
  }
  /**
   * Expand all parents in tree that need to be expanded for the child node to be visible.
   * @internal
   * @param node 
   */
  private expandParentNodes(node: SzResolutionStepNode) {
    //let _group      = this._stepNodeGroups.get(id);
    let _stepNodes  = this._stepNodes;
    if(node.itemType !== SzResolutionStepListItemType.FINAL){
      // we need to start at the final node, not the child
      // stacks should not be auto-expanded when parent groups are expanded
      let typesToExclude = node.itemType === SzResolutionStepListItemType.GROUP ? [SzResolutionStepListItemType.STACK] : [];
      _stepNodes
        .filter((_s: SzResolutionStepNode) => {
          return (_s && _s.itemType === SzResolutionStepListItemType.FINAL && _s.virtualEntityIds && _s.virtualEntityIds.indexOf(node.id) > -1);
        })
        .forEach(this.expandNodesContainingChild.bind(this, node.id, typesToExclude));
    }
  }
  /**
   * Get an array of StepNodes that match a specific id.
   * @param id The id of the node or group to return
   * @returns an array of SzResolutionStepNode that have the matching id
   */
  public getStepNodeById(id: string, debug?: boolean): SzResolutionStepNode[] {
    let _stepNodes  = this._stepNodes;
    let _retVal;
    let parentsThatContainNode = [];

    if(!_stepNodes || (_stepNodes && _stepNodes.length <= 0)) { return undefined; }
    /** because "_stepNodes" is now fully nested we have to do a nested scan */
    let _getStepNodeByIdRecursive = (stepNode: SzResolutionStepNode | SzResolutionStep) => {
      let retVal: Array<SzResolutionStep | SzResolutionStepNode> = [];
      let _id = stepNode && (stepNode as SzResolutionStepNode).id ? (stepNode as SzResolutionStepNode).id : (stepNode as SzResolutionStep).resolvedVirtualEntityId ;
      if(_id === id) {
        // we found our huckleberry
        // we assign this to the "hoisted" retVal
        _retVal.push(stepNode);
      }
      if(stepNode && (stepNode as SzResolutionStepNode).virtualEntityIds && (stepNode as SzResolutionStepNode).virtualEntityIds.indexOf(id) > -1 && (stepNode as SzResolutionStepNode).children) {
        parentsThatContainNode.push((stepNode as SzResolutionStepNode));
        (stepNode as SzResolutionStepNode).children.forEach((cNode)=>{
          let _childrenThatContainNode = _getStepNodeByIdRecursive(cNode);
          if(_childrenThatContainNode && _childrenThatContainNode.length > -1) {
            retVal = retVal.concat(_childrenThatContainNode);
          }
        })
      }
      return _retVal;
    }
    // first get final node that contains node
    let finalStepNode = _stepNodes.find((fNode)=>{
      return fNode && fNode.virtualEntityIds && fNode.virtualEntityIds.indexOf(id) > -1;
    });
    if(finalStepNode){
      //_retVal = [finalStepNode];
      _retVal = [];
      let _traversedTree = _getStepNodeByIdRecursive(finalStepNode);
      if(debug) {
        console.info(`getStepNodeById(${id}): `,_retVal, _traversedTree, _stepNodes);
      }
    }
    
    //console.warn(`getStepNodeById(${id}): `,_retVal);
    return _retVal;
  }

  /**
   * Get a flat array of all nodes and groups that contain the node who's id 
   * matches what's being searched for. This is a recursive method used for tree 
   * traversal and not meant to be used externally.
   * @internal
   * @param id id of the child node to search for.
   * @param node current node who's children we should search through.
   * @returns array of step or step nodes
   */
  private getChildrenContainingNode(id: string, node: SzResolutionStepNode): Array<SzResolutionStep | SzResolutionStepNode> {
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
  /**
   * Query the `/entities/${entityId}/how` api server endpoint for data on HOW an 
   * entity came together.
   * @param entityId 
   */
  public getHowDataForEntity(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
    return this.entityDataService.howEntityByEntityID(
        entityId as number
    ).pipe(
      tap((r) => {
        // clear out any old data on response
        this.clear();
      })
    )
  }
  /**
   * Get all parent nodes of a specific child node.
   * This is a recursive method used for tree 
   * traversal and not meant to be used externally.
   * @internal
   * @param childNodeId The id of the node who's ancestral tree we should traverse.
   * @param startingNode The starting node who's tree we should search down. This is usually a "final" card but it could be any level 
   * in a tree.
   */
  private getParentsContainingNode(childNodeId: string, startingNode?: SzResolutionStepNode, debug?: boolean): SzResolutionStepNode[] {
    let retVal: Array<SzResolutionStepNode> = [];
    startingNode = startingNode ? startingNode : this.getRootNodeContainingNode(childNodeId, debug); // change this to pull root final node when undefined

    if(startingNode && startingNode.virtualEntityIds && startingNode.virtualEntityIds.includes(childNodeId)){
      // child node is present in tree
      // limit to direct descendents
      if(startingNode && startingNode.children && startingNode.children.some) {
        //has descendent
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
  /**
   * Get the parent node of a specific child node.
   * @internal
   * @param childNodeId The id of the node who's ancestral tree we should traverse.
   */
  private getDirectParentContainingNode(childNodeId: string, childNodeItemType?: SzResolutionStepListItemType, parentItemType?: SzResolutionStepListItemType, debug?: boolean) {
    // first get ALL nodes in tree that might contain node
    let parentNodes: Array<SzResolutionStepNode> = this.getParentsContainingNode(childNodeId, undefined, debug);
    let retVal: SzResolutionStepNode;
    // now filter those down to a single node that has the node we're 
    // looking for in it's children array
    if(parentNodes && parentNodes.find) {
      if(parentItemType) {
        parentNodes =  parentNodes.filter((pNode)=>{
          return pNode.itemType === parentItemType;
        });
      }
      if(debug) {
        console.info(`getDirectParentContainingNode(${childNodeId}): `, parentNodes);
      }
      // we should have all descendents at this point
      retVal = parentNodes.find((pNode)=>{
        if(pNode.children && pNode.children.find) {
          let childMatchingId = pNode.children.find((cNode)=>{
            let isCorrectItemType = childNodeItemType !== undefined ? (cNode as SzResolutionStepNode).itemType === childNodeItemType : true;
            return (cNode as SzResolutionStepNode).id === childNodeId && isCorrectItemType;
          });
          if(childMatchingId) {
            return true;
          }
          return false;
        }
        return false
      })
    }
    return retVal;
  }
  /**
   * Get the direct ancestor of a child node. It is technically possible that there is more 
   * than 1 parent of a child but exceedingly unlikely except in cases that resolved to two separate 
   * final entities.
   * @param childNodeId the id of the child
   */
  public getParentContainingNode(childNodeId: string, childNodeItemType?: SzResolutionStepListItemType, parentItemType?: SzResolutionStepListItemType, debug?: boolean): SzResolutionStepNode {
    let retVal = this.getDirectParentContainingNode(childNodeId, childNodeItemType, parentItemType, debug);
    if(debug) {
      console.warn(`parent node for #${childNodeId}: `, retVal);
    }
    return retVal;
  }
  /**
   * Get the Root level node group that contains a specific child step. So say if you have a 
   * add record step that is a child of an interim step that is a child of a merge step, that is a child of 
   * a final result card you can get the "FINAL" card from the child id of the record step.
   * @param childNodeId the id of the child
   */
  public getRootNodeContainingNode(childNodeId: string, debug?: boolean): SzResolutionStepNode {
    if(this._stepNodes) {
      let retVal = this._stepNodes.find((_rn) => {
        return _rn.virtualEntityIds.includes(childNodeId);
      });
      if(debug) {
        console.log(`getRootNodeContainingNode(#${childNodeId})`, retVal);
        if(!retVal) {
          console.warn(`No Root Node!!!`, this._stepNodes);
        }
      }
      return retVal;
    }
    return undefined;
  }
  /** is a specific group expanded */
  public isGroupExpanded(groupId: string): boolean {
    return this._expandedGroups.includes(groupId);
  }
  /** is a specific step card expanded */
  public isStepExpanded(virtualEntityId: string): boolean {
    return this._expandedNodes.includes(virtualEntityId);
  }
  /** is a step a child member of a group that is of itemType `STACK`. */
  public isStepMemberOfStack(vId: string, gId?: string, debug?: boolean) {
    if(debug){
      console.info(`isStepMemberOfStack(${vId}, ${gId})`);
    }
    if(vId) {
      if(gId) {
        // we are looking in a specific group
        let _groupSpecified = this._stepNodeGroups.has(gId) ? this._stepNodeGroups.get(gId) : undefined;
        if(debug){
          console.log(`isStepMemberOfStack(${vId}, ${gId})`, 
          _groupSpecified, 
          ((_groupSpecified && _groupSpecified.virtualEntityIds) ? _groupSpecified.virtualEntityIds.indexOf(vId) > -1 : false), 
          this._stepNodeGroups);
        }
        if(_groupSpecified) {
          // group exists
          if(_groupSpecified && _groupSpecified.virtualEntityIds) {
            return _groupSpecified.virtualEntityIds.indexOf(vId) > -1 ? true : false;
          }
        }
      } else {
        // check all groups
        let _stackGroups = this.stepGroupStacks;
        if(debug){
          console.log(`isStepMemberOfStack(${vId}, ${gId})`, _stackGroups);
        }
        if(_stackGroups && _stackGroups.length > 0) {
          let _memberInGroup = _stackGroups.find((grp: SzResolutionStepNode) => {
            return grp.virtualEntityIds.indexOf(vId) > -1 ? true : false;
          });
          if(_memberInGroup) {
            return true;
          }
        }
      }
    } else {
      if(debug){
        console.warn(`isStepMemberOfStack(${vId}, ${gId})`);
      }
    }
    return false;
  }
  /** is a step that was a member of a stack group(or could be) pinned in place. */
  public isStepPinned(vId: string, gId?: string): boolean {
    return this._pinnedSteps.includes(vId);
  }

  /** clear out any data previously loaded. call this method when a new entity is loaded */
  public clear() {
    // we need to clear out any previous results to ensure we're working with correct data
    this._stepNodes       = undefined;
    this._stepNodeGroups  = new Map<string, SzResolutionStepNode>();
    this._expandedNodes   = [];
    this._expandedGroups  = [];
    this._pinnedSteps     = [];
  }

  /**
   * Step nodes that are children of nodes with a itemType of `STACK` can be "pinned" in place. When a 
   * step in a stack is pinned in place we remove that node from the stack and place it in the stack's parent at the appropriate index.
   * if there are steps after the step being pinned we remove those items too and place them in a new stack and place the 
   * new stack directly after or before the item being pinned.
   * @param vId the id of the step to pin
   * @param gId the id of the stack that contains the item to be pinned.
   */
  public pinStep(vId: string, gId: string) {
    if(!this.isStepPinned(vId)) {
      this._pinnedSteps.push(vId);
      if(gId && this._stepNodeGroups && this._stepNodeGroups.has(gId)) {
        let _stack              = this.getParentContainingNode(vId, undefined, SzResolutionStepListItemType.STACK);
        let _parentGroup        = this.getParentContainingNode(gId, undefined, undefined);
        let _rootNode           = this.getRootNodeContainingNode(gId);
        //console.log(`\t_stack:`,_stack);
        //console.log(`\t_parentGroup: `, _parentGroup);
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
                _newStack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(_newStack);
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
              _stack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(_stack);
              // update stack in "_stepNodeGroups"
              if(this._stepNodeGroups.has(_stack.id)) {
                this._stepNodeGroups.set(_stack.id, _stack);
              }
              //console.log(`removed items from stack ${_stack.id}`, _stack);
            }

            // update parent nodes virtual ids
            if(_parentGroup) {
              _parentGroup.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(_parentGroup);
            }
            // update root node all the way down the tree
            if(_rootNode) {
              _rootNode.virtualEntityIds  = SzHowUIService.setVirtualEntityIdsForNode(false, _rootNode);
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
    return this._stepNodeGroups;
  }
  /**
   * Expand a specific node and all parent nodes of node that need to be expanded in order for the node to 
   * be visible. Collapse all other nodes that are not the node or a direct decendent. 
   * @param vId 
   */
  public selectStep(vId: string) {
    // clear out any other selected
    this.collapseAll(undefined, false);
    // expand node
    this.expandNode(vId);
    return;
  }
  /**
   * Checks to see whether or not a specific step can become a child of a sibling stack or create one, and that the resulting 
   * stack would have at least 2 items it in.
   * @param vId the id of the step to check
   */
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
      } else if(debug) {
        console.warn(`\tcould not find #${vId}!! `, parentNode, parentNode.children[indexInParent]);
      }
    } else if(debug) {
      console.warn(`stepCanBeUnPinned(${vId}): parentNode has no children `, parentNode);
    }
    return retVal;
  }
  /**
   * Alternate the expanded state of a Step or Group Node.
   * @param id Id of the step to expand/collapse. If groupId is not set and id is we assume that we are 
   * looking for a node with a type of "STEP" who's id matches the `id` parameter.
   * Pass "undefined" with a groupId if you specifically 
   * want to toggle a group node.
   * @param groupId Id of the group to toggle expansion on. Pass `id` as `undefined` to toggle a node with type `STACK`,`GROUP`, or `FINAL`.
   * @param itemType optionally specify the item type you want to toggle.
   */
  public toggleExpansion(id: string, groupId?: string, itemType?: SzResolutionStepListItemType, debug?: boolean) {
    let isExpanded = (!groupId || groupId === undefined) ? this._expandedNodes.includes(id) : (groupId ? this._expandedGroups.includes(groupId) : false);
    id = id ? id : (groupId ? groupId : undefined);
    if(!isExpanded) {
      if(debug) console.log(`\texpanding node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}, "${itemType}"`);
      this.expandNode(id, itemType, debug);
    } else {
      if(debug) console.log(`\collapsing node: ${this._expandedNodes.includes(id)}, ${this._expandedGroups.includes(groupId)}, "${itemType}"`);
      this.collapseNode(id, itemType, debug);
    }
  }
  /**
   * Step nodes that are children of nodes with a itemType of `STACK` can be "pinned" in place. When a 
   * step in a stack is unpinned we check to see if we can add the item being unpinned to any stack groups either before or 
   * after the item being unpinned. If none exist we create them, if additional step items are before or after and those 
   * items are also not pinned we merge all the steps together in order to their new target STACK.
   * @param vId the id of the step to pin
   */
  public unPinStep(vId: string, debug?: boolean) {
    if(this.isStepPinned(vId)) {
      this._pinnedSteps.splice(this._pinnedSteps.indexOf(vId),1);
      let parentNode = this.getParentContainingNode(vId, SzResolutionStepListItemType.STEP);
      if(debug) {
        console.log(`unPinStep: ${vId}`, parentNode, this._pinnedSteps);
      }
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
              _nItem.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(_nItem);
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
              newStack.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(newStack);
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

  /**
   * Sets up the service class and sets the "entityDataService" injected in to it
   * to a static reference so static methods can have access to the injected services.
   * @param entityDataService 
   * @param prefs 
   */
  constructor(
    public configDataService: SzConfigDataService,
    public entityDataService: SzEntityDataService,
    public prefs: SzPrefsService
  ) {
    SzHowUIService._entityDataService = entityDataService;
    /** get the list of features ordered by what is specific in the config response */
    this.getFeatureTypeOrderFromConfig();
  }

  // -----------------------------  STATIC METHODS -----------------------------

  /**
   * Query the `/entities/${entityId}/how` api server endpoint for data on HOW an 
   * entity came together.
   * @param entityId 
   */
  public static getHowDataForEntity(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
    return this._entityDataService.howEntityByEntityID(
        entityId as number
    )
  }
  /**
   * Get the type of `CARD` that should be displayed. Possible results are: 
   * - `ADD` when a step added a singleton record to resolution
   * - `CREATE` when a step created a virtual entity
   * - `INTERIM` a virtual entity used to temporily hold the result of previous steps that are then used in subsequent steps.
   * - `FINAL` the final result of a series of other steps used to resolve an entity
   * - `MERGE` when two virtual entities are merged together to form a new virtual entity
   * @param step the resolution step 
   */
  public static getResolutionStepCardType(step: SzResolutionStep, stepNumber?: number): SzResolutionStepDisplayType {
    if(step && step !== undefined) {
      let _agg    = [];
      let _sngltn = [];
      //console.log(`#${stepNumber} getStepListItemType: `, step);
      if(step.candidateVirtualEntity && step.candidateVirtualEntity.singleton) {
        _sngltn.push(step.candidateVirtualEntity);
      } else {
        _agg.push(step.candidateVirtualEntity);
      }
      if(step.inboundVirtualEntity && step.inboundVirtualEntity.singleton) {
        _sngltn.push(step.inboundVirtualEntity);
      } else {
        _agg.push(step.inboundVirtualEntity);
      }
      if(_sngltn.length === 2) {
        // create virtual entity
        return SzResolutionStepDisplayType.CREATE;
      } else if(_agg.length === 2) {
        // merge virtual entities
        return SzResolutionStepDisplayType.MERGE;
      } else {
        // add record to virtual entity
        return SzResolutionStepDisplayType.ADD;
      }
    }
    return undefined;
  }
  /**
   * Used to get the `itemType` of a node or step. Potential results are:
   * - `FINAL` a card representing a final result of previous steps that resulted in a entity.
   * - `GROUP` used for nodes that have child nodes and/or groups. groups can expand and collapse child nodes.
   * - `STACK` a special type of `GROUP` that displays a series of contiguous steps that can be collapsed and expanded only 1 level deep. Used
   * to collapse multiple steps of the same type in to a meta group to declutter repetative steps.
   * - `STEP` an individual card that has no child items.
   * @param item 
   */
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
  /**
   * Get all virtualEntityId's or resolvedEntityId's or Id's and recordId's for steps or nodes that 
   * are descendents of a step node. This is a recursive Tree traversal method and should not be used trivially.
   * @param isNested is the step being passed as the `step` parameter a child of another card. pass `false` or `undefined` for 
   * root level nodes.
   * @param step the step to gather virtual entity ids's for
   */
  /*public static getVirtualEntityIdsForNode(isNested: boolean, step: SzResolutionStepNode) {
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
  }*/
  /**
   * @internal
   * recursively scan a nodes children and their childrens children to collect
   * all virtual entity id's that are decendents of this node
   */
  public static getVirtualEntityIdsForNode(_rStep?: SzResolutionStepNode): string[] {
    let retVal: Array<string> = [];
    
    if(_rStep && _rStep.children) {
      _rStep.children.forEach((sNode, ind)=>{
        let idToAdd = (sNode as SzResolutionStepNode).id ? (sNode as SzResolutionStepNode).id : (sNode as SzResolutionStep).resolvedVirtualEntityId;
        retVal.push(idToAdd);

        let childrenOfChildIds = this.getVirtualEntityIdsForNode((sNode as SzResolutionStepNode));
        if(childrenOfChildIds && childrenOfChildIds.length > 0) {
          retVal = retVal.concat(childrenOfChildIds);
        }
      });
    }
    return retVal;
  }
  /**
   * Set the `virtualEntityIds` property of a node/step to an array of virtualEntityId's or resolvedEntityId's or Id's and recordId's for steps or nodes that 
   * are descendents of a step node. This is a recursive Tree traversal method and should not be used trivially.
   * @param isNested is the step being passed as the `step` parameter a child of another card. pass `false` or `undefined` for 
   * root level nodes.
   * @param step the step to query for descendent steps/children
   * @returns 
   */
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
  /** get the features from the api server config endpoint */
  private getFeatureTypeOrderFromConfig() {
    this.configDataService.getOrderedFeatures().subscribe((res: any)=>{
      this._orderedFeatureTypes = res;
      console.log('getFeatureTypeOrderFromConfig: ', res);
    });
  }
}