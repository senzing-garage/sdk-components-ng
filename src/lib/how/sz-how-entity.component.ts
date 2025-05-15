import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { 
    EntityDataService as SzEntityDataService, 
    SzEntityIdentifier, SzFeatureMode, SzHowEntityResponse, SzHowEntityResult, SzRecordIdentifier, SzRecordIdentifiers, SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord, SzVirtualEntityResponse 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzHowUIService } from '../services/sz-how-ui.service';
import { 
  SzVirtualEntityRecordsClickEvent, 
  SzResolvedVirtualEntity, 
  SzResolutionStepDisplayType 
} from '../models/data-how';
import { Observable, Subject, take, takeUntil, zip, map, tap } from 'rxjs';
import { parseBool } from '../common/utils';
import { v4 as uuidv4} from 'uuid';
import { SzResolutionStepListItemType, SzResolutionStepNode } from '../models/data-how';

/**
 * Display the "How" information for entity
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-entity entityId="5"></sz-how-entity>
 * 
 * @example
 * <!-- (WC) -->
 * <sz-wc-how-entity entityId="5"></sz-wc-how-entity>
*/
@Component({
    selector: 'sz-how-entity',
    templateUrl: './sz-how-entity.component.html',
    styleUrls: ['./sz-how-entity.component.scss'],
    standalone: false
})
export class SzHowEntityComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** the data retrieved from the 'finalStates' array of the how api request. passed to other components. */
    public finalCardsData: SzVirtualEntity[];
    /** 
     * @internal
     * the data retrieved from the how api request.
     */
    private _data: SzHowEntityResult;
    /** 
     * @internal 
     * we get the expanded "virtual entities" for every step in the how request.
     * these must be retrieved individually per the api spec. this is where we store
     * them while working with them.
    */
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    /** @internal */
    private _resolutionSteps: Array<SzResolutionStep>;
    /** @internal */
    private _resolutionStepsByVirtualId: {[key: string]: SzResolutionStep};
    /** @internal */
    private _stepNodeGroups: Map<string, SzResolutionStepNode>  = new Map<string, SzResolutionStepNode>();
    /** @internal */
    private _stepNodes: Array<SzResolutionStepNode>;
    /** @internal */
    private _isLoading                        = false;
    /** 
     * @internal 
     * whether or not to show the navigation rail
     */
    private _showNavigation                   = true;
    /** 
     * @internal 
     * the entity id to display in the component
     */
    private _entityId: SzEntityIdentifier;
    /** 
     * @internal 
     * used for ensuring the data of this component displayed matches the entity id passed in
     */
    private _dataLoadedForId: SzEntityIdentifier;
    /** 
     * @internal 
     * when the number of steps returned from a api request is less than or equal to this number
     * the cards are automatically expanded.
     */
    private _expandCardsWhenLessThan: number  = 2;

    // -------------------------------------------- observeables and emitters --------------------------------------------
    /** @internal */
    private _dataChange: Subject<SzHowEntityResult>           = new Subject<SzHowEntityResult>();
    /** when the data has changed this event is emitted */
    public   dataChange                                       = this._dataChange.asObservable();
    /** @internal */
    private _entityIdChange: Subject<SzEntityIdentifier>      = new Subject<SzEntityIdentifier>();
    /** when the entity id passed to this component has changed this event is emitted */
    public   entityIdChange                                   = this._entityIdChange.asObservable();
    /** @internal */
    private _finalEntitiesChange: Subject<SzVirtualEntity[]>  = new Subject<SzVirtualEntity[]>();
    /** when the final entities are returned from the api request this event is emitted */
    public  finalEntitiesChange                               = this._finalEntitiesChange.asObservable();
    /** @internal */
    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    /** when the map of virtual entities found in the api response is returned from subsequent queries is returned this event is emitted */
    public  virtualEntitiesDataChange                         = this._virtualEntitiesDataChange.asObservable();
    /** @internal */
    private _virtualEntityInfoLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    /** when a user clicks the info link inside of a step card this event is emitted*/
    public  virtualEntityInfoLinkClick                        = this._virtualEntityInfoLinkClick.asObservable();
    /** when the data has changed this event is emitted */
    @Output() public dataChanged                              = new EventEmitter<SzHowEntityResult>();
    /** when the entity id has changed and a data request response is pending this event is emitted */
    @Output() public loading: EventEmitter<boolean>           = new EventEmitter<boolean>();
    /** when the map of virtual entities found in the api response is returned from subsequent queries is returned this event is emitted */
    @Output() public virtualEntitiesDataChanged               = new EventEmitter<Map<string, SzResolvedVirtualEntity>>();
    /** when a user clicks the info link inside of a step card this event is emitted*/
    @Output() public virtualEntityInfoLinkClicked             = new EventEmitter<SzVirtualEntityRecordsClickEvent>();
    
    // --------------------------------------------    getters and setters    --------------------------------------------
    /**
     * the entity id of the entity to display the How report for
     */
    public get entityId(): SzEntityIdentifier {
      return this._entityId;
    }
    /**
     * the entity id of the entity to display the How report for
     */
    @Input() public set entityId(value: SzEntityIdentifier) {
      this._entityId = value;
      if(this._dataLoadedForId != this.entityId) {
        this._entityIdChange.next(this.entityId);
      }
    }
    /** when the entity id has changed and a data request response is pending this event is emitted */
    public get isLoading(): boolean {
      return this._isLoading;
    }
    /** whether or not to show the navigation rail */
    public get showNavigation(): boolean {
      return this._showNavigation;
    }
    /** whether or not to show the navigation rail */
    @Input() public set showNavigation(value: boolean | string) {
      this._showNavigation = parseBool(value);
    }
    /** get the steps returned from the main api request as extended 'SzResolutionStepNode' objects.
     * the extended objects are recursive, nested, grouped etc and used for display.
     */
    public get stepNodes(): Array<SzResolutionStepNode> {
      return this._stepNodes;
    };
    /**
     * resolutionSteps from the api response object
     */
    public get resolutionStepsByVirtualId() {
      return this._resolutionStepsByVirtualId;
    }
    /** map of virtual entities by id*/
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
      return this._virtualEntitiesById;
    }

    // -------------------------------------------------- event handlers -------------------------------------------------
    
    /** 
     * @internal 
     * when the entity id changes this method 
     * this method queries the api endpoint and 
     * reinitializes all the various objects and collections that are generated from the data 
     * returned.
    */
    private onEntityIdChange() {
      if(this.entityId) {
        // get entity data
        this._isLoading = true;
        this.loading.emit(true);
        this.getData(this.entityId).subscribe((resp: SzHowEntityResponse) => {
            //console.log(`how response(${this.entityId}): ${resp}`, resp.data);
            this._data                                    = resp && resp.data ? resp.data : undefined;
            this._resolutionStepsByVirtualId              = resp && resp.data && resp.data.resolutionSteps ? this._data.resolutionSteps : undefined;
            this._dataLoadedForId                         = this.entityId;

            if(this._data.finalStates && this._data.finalStates.length > 0) {
                // has at least one final states
                // for each final state get the virual step
                // and populate the components
                let _finalStatesData = this._data.finalStates
                .filter((fStateObj) => {
                    return this._data.resolutionSteps && this._data.resolutionSteps[ fStateObj.virtualEntityId ] ? true : false;
                })
                this.finalCardsData            = _finalStatesData;
                //this.howUIService.finalStates  = _finalStatesData;
            }
            if(this._data.resolutionSteps && Object.keys(this._data.resolutionSteps).length > 0) {
                // we have resolution steps
                let _resSteps   = [];
                let _stepCount  = Object.keys(this._data.resolutionSteps).length;
                for(let rKey in this._data.resolutionSteps) {
                  let _stepType = SzHowUIService.getResolutionStepCardType(this._data.resolutionSteps[rKey]);
                  if(_stepType !== SzResolutionStepDisplayType.CREATE || _stepCount <= this._expandCardsWhenLessThan) {
                    //console.log(`#${this._data.resolutionSteps[rKey].stepNumber} type ${_stepType}`);
                    this.howUIService.expandNode(this._data.resolutionSteps[rKey].resolvedVirtualEntityId, SzResolutionStepListItemType.STEP);
                  }
                  _resSteps.push( this._data.resolutionSteps[rKey] );
                }
                this._resolutionSteps = _resSteps.reverse(); // we want the steps in reverse for display purposes
            }
            if(this._resolutionSteps){
              //this._stepNodeGroups              = this.getGroupsFromStepNodes(this._resolutionSteps);
              //let _interimSteps                 = this.getInterimStepNodes(this._resolutionSteps);
              //console.log(`interim steps: `, _interimSteps);
            }
            if(this._data && this._data.finalStates && this._data.resolutionSteps) {
              this._stepNodes       = this.getStepNodesFromFinalStates(this._data.finalStates, this._data.resolutionSteps);
              // get step nodes that are groups
              this._stepNodeGroups  = this.getGroupsFromStepNodes(this._stepNodes);
              //console.log(`step node groups: `, this._stepNodeGroups);
              // store in the service
              this.howUIService.stepNodeGroups  = this._stepNodeGroups;
              this.howUIService.stepNodes       = this._stepNodes;
            }
            // extend data with augmentation
            if(this._data && this._data.resolutionSteps) {
              this.getVirtualEntityDataForSteps(this._data.resolutionSteps, this._data.finalStates).pipe(
                take(1),
                takeUntil(this.unsubscribe$)
              ).subscribe((virtualEntitiesMap) => {
                this._virtualEntitiesById = virtualEntitiesMap;
                this._virtualEntitiesDataChange.next(virtualEntitiesMap);
              });
            }
            this._isLoading = false;
            this.loading.emit(false);
            this._finalEntitiesChange.next(this.finalCardsData);
            this._dataChange.next(resp.data);
        });
      }
    }

    // ------------------------------------------ utility methods and functions ------------------------------------------
    /** @internal */
    private getGroupForMemberStep(step: SzResolutionStep, groups?: Map<string, SzResolutionStepNode>): SzResolutionStepNode {
      let _retVal: SzResolutionStepNode;
      if(!groups) { groups = this.howUIService.stepNodeGroups; }
      if(groups && step) {
        let _idToLookFor = step.resolvedVirtualEntityId;
        let _sk = false;
        groups.forEach((groupToSearch: SzResolutionStepNode, key: string) => {
          if(!_sk && groupToSearch.virtualEntityIds && groupToSearch.virtualEntityIds.indexOf(_idToLookFor) > -1 || groupToSearch.id === _idToLookFor) {
            _retVal = groupToSearch;
          }
        });
      }
      return _retVal;
    }
    /** @internal */
    private getResolutionStepGroupById(id: string, groups: Map<string, SzResolutionStepNode>): SzResolutionStepNode {
      let _g = groups.get(id);
      return _g ? _g : undefined;
    }
    /** @internal */
    private getResolutionStepGroupIdByMemberVirtualId(virtualEntityId: string, groups: Map<string, SzResolutionStepNode>) {
      let retVal;
      if(groups) {
        groups.forEach((_value: SzResolutionStepNode, _key: string) => {
          let _is = _value.virtualEntityIds.indexOf(virtualEntityId) > -1 && _value.id !== virtualEntityId;
          if(_is) {
            retVal = _key;
          }
        });
      }
      return retVal;
    }
    /** @internal */
    private getResolutionStepGroupByMemberVirtualId(virtualEntityId: string, groups: Map<string, SzResolutionStepNode>) {
      if(groups) {
        let _groupId = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
        if(_groupId && groups.get(_groupId)) {
          return groups.get(_groupId)
        }
      }
      return undefined;
    }
    /** is a specific step a member of a stack group */
    isStepMemberOfStack(vId) {
      let retVal = this.howUIService.isStepMemberOfStack(vId);
      //console.log(`isStepMemberOfStack("${vId}") : `, retVal, this.howUIService.stepGroupStacks);
      return retVal;
    }
    /** if step can be a member of a stack group returns true */
    stepCanBeUnPinned(vId) {
      let retVal = this.howUIService.stepCanBeUnPinned(vId, true);
      //console.log(`stepCanBeUnPinned("${vId}") : ${retVal}`, this.howUIService.stepGroupStacks);
      return retVal;
    }
    /** is a specific step a child of any other steps */
    private isStepChildOfNode(step: SzResolutionStep, nodesWithChildren?: Map<string, SzResolutionStepNode>) {
      if(this.getGroupForMemberStep(step, nodesWithChildren) !== undefined) {
        return true;
      }
      return false;
    }
    /** does a step have children */
    private stepHasMembers(virtualEntityId: string, nodesWithChildren: Map<string, SzResolutionStepNode>) {
      let _retVal   = nodesWithChildren && nodesWithChildren.get(virtualEntityId) !== undefined ? true : false;
      return _retVal;
    }
    /** is a specific step a child of any other steps */
    public stepIsMemberOfGroup(virtualEntityId: string, nodesWithChildren: Map<string, SzResolutionStepNode>) {
      let _retVal   = false;
      let _groupId  = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, nodesWithChildren);
      if(_groupId) {
        _retVal     = true; 
      }
      return _retVal;
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        public dialog: MatDialog,
        private howUIService: SzHowUIService
    ){}
    
    /** get data and set up event subscribers on initialization */
    ngOnInit() {
      //this.getFeatureTypeOrderFromConfig();
      // publish how step data on retrieval
      this.dataChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((data: SzHowEntityResult) => {
        this.dataChanged.emit(data);
      })
      // publish virtual entities data on retrieval
      this.virtualEntitiesDataChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((data: Map<string, SzResolvedVirtualEntity>) => {
        this.virtualEntitiesDataChanged.emit(data);
      })
      // expand final entities node(s) by default
      this.finalEntitiesChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((entities: SzVirtualEntity[]) => {
        if(entities && entities.forEach) {
          entities.forEach((vEnt) => {
            this.howUIService.expandNode(vEnt.virtualEntityId, SzResolutionStepListItemType.FINAL);
            this.howUIService.expandChildNodes(vEnt.virtualEntityId, SzResolutionStepListItemType.FINAL, [SzResolutionStepListItemType.STEP]);
          });
        }
      });
      // when entity id changes get/transform/load data
      this.entityIdChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onEntityIdChange.bind(this));
      // when user clicks on the info icon on a card open up 
      // a floating data box
      this.virtualEntityInfoLinkClick.pipe(
          takeUntil(this.unsubscribe$)
      ).subscribe((evt: SzVirtualEntityRecordsClickEvent)=> {
          this.virtualEntityInfoLinkClicked.emit(evt);
      });
      // make initial request
      if(this._entityId && !this._dataLoadedForId) {
        this._entityIdChange.next(this._entityId);
      }
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    // ------------------------------------------------ data manipulation ------------------------------------------------

    /**
     * @internal 
     * retrieve the how data for a entity */
    private getData(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
        return this.howUIService.getHowDataForEntity(
            this.entityId
        );
    }
    /**
     * @internal 
     * this method returns node wrappers as SzResolutionStepNode that contain children SzResolutionStepNode or SzResolutionStep steps.
     * This is primarily used for generating the default 'STACK' groups, but also include 'SzResolutionStepNode' objects 
     * that contain other groups or individual steps
     */
    getGroupsFromStepNodes(_rSteps?: Array<SzResolutionStepNode | SzResolutionStep>): Map<string, SzResolutionStepNode> {
      let retVal = new Map<string, SzResolutionStepNode>();
      if(!_rSteps) {
        _rSteps = this._stepNodes;
      }
      if(_rSteps && _rSteps.forEach) {
        _rSteps.forEach((sNode, ind)=>{
          if(sNode && (sNode as SzResolutionStepNode).children) {
            // this is a group
            let stepAsNode = (sNode as SzResolutionStepNode);
            retVal.set(stepAsNode.id, stepAsNode);
            // recurse children
            let childrenGroups = this.getGroupsFromStepNodes(stepAsNode.children);
            // add any children that are groups to result
            if(childrenGroups && childrenGroups.size > 0){
              retVal = new Map([...retVal, ...childrenGroups ]);
            }
          }
        });
      }
      return retVal;
    }
    /**
     * @internal
     * recursively scan a nodes children and their childrens children to collect
     * all virtual entity id's that are decendents of this node
     */
    /*
    getVirtualEntityIdsForNode(_rStep?: SzResolutionStepNode): string[] {
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
    }*/

    /** @internal */
    public getRecordsForNode(onlySingletons: boolean, step: SzResolutionStepNode): Array<SzVirtualEntityRecord> {
      let retVal: SzVirtualEntityRecord[] = [];
      if(step && step.inboundVirtualEntity && step.inboundVirtualEntity.records && step.inboundVirtualEntity.records.length > 0) {
        if((onlySingletons && step.inboundVirtualEntity.singleton) || onlySingletons === undefined || onlySingletons === false){ retVal = retVal.concat(step.inboundVirtualEntity.records); }
      }
      if(step && step.candidateVirtualEntity && step.candidateVirtualEntity.records && step.candidateVirtualEntity.records.length > 0) {
        if((onlySingletons && step.candidateVirtualEntity.singleton) || onlySingletons === undefined || onlySingletons === false){ retVal = retVal.concat(step.candidateVirtualEntity.records); }
      }
      if(step && step.children && step.children.map) {
        retVal = retVal.concat(step.children.map(this.getRecordsForNode.bind(this, onlySingletons)));
        if(retVal && retVal.flat){ retVal = retVal.flat(); }
      }
      return retVal = Array.from(new Set(retVal)); // de-dupe any values
    }
    /**
     * @internal
     * 
     * This method returns steps nodes for the final entities with steps as children, and
     * contiguous add record steps grouped in to stacks, and interim steps nested. Objects can have 'children' objects of the same 
     * type.. which can also have children etc. This is a method that traverses from the final nodes down the steps and creates a datastructure of 
     * nodes suitable for rendering.
     * @param finalStates final steps returned from api request
     * @param rSteps the object containing all steps returned from the api request.
     * @returns 
     */
    private getStepNodesFromFinalStates(finalStates: SzVirtualEntity[], rSteps: {[key: string]: SzResolutionStep}) {
      let stepsByVirtualId              = new Map<string, SzResolutionStep>();
      for(let rKey in rSteps) {
        stepsByVirtualId.set(rKey, rSteps[rKey]);
      }
      let retVal: SzResolutionStepNode[] = finalStates.map((fVirt)=>{
        let fStep = rSteps[fVirt.virtualEntityId] ? rSteps[fVirt.virtualEntityId] : fVirt;
        // initialize final step as a stepNode
        let finalStepAsStepNode: SzResolutionStepNode = Object.assign({
          id: fVirt.virtualEntityId,
          stepType: SzResolutionStepDisplayType.FINAL,
          itemType: SzResolutionStepListItemType.FINAL,
          children: []
        }, fStep);

        // if we can traverse then do it
        if(rSteps[fVirt.virtualEntityId]) {
          // this will only ever return "1" top level item since that's all we're passing in
          finalStepAsStepNode = this.getNestedStepNodesFromSteps([rSteps[fVirt.virtualEntityId]], stepsByVirtualId, false, true)[0];
        } else {
          // otherwise append final state as child of itself
          // since it is an expandable node
          let firstChild = (Object.assign({
            id: fVirt.virtualEntityId,
            stepType: fVirt.singleton ? SzResolutionStepDisplayType.SINGLETON: rSteps[fVirt.virtualEntityId] ? SzHowUIService.getResolutionStepCardType(rSteps[fVirt.virtualEntityId]) : SzResolutionStepListItemType.STEP,
            itemType: fVirt.singleton ? SzResolutionStepListItemType.SINGLETON : SzResolutionStepListItemType.STEP,
          }, fStep) as SzResolutionStepNode);
          finalStepAsStepNode.virtualEntityIds = [fVirt.virtualEntityId];
          finalStepAsStepNode.children.push(firstChild);
        }
        return finalStepAsStepNode;
      });

      //console.info(`getStepNodesFromFinalStates: `, finalStates, retVal);
      return retVal;
    }
    /**
     * @internal
     * 
     * This is the main method used for recursional traversal by #getStepNodesFromFinalStates
     * @param _rSteps array of steps to traverse and transform in to nested {SzResolutionStepNode} nodes
     * @param stepsByVirtualId map of ALL steps with their virtual id as the key
     * @returns 
     */
    private getNestedStepNodesFromSteps(_rSteps: Array<SzResolutionStep>, stepsByVirtualId: Map<string, SzResolutionStep>, parentIsMerge?: boolean, parentIsFinal?: boolean): Array<SzResolutionStepNode> {
      let retVal:Array<SzResolutionStepNode> = [];
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      let sortByStepNumber = (a: SzResolutionStepNode, b: SzResolutionStepNode) => {
        return (a.stepNumber > b.stepNumber) ? -1 : 1;
      }
      let collapseSteps = (virtualEntityIds: string[]) => {
        if(virtualEntityIds && virtualEntityIds.forEach) {
          virtualEntityIds.forEach((vId)=>{
            this.howUIService.collapseNode(vId, SzResolutionStepListItemType.STEP);
          });
        }
      }
      let createStacksForContiguousAddRecords = (_stepNodes: Array<SzResolutionStepNode | SzResolutionStep>): SzResolutionStepNode[] => {
        let itemsToRemove = [];
        //let addChildrenAtIndexPosition = -1;
        let stackToAddChildrenTo: SzResolutionStepNode;
        let _retVal = _stepNodes.map((sNode, nodeIndex, sNodes)=>{
          if((sNode as SzResolutionStepNode).stepType === SzResolutionStepDisplayType.ADD) {
            //let previousNodeStepType  = stepNodes[ nodeIndex - 1] ? stepNodes[ nodeIndex - 1].stepType : undefined;
            let nextNodeStepType      = sNodes[ nodeIndex + 1] ? (sNodes[ nodeIndex + 1] as SzResolutionStepNode).stepType : undefined;
            if(!stackToAddChildrenTo) {
              // no stack initialized, is the next item a ADD
              // if so init the stack
              if(nextNodeStepType && nextNodeStepType === SzResolutionStepDisplayType.ADD) {
                //addChildrenAtIndexPosition = nodeIndex;
                stackToAddChildrenTo = Object.assign({}, (sNode as SzResolutionStepNode));
                stackToAddChildrenTo.id       = uuidv4()
                stackToAddChildrenTo.itemType = SzResolutionStepListItemType.STACK;
                stackToAddChildrenTo.children = [sNode];
                // clear out unused properties
                stackToAddChildrenTo.stepType = undefined;
                stackToAddChildrenTo.candidateVirtualEntity = undefined;
                stackToAddChildrenTo.inboundVirtualEntity   = undefined;
                delete stackToAddChildrenTo.stepType;
                delete stackToAddChildrenTo.candidateVirtualEntity;
                delete stackToAddChildrenTo.inboundVirtualEntity;
                // mark for deletion
                //itemsToRemove.push(stepNode.id);
                return stackToAddChildrenTo;
              }
            } else if(stackToAddChildrenTo) {
              // we already have a stack to add to
              // append item to children
              stackToAddChildrenTo.children.push(sNode);
              // mark for deletion
              let _idToDelete = (sNode as SzResolutionStepNode).id ? (sNode as SzResolutionStepNode).id : ((sNode as SzResolutionStep).resolvedVirtualEntityId);
              itemsToRemove.push(_idToDelete);
            }
          } else if(stackToAddChildrenTo) {
            // node is not an "ADD" but the previous one was
            // end stack chain
            //addChildrenAtIndexPosition = -1;
            stackToAddChildrenTo.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(stackToAddChildrenTo);
            // make sure that steps are collapsed by default
            collapseSteps(stackToAddChildrenTo.virtualEntityIds);
            stackToAddChildrenTo = undefined;
          }
          if(stackToAddChildrenTo && nodeIndex === (sNodes.length - 1)) {
            // we were currently in a stack aggregation step but this is the last one
            // calculate virtualEntityIds from members
            stackToAddChildrenTo.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(stackToAddChildrenTo);
            // make sure that steps are collapsed by default
            collapseSteps(stackToAddChildrenTo.virtualEntityIds);
          }
          return sNode;
        });
        // check if we need to remove items that were moved to stack
        if(itemsToRemove && itemsToRemove.length > 0){
          _retVal = _retVal.filter((stepNode) => {
            let _idOfStep = (stepNode as SzResolutionStepNode).id ? (stepNode as SzResolutionStepNode).id : ((stepNode as SzResolutionStep).resolvedVirtualEntityId);
            return itemsToRemove.indexOf(_idOfStep) < 0 ;
          });

        }
        //console.log(`\tcreateStacksForContiguousAddRecords: created stacks`, _retVal, itemsToRemove);
        return _retVal.map((_s)=>{ return _s as SzResolutionStepNode});
      }
      _rSteps.forEach((step)=>{
        let stepsToTraverse = [];
        let stepType  = SzHowUIService.getResolutionStepCardType(step);
        let isMerge   = stepType === SzResolutionStepDisplayType.MERGE;
        if(step && step.candidateVirtualEntity && !step.candidateVirtualEntity.singleton && stepsByVirtualId.has(step.candidateVirtualEntity.virtualEntityId)){
          stepsToTraverse.push(stepsByVirtualId.get(step.candidateVirtualEntity.virtualEntityId));
        }
        if(step && step.inboundVirtualEntity && !step.inboundVirtualEntity.singleton && stepsByVirtualId.has(step.inboundVirtualEntity.virtualEntityId)){
          stepsToTraverse.push(stepsByVirtualId.get(step.inboundVirtualEntity.virtualEntityId));
        }
        let isGroup = parentIsMerge ? true : false;

        let extendedNode: SzResolutionStepNode = Object.assign({
          id: step.resolvedVirtualEntityId,
          stepType: stepType,
          itemType: isGroup ? SzResolutionStepListItemType.GROUP : SzResolutionStepListItemType.STEP,
          isInterim: false
          /*virtualEntityIds: [resStep.candidateVirtualEntity.virtualEntityId, resStep.inboundVirtualEntity.virtualEntityId].filter((virtualEntityId: string) => {
            // make sure step is not another interim group
            return !interimGroups.has(virtualEntityId);
          })*/
        }, step);

        if(parentIsMerge) {
          // no matter what if the parent is a merge this is an interim
          extendedNode.isInterim  = true;
        }

        if(stepsToTraverse && stepsToTraverse.length > 0) {
          if(parentIsMerge) {
            // these are interim virtual entities
            let stepChildren = this.getNestedStepNodesFromSteps(stepsToTraverse, stepsByVirtualId, isMerge);
            // for interim steps we need to add the step as a child of itself so it shows up INSIDE the group
            extendedNode.children   = [(Object.assign({
              id: step.resolvedVirtualEntityId,
              stepType: stepType,
              itemType: SzResolutionStepListItemType.STEP,
              isInterim: false
            }, step) as SzResolutionStepNode)]
            .concat(stepChildren)
            .sort(sortByStepNumber);
            if(extendedNode.children && extendedNode.children.length > 1) { extendedNode.children = createStacksForContiguousAddRecords(extendedNode.children); }
            extendedNode.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(extendedNode);
            retVal.push(extendedNode);
          } else {
            // we still need to traverse these but we're not going to mark them as interim
            let stepAncestors = this.getNestedStepNodesFromSteps(stepsToTraverse, stepsByVirtualId, isMerge);
            if(parentIsFinal) {
              // we want to grab the ancestors and just append as children
              extendedNode.stepType   = SzResolutionStepDisplayType.FINAL;
              extendedNode.itemType   = SzResolutionStepListItemType.FINAL;
              extendedNode.children   = [(Object.assign({
                id: step.resolvedVirtualEntityId,
                stepType: stepType,
                itemType: SzResolutionStepListItemType.STEP,
                isInterim: false
              }, step) as SzResolutionStepNode)]
              .concat(stepAncestors)
              .sort(sortByStepNumber);
              if(extendedNode.children && extendedNode.children.length > 1) { extendedNode.children = createStacksForContiguousAddRecords(extendedNode.children); }
              extendedNode.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(extendedNode);
              retVal.push(extendedNode);
            } else {
              // we are just going to inject the ancestors at the same level
              // as these nodes
              extendedNode.ancestors  = stepAncestors;
              retVal.push(extendedNode);
              retVal = retVal.concat(stepAncestors);
            }
          }
        } else if(extendedNode.isInterim) {
          // if the node is an interim node and there are no nodes to traverse
          // then it's probably an interim with just one step(CREATE)
          // then add node as child of iteself
          extendedNode.children   = [(Object.assign({
            id: step.resolvedVirtualEntityId,
            stepType: stepType,
            itemType: SzResolutionStepListItemType.STEP,
            isInterim: false
          }, step) as SzResolutionStepNode)];
          retVal.push(extendedNode);
          extendedNode.virtualEntityIds = [step.resolvedVirtualEntityId];
        } else {
          if(parentIsFinal) { 
            // this is a final step node so append it to itself for display purposes
            let finalNode: SzResolutionStepNode = Object.assign({
              id: step.resolvedVirtualEntityId,
              stepType: SzResolutionStepDisplayType.FINAL,
              itemType: SzResolutionStepListItemType.FINAL,
              isInterim: false
            }, step);
            finalNode.children   = [(Object.assign({
              id: step.resolvedVirtualEntityId,
              stepType: stepType,
              itemType: SzResolutionStepListItemType.STEP,
              isInterim: false
            }, step) as SzResolutionStepNode)]
            .sort(sortByStepNumber);
            //if(extendedNode.children && extendedNode.children.length > 1) { extendedNode.children = createStacksForContiguousAddRecords(extendedNode.children); }
            finalNode.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(finalNode);
            retVal.push(finalNode);
          } else {
            // just append to list
            retVal.push(extendedNode);
          }
        }
      });
      // sort by step number
      retVal.sort(sortByStepNumber);
      // if we have contiguous items wrap them in stack containers
      if(retVal && retVal.length > 1) {
        //retVal = createStacksForContiguousAddRecords(retVal);
      }
      return retVal;
    }

    /** 
     * @internal
     * this is the method that does the heavy lifting for getting ALL the data 
     * for each virtual entity in each steps "inboundVirtualEntity" AND "candidateVirtualEntity".
     * this data can then be used to populate any component or look up any components
     * displayed data at the source by its virtual entity id.
     */
    private getVirtualEntityDataForSteps(resolutionSteps?: {[key: string]: SzResolutionStep}, finalVirtualEntities?: SzVirtualEntity[]): Observable<Map<string, SzResolvedVirtualEntity>> {
      let _rParamsByVirtualEntityIds  = {};
      let _responseSubject      = new Subject<Map<string, SzResolvedVirtualEntity>>();
      let _retObserveable       = _responseSubject.asObservable();
      if(resolutionSteps){
        for(let rKey in resolutionSteps) {
          _rParamsByVirtualEntityIds[ resolutionSteps[rKey].inboundVirtualEntity.virtualEntityId ] = resolutionSteps[rKey].inboundVirtualEntity.records.map((vRec: SzVirtualEntityRecord)=>{
            return {
                src: vRec.dataSource,
                id: vRec.recordId
            } as SzRecordIdentifier
          });
          _rParamsByVirtualEntityIds[ resolutionSteps[rKey].candidateVirtualEntity.virtualEntityId ] = resolutionSteps[rKey].candidateVirtualEntity.records.map((vRec: SzVirtualEntityRecord)=>{
            return {
                src: vRec.dataSource,
                id: vRec.recordId
            } as SzRecordIdentifier
          });
        }
      }
      if(finalVirtualEntities) {
        finalVirtualEntities.forEach((virtualEntity: SzVirtualEntity) => {
          _rParamsByVirtualEntityIds[ virtualEntity.virtualEntityId ] = virtualEntity.records.map((vRec: SzVirtualEntityRecord)=>{
            return {
                src: vRec.dataSource,
                id: vRec.recordId
            } as SzRecordIdentifier
          });
        });
      }
      if(_rParamsByVirtualEntityIds && Object.keys(_rParamsByVirtualEntityIds).length > 0){
        let virtualRecordRequests = [];
        for(let virtualEntityId in _rParamsByVirtualEntityIds) {
          let szIdentifiersForVirtualEntity = _rParamsByVirtualEntityIds[virtualEntityId];
          //console.warn('rIds ??? ', szIdentifiersForVirtualEntity);
          virtualRecordRequests.push(
            this.entityDataService.getVirtualEntityByRecordIds(szIdentifiersForVirtualEntity, undefined, undefined, SzFeatureMode.ATTRIBUTED)
            .pipe(
              takeUntil(this.unsubscribe$),
              map(((result: SzVirtualEntityResponse) => {
                return Object.assign({
                  virtualEntityId: virtualEntityId
                }, result.data.resolvedEntity);
              }))
            )
          );
        }
        let totalRequests = zip(...virtualRecordRequests).subscribe((_results: SzResolvedVirtualEntity[]) => {
          let retVal  = new Map<string, SzResolvedVirtualEntity>();
          _results.forEach((virtualEntityResponse) => {
            retVal.set(virtualEntityResponse.virtualEntityId, virtualEntityResponse);
          });
          
          _responseSubject.next(retVal);
        });
      }
      return _retObserveable;
    }

    // -------------------------------- debug methods (delete or comment out for release) --------------------------------

    stepIsMemberOfGroupDebug(virtualEntityId: string, debug?: boolean) {
      let _retVal = this.stepIsMemberOfGroup(virtualEntityId, this.howUIService.stepNodeGroups);
      if(debug !== false) { console.log(`stepIsMemberOfGroupDebug('${virtualEntityId}') ? ${_retVal}`); }
      return _retVal;
    }
}