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
    styleUrls: ['./sz-how-entity.component.scss']
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
    /*public get orderedFeatures(): string[] {
      return this._featureTypesOrdered
    }*/
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
      if(!this._resolutionSteps) { return undefined; }
      if(!this.howUIService.stepNodes || this.howUIService.stepNodes === undefined || (this.howUIService.stepNodes && this.howUIService.stepNodes.length <= 0)) {
        let _stepNodes = this.getResolutionStepsAsNodes(this._resolutionSteps, this._stepNodeGroups);
        let _nestedStepNodes: Array<SzResolutionStepNode> = [];
        if(this.finalCardsData) {
          // we have final card data
          _nestedStepNodes = this.finalCardsData.map((fVirtualEntity: SzVirtualEntity) => {
            let _resolvedVirtualEntity = this.virtualEntitiesById && this.virtualEntitiesById.has && this.virtualEntitiesById.has(fVirtualEntity.virtualEntityId) ? this.virtualEntitiesById.get(fVirtualEntity.virtualEntityId) : undefined;
            let _fEntityAsStepNode: SzResolutionStepNode = Object.assign({
              id: fVirtualEntity.virtualEntityId,
              itemType: SzResolutionStepListItemType.FINAL,
              stepType: SzResolutionStepDisplayType.FINAL,
              isMemberOfGroup: false,
              resolvedVirtualEntity: _resolvedVirtualEntity
            }, fVirtualEntity);
            // encode {dataSource: string, recordId: string, internalId: number} as "${dataSource}:${recordId}:${internalId}"
            let _recsToCheckFor = _fEntityAsStepNode.records.map((ds)=> `${ds.dataSource}:${ds.recordId}:${ds.internalId}`);
            if(_stepNodes && _stepNodes.length > 0 && _recsToCheckFor) {
              // see if any step nodes should be children of this final card
              let itemsAsChildren = _stepNodes.filter((stepNode: SzResolutionStepNode) => {
                let _allRecordsForStepNode    = this.getRecordsForNode(true, stepNode);
                // is all of the recordIds in the stepNode in the finalEntity
                let _allRecordsInFinalEntity  = _allRecordsForStepNode.every((szVirtualRecord: SzVirtualEntityRecord) => {
                  return _recsToCheckFor.includes(`${szVirtualRecord.dataSource}:${szVirtualRecord.recordId}:${szVirtualRecord.internalId}`);
                });
                //stepNode = Object.assign(stepNode, {childRecords: _allRecordsForStepNode});
                return _allRecordsInFinalEntity;
              });
              _fEntityAsStepNode.children         = itemsAsChildren;

              _fEntityAsStepNode.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, _fEntityAsStepNode);
              //if(_fEntityAsStepNode.virtualEntityIds) console.info(`final entities virtual id members: [${_fEntityAsStepNode.virtualEntityIds.join(',')}]`, _fEntityAsStepNode.virtualEntityIds, _fEntityAsStepNode.children);
            }
            return _fEntityAsStepNode;
          });
        } else {
          _nestedStepNodes = _stepNodes;
        }
        this.howUIService.stepNodes   = _nestedStepNodes;
        //console.log(`stepNodes cache set: `, this.howUIService.stepNodes);
      } else {
        //console.warn(`stepNodes already initialized, pulling from cache: `, this.howUIService.stepNodes);
      }
      return this.howUIService.stepNodes;
    }
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

              this._stepNodeGroups              = this.getDefaultStepNodeGroups(this._resolutionSteps);
              //let _interimSteps                 = this.getInterimStepNodes(this._resolutionSteps);
              //console.log(`interim steps: `, _interimSteps);
              this.howUIService.stepNodeGroups  = this._stepNodeGroups;
              this.howUIService.stepNodes       = this.stepNodes;
            }
            if(this._data && this._data.finalStates && this._data.resolutionSteps) {
              let traversedNodes = this.traverseStepsFromFinalStates(this._data.finalStates, this._data.resolutionSteps);
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

      console.log(`isStepMemberOfStack("${vId}") : `, retVal, this.howUIService.stepGroupStacks);
    }
    /** if step can be a member of a stack group returns true */
    stepCanBeUnPinned(vId) {
      let retVal = this.howUIService.stepCanBeUnPinned(vId, true);
      console.log(`stepCanBeUnPinned("${vId}") : ${retVal}`, this.howUIService.stepGroupStacks);
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
    private getDefaultStepNodeGroups(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepNode> {
      let retVal = new Map<string, SzResolutionStepNode>();
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }

      if(_rSteps && _rSteps.length > 1) {
        let _stepNodesForInterimEntities = this.getStepNodesForInterimEntities(_rSteps);
        let _currentGroupId;//   = uuidv4();
        //console.log(`generated new uuid: ${_currentGroupId}`)

        let _filteredSteps = _rSteps.filter((resStep: SzResolutionStep, stepArrIndex: number) => {
          // if step is a member of an interim entity we should 
          // exclude it from list
          return !this.isStepChildOfNode(resStep, _stepNodesForInterimEntities) && !(SzHowUIService.getResolutionStepCardType(resStep) === SzResolutionStepDisplayType.MERGE);
        });

        _filteredSteps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          // check to see if we have any "top-level" collapsible groups
          let futureStepType  = _rSteps[(stepArrIndex + 1)]  ? SzHowUIService.getResolutionStepCardType((_rSteps[(stepArrIndex + 1)] as SzResolutionStep), resStep.stepNumber) : undefined;
          let currentStepType = _rSteps[stepArrIndex]        ? SzHowUIService.getResolutionStepCardType((_rSteps[ stepArrIndex     ] as SzResolutionStep), resStep.stepNumber) : undefined;
          let lastStepType    = _rSteps[(stepArrIndex - 1)]  ? SzHowUIService.getResolutionStepCardType((_rSteps[(stepArrIndex - 1)] as SzResolutionStep), resStep.stepNumber) : undefined;
          if(currentStepType !== SzResolutionStepDisplayType.ADD){ 
            //_resolutionStepsWithGroups.push(resStep);
          } else {
            // current type is "add"
              // check if previous step was add
              // if so add this item to previous item
              let _wrappedStep = Object.assign(resStep, {
                id: resStep.resolvedVirtualEntityId
              });
              if(lastStepType === SzResolutionStepDisplayType.ADD) {
                retVal.get(_currentGroupId).children.push(_wrappedStep);
                this.howUIService.collapseNode(resStep.resolvedVirtualEntityId, SzResolutionStepListItemType.STEP);
                //console.log(`${stepArrIndex} | previous step was add operation. append`, retVal.get(_currentGroupId));
                //(_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)] as SzResolutionStep[]).push(resStep);
              } else if(futureStepType === SzResolutionStepDisplayType.ADD) {
                // this is the first "add record" in a sequence of at least
                // two add records
                _currentGroupId   = uuidv4();
                retVal.set(_currentGroupId, {
                  id: _currentGroupId,
                  itemType: SzResolutionStepListItemType.STACK,
                  children: []
                });
                // add item to stack
                retVal.get(_currentGroupId).children.push(_wrappedStep);
                // collapse stack itself by default, and all individual steps
                this.howUIService.collapseNode(_currentGroupId, SzResolutionStepListItemType.STACK);
                // step is always "ADD" type so it's always a "STEP"
                this.howUIService.collapseNode(resStep.resolvedVirtualEntityId, SzResolutionStepListItemType.STEP);
                //_resolutionStepsWithGroups.push([resStep]);
                //console.log(`${stepArrIndex} | first add operation in series`, retVal.get(_currentGroupId));
              } else {
                // this is a "singular" "add record" step, do not group it
                //_resolutionStepsWithGroups.push(resStep);
              }

              //retVal.get(_currentGroupId).virtualEntityIds = retVal.get(_currentGroupId).children.map((rStep: SzResolutionStep) => { return rStep.resolvedVirtualEntityId; });
              if(retVal.has(_currentGroupId)) {
                retVal.get(_currentGroupId).virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, retVal.get(_currentGroupId));
              } else {
                console.warn(`NO GROUP(${_currentGroupId}) ID!!! `, retVal);
              }
          }
        });

        _stepNodesForInterimEntities.forEach((group, key) => {
          retVal.set(key, group);
          this.howUIService.collapseNode(group.id, SzResolutionStepListItemType.STEP);
        });
        
      }
      //console.log(`getDefaultStepNodeGroups()`,retVal, _rSteps)
      return retVal;
    }
    /**
     * @internal 
     * this method extends the SzResolutionStep objects returned from the api endpoint and applies grouping
     * and stack wrappers to contiguous steps etc so that the data is more appropriate for display.
     */
    public getResolutionStepsAsNodes(steps: SzResolutionStep[], groups: Map<string, SzResolutionStepNode>): SzResolutionStepNode[] {
      let retVal: SzResolutionStepNode[] = [];
      // extend groups recursively
      groups  = this.getStepNodeGroupsRecursively(this._resolutionSteps, groups);
      //let steps         = this.getResolutionStepNodes(this._resolutionSteps, nestedGroups);
      
      // create "groups" for multiple sequential "add record" steps
      if(steps && steps.length > 0) {
        let _resolutionStepsWithGroups: Array<SzResolutionStepNode> = [];

        steps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          // check to see if step is member of group
          let _stepIsMemberOfGroup        = this.stepIsMemberOfGroup(resStep.resolvedVirtualEntityId, groups);
          let _stepHasMembers             = this.stepHasMembers(resStep.resolvedVirtualEntityId, groups);
          
          // check whether or not step is member of group
          //if(resStep.resolvedVirtualEntityId === 'V200004-S1'){
          //  console.log(`\tV200004-S1: is group member? ${_stepIsMemberOfGroup} | has members ? ${_stepHasMembers}`);
          //}
          if(!_stepIsMemberOfGroup && !_stepHasMembers) {
            // item is not member of group or interim step group
            // add item to array
            let _stepToAdd: SzResolutionStepNode = Object.assign({
              id: resStep.resolvedVirtualEntityId,
              itemType: SzResolutionStepListItemType.STEP,
              stepType: SzHowUIService.getResolutionStepCardType(resStep),
              isMemberOfGroup: _stepIsMemberOfGroup,
            }, resStep);
            if(_stepIsMemberOfGroup) { _stepToAdd.memberOfGroup = this.getResolutionStepGroupIdByMemberVirtualId(resStep.resolvedVirtualEntityId, groups); }
            _resolutionStepsWithGroups.push(_stepToAdd);
            //if(resStep.resolvedVirtualEntityId === 'V200004-S1'){
            //  console.log(`\tadded V200004-S1 to steps list: `, _resolutionStepsWithGroups);
            //}
          } else {
            // item is in group, if group has not been added already add it
            let _stepGroup            = _stepIsMemberOfGroup ? this.getResolutionStepGroupByMemberVirtualId(resStep.resolvedVirtualEntityId, groups) : this.getResolutionStepGroupById(resStep.resolvedVirtualEntityId, groups);
            let groupAlreadyInArray   = _resolutionStepsWithGroups.includes(_stepGroup);
            if(!groupAlreadyInArray) { 
              _stepGroup.isMemberOfGroup = _stepIsMemberOfGroup;
              if(_stepIsMemberOfGroup) { _stepGroup.memberOfGroup = this.getResolutionStepGroupIdByMemberVirtualId(resStep.resolvedVirtualEntityId, groups); }
              _resolutionStepsWithGroups.push( _stepGroup ); 
            }
          }
        });
        // update "virtualEntityIds" with accurate data
        if(_resolutionStepsWithGroups && _resolutionStepsWithGroups.map) {
          _resolutionStepsWithGroups.map((_sN) => {
            _sN.virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, _sN);
          });
        }
        // filter out top level groups or items that are members of groups
        //if(_resolutionStepsWithGroups && _resolutionStepsWithGroups.map) {
        //  _resolutionStepsWithGroups.map((_sN) => {
        //    _sN.virtualEntityIds = this.getVirtualEntityIdsForNode(_sN);
        //  });
        //}
        // set return value to temporary copy
        retVal  = _resolutionStepsWithGroups;
      }
      // remove any top-level groups that are members of other groups
      if(retVal) {
        retVal = retVal.filter((rNode) => {
          return !this.stepIsMemberOfGroup(rNode.id, groups);
        });
        console.log(`\t\t...done`, retVal);
      }
      //console.info(`getResolutionStepsAsNodes() `, retVal, this._resolutionSteps, groups);
      return retVal;
    }
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
     * This method returns node wrappers as SzResolutionStepNode objects. Objects can have 'children' objects of the same 
     * type.. which can also have children etc. This is a method that converts the FLAT array of steps to a fully nested collection of 
     * nodes suitable for rendering.
     * @param _rSteps steps to be nested
     * @param defaultStepGroups flat map of step nodes that contain other step nodes. nodes that have no children are excluded.
     * @returns 
     */
    private getStepNodeGroupsRecursively (_rSteps?: Array<SzResolutionStep>, defaultStepGroups?: Map<string, SzResolutionStepNode>): Map<string, SzResolutionStepNode> {
      let _stepGroups       = defaultStepGroups ? defaultStepGroups : this.getDefaultStepNodeGroups(_rSteps);
      let _recursiveGroups:Map<string, SzResolutionStepNode> = new Map();
      _stepGroups.forEach((sGroup: SzResolutionStepNode, sGKey: string) => {
        _recursiveGroups.set(sGKey, this.nestInterimStepsForNodeGroup(_stepGroups, sGroup));
      })
      if(_stepGroups && _stepGroups.forEach) {
        // for each map, collect it's virtual ids
        for (let [key, value] of  _stepGroups.entries()) {
          _stepGroups.get(key).virtualEntityIds = SzHowUIService.getVirtualEntityIdsForNode(false, value);
        }
      }
      return _recursiveGroups;
    }
    private traverseStepsFromFinalStates(finalStates: SzVirtualEntity[], rSteps: {[key: string]: SzResolutionStep}) {
      let topLevelSteps = finalStates.map((fVirt)=>{
        return rSteps[fVirt.virtualEntityId] ? rSteps[fVirt.virtualEntityId] : undefined;
      }).filter((fTopLvlStep)=>{ return fTopLvlStep !== undefined});
      console.info(`traverseStepsFromFinalStates: `, finalStates, topLevelSteps);

      if(topLevelSteps && topLevelSteps.length > 0) {
        let stepsByVirtualId  = new Map<string, SzResolutionStep>();
        for(let rKey in rSteps) {
          stepsByVirtualId.set(rKey, rSteps[rKey]);
        }
        let retVal = this.traverseStepsAndNestInterimNodes(topLevelSteps, stepsByVirtualId, false, true);
        console.info(`traverseStepsFromFinalStates lineage: `, retVal);
      }
    }
    private traverseStepsAndNestInterimNodes(_rSteps: Array<SzResolutionStep>, stepsByVirtualId: Map<string, SzResolutionStep>, parentIsMerge?: boolean, parentIsFinal?: boolean): Array<SzResolutionStepNode> {
      let retVal:Array<SzResolutionStepNode> = [];
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      _rSteps.forEach((step)=>{
        let stepsToTraverse = [];
        let stepType  = this.getResolutionStepCardType(step);
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
            let stepChildren = this.traverseStepsAndNestInterimNodes(stepsToTraverse, stepsByVirtualId, isMerge);
            // for interim steps we need to add the step as a child of itself so it shows up INSIDE the group
            extendedNode.children   = [(Object.assign({
              id: step.resolvedVirtualEntityId,
              stepType: stepType,
              itemType: SzResolutionStepListItemType.STEP,
              isInterim: false
            }, step) as SzResolutionStepNode)].concat(stepChildren);
            retVal.push(extendedNode);
          } else {
            // we still need to traverse these but we're not going to mark them as interim
            let stepAncestors = this.traverseStepsAndNestInterimNodes(stepsToTraverse, stepsByVirtualId, isMerge);
            if(parentIsFinal) {
              // we want to grab the ancestors and just append as children
              extendedNode.children  = stepAncestors;
              retVal.push(extendedNode);
            } else {
              // we are just going to inject the ancestors at the same level
              // these nodes
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
        } else {
          // just append to list
          retVal.push(extendedNode);
        }
      });
      return retVal;
    }

    /**
     * @internal
     * Gets a flat map of step nodes that are the precursor to merge/interim steps. 
     */
    private getInterimStepNodes(_rSteps?: Array<SzResolutionStep>, stepsByVirtualId?: Map<string, SzResolutionStep>, interimSteps?: Map<string, SzResolutionStepNode>, isTopLevel?: boolean, levelsDeep?: number): Map<string, SzResolutionStepNode> {
      /**
       * 
        iterate over steps
        for each top level merge
            get component children of merge
            direct children are automatically "interim entities" even if they are singletons
            if top level merge
                add merge to return as "interim entity"
            for each child that is not singleton
                recurse
                    add recursive return value to return value 
            
            return interims
       */
      let retVal            = new Map<string, SzResolutionStepNode>();
      levelsDeep            = levelsDeep === undefined ? -1 : levelsDeep
      interimSteps          = interimSteps ? interimSteps : new Map<string, SzResolutionStepNode>();
      let localInterimSteps = [];
      let stepsToCrawl      = [];
      let mergeSteps        = [];
      let itemsToDebug      = ['V100001-S43','V100001-S42','V100001-S41'];

      if(isTopLevel === undefined) {
        console.warn(`TOP LEVEL`);
      }
      isTopLevel            = isTopLevel === undefined ? true : isTopLevel;
      
      if(!stepsByVirtualId) {
        stepsByVirtualId  = new Map<string, SzResolutionStep>();
        if(_rSteps && _rSteps.length > 1) {
          _rSteps.forEach((step)=>{
            stepsByVirtualId.set(step.resolvedVirtualEntityId, step);
          });
        }
      }
      levelsDeep++;
      let _ts = '';
      for(var i=0; i <= levelsDeep; i++) {
        _ts = _ts+'\t';
      }
       
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      if(_rSteps && _rSteps.length > 0) {
        let iDbg      = !isTopLevel && _rSteps && _rSteps.some((cs) => {
          return cs && cs.resolvedVirtualEntityId && itemsToDebug.indexOf(cs.resolvedVirtualEntityId) > -1;
        });
        if(iDbg) {
          console.warn(`scan check for V100001-S42!!!`);
        }

        _rSteps.forEach((step)=>{
          
          let _stepType = this.getResolutionStepCardType(step);
          // if items are direct descendents of a interim step
          // then we check those too regardless
          if(isTopLevel) {
            if(_stepType === SzResolutionStepDisplayType.MERGE) {
              // this is an interim
              mergeSteps.push(step.resolvedVirtualEntityId);
              localInterimSteps.push(step);
              stepsToCrawl.push(step);
              // nodes directly related to this node that are not singletons
              // !!ARE!! interim nodes regardless of what they actually are
            }
          } else {
            // for items below 0, they are already nested
            // we want to scan those if they're not singletons
            if(
              (step.candidateVirtualEntity && !step.candidateVirtualEntity.singleton) || 
              (step.inboundVirtualEntity && !step.inboundVirtualEntity.singleton)) {
              stepsToCrawl.push(step);
            }
          }
          if(iDbg) {
            console.log(`${_ts}\tdo we have subchildren?`, (isTopLevel && _stepType === SzResolutionStepDisplayType.MERGE), (
              (step.candidateVirtualEntity && !step.candidateVirtualEntity.singleton) || 
              (step.inboundVirtualEntity && !step.inboundVirtualEntity.singleton)), stepsToCrawl);
          }
        });

        // for each merge step OR child of merge step, check to see if their members are also interim steps
        stepsToCrawl.forEach((iStep)=>{
          let cMember = stepsByVirtualId.get(iStep.candidateVirtualEntity.virtualEntityId);
          let iMember = stepsByVirtualId.get(iStep.inboundVirtualEntity.virtualEntityId);
          let stepsToCheck = Array<SzResolutionStep>();
          
          
          if(
            (cMember && cMember.candidateVirtualEntity && !cMember.candidateVirtualEntity.singleton) || 
            (cMember && cMember.inboundVirtualEntity && !cMember.inboundVirtualEntity.singleton)
          ) { 
            stepsToCheck.push(cMember); 
          }
          if(
            (iMember && iMember.candidateVirtualEntity && !iMember.candidateVirtualEntity.singleton) || 
            (iMember && iMember.inboundVirtualEntity && !iMember.inboundVirtualEntity.singleton)
          ) { 
            stepsToCheck.push(iMember); 
          }
          if(iDbg) {
            console.log(`${_ts}\tchild steps to crawl: `, stepsToCheck);
          }
          // add local interim steps to retVal
          let _gVal = Object.assign({
            id: iStep.resolvedVirtualEntityId,
            //stepType: SzHowUIService.getResolutionStepCardType(resStep),
            stepType: SzResolutionStepDisplayType.INTERIM,
            itemType: SzResolutionStepListItemType.GROUP,
            children: []
          }, iStep);
          retVal.set(iStep.resolvedVirtualEntityId, _gVal);

          if(stepsToCheck && stepsToCheck.length > 0) {
            // call method again and let it modify the interimSteps array in place by passing
            // it down the chain
            let subInterimNodes = this.getInterimStepNodes(stepsToCheck, stepsByVirtualId, interimSteps, false, levelsDeep);
            if(iDbg) {
              console.log(`${_ts}\tresult of Sub Call for [${stepsToCheck.map((sr)=>{ return sr.resolvedVirtualEntityId}).join(',')}]: `, subInterimNodes);
            }
            
            if(subInterimNodes && subInterimNodes.size > 0) {
              // merge map
              interimSteps = new Map([...interimSteps, ...subInterimNodes]);
              retVal  = new Map([...retVal, ...subInterimNodes])
            }
          }
        });
      }
      if(isTopLevel){
        console.log(`${_ts}steps by vid:`, stepsByVirtualId, retVal);
      }
      console.log(`${_ts}interim steps recursive: `, _rSteps, interimSteps);

      return retVal;
    }

    public getResolutionStepCardType(step: SzResolutionStep, stepNumber?: number): SzResolutionStepDisplayType {
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
        /*
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
        */
      }
      return undefined;
    }

    /**
     * @internal
     * Gets a flat map of step nodes that are the precursor to merge/interim steps. 
     */
    private getStepNodesForInterimEntities(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepNode> {
      let retVal        = new Map<string, SzResolutionStepNode>();
      let interimGroups = new Map<string, SzResolutionStepNode>();

      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      if(_rSteps && _rSteps.length > 1) {
        // first initialize a group for each "merge" step
        _rSteps.filter((resStep: SzResolutionStep) => {
          return SzHowUIService.getResolutionStepCardType(resStep) === SzResolutionStepDisplayType.MERGE;
        }).forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          interimGroups.set(resStep.resolvedVirtualEntityId, Object.assign({
            id: resStep.resolvedVirtualEntityId,
            //stepType: SzHowUIService.getResolutionStepCardType(resStep),
            stepType: SzResolutionStepDisplayType.INTERIM,
            itemType: SzResolutionStepListItemType.GROUP,
            children: []
          }, resStep));
        });

        // now go through all the steps
        // and for each member in a interim entity 
        // create a group
        _rSteps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          let vIdToLookFor  = resStep.resolvedVirtualEntityId;
          interimGroups.forEach((value: SzResolutionStepNode, key: string) => {
            if(value && (
              value.candidateVirtualEntity.virtualEntityId === vIdToLookFor || 
              value.inboundVirtualEntity.virtualEntityId === vIdToLookFor)) {
              
              // step is a member of a merge
              if(!retVal.has(vIdToLookFor)) {
                // create a group for it
                let stepToInherit = this._resolutionStepsByVirtualId[vIdToLookFor] ? this._resolutionStepsByVirtualId[vIdToLookFor] : value;
                retVal.set(vIdToLookFor, Object.assign({
                  id: stepToInherit.resolvedVirtualEntityId,
                  stepType: value.stepType ? value.stepType : SzHowUIService.getResolutionStepCardType(value),
                  itemType: SzResolutionStepListItemType.GROUP,
                  children: [Object.assign({id: resStep.resolvedVirtualEntityId, stepType: SzHowUIService.getResolutionStepCardType(resStep), itemType: SzResolutionStepListItemType.STEP}, resStep)],
                  virtualEntityIds: [resStep.candidateVirtualEntity.virtualEntityId, resStep.inboundVirtualEntity.virtualEntityId]
                  /*virtualEntityIds: [resStep.candidateVirtualEntity.virtualEntityId, resStep.inboundVirtualEntity.virtualEntityId].filter((virtualEntityId: string) => {
                    // make sure step is not another interim group
                    return !interimGroups.has(virtualEntityId);
                  })*/
                }, stepToInherit));
              }
              // for each step who's resolvedId matches the
              // iterim step id add it as a resolutionStep
              if(this._resolutionStepsByVirtualId) {
                // we only want to add steps if they are "Add Record" or "Create Entity" steps
                if(this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId]) {
                  let _stepType   = SzHowUIService.getResolutionStepCardType(this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId]);
                  let _stepToAdd  = this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId];
                  retVal.get(vIdToLookFor).children.push(Object.assign({id: _stepToAdd.resolvedVirtualEntityId, stepType: SzHowUIService.getResolutionStepCardType(_stepToAdd), itemType: SzResolutionStepListItemType.STEP}, _stepToAdd));
                  //if(_stepType === SzResolutionStepDisplayType.CREATE || _stepType === SzResolutionStepDisplayType.ADD) { retVal.get(vIdToLookFor).children.push(_stepToAdd); }
                  //retVal.get(vIdToLookFor).virtualEntityIds.push(resStep.candidateVirtualEntity.virtualEntityId);
                  if(retVal.get(vIdToLookFor).virtualEntityIds.indexOf(_stepToAdd.candidateVirtualEntity.virtualEntityId) < 0){ retVal.get(vIdToLookFor).virtualEntityIds.push(resStep.candidateVirtualEntity.virtualEntityId); }
                }
                if(this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId]) {
                  let _stepType   = SzHowUIService.getResolutionStepCardType(this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId]);
                  let _stepToAdd  = this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId];
                  retVal.get(vIdToLookFor).children.push(Object.assign({id: _stepToAdd.resolvedVirtualEntityId, stepType: SzHowUIService.getResolutionStepCardType(_stepToAdd), itemType: SzResolutionStepListItemType.STEP}, _stepToAdd));
                  //if(_stepType === SzResolutionStepDisplayType.CREATE || _stepType === SzResolutionStepDisplayType.ADD) { 
                  //  retVal.get(vIdToLookFor).children.push(_stepToAdd); 
                  //}
                  if(retVal.get(vIdToLookFor).virtualEntityIds.indexOf(resStep.inboundVirtualEntity.virtualEntityId) < 0){ retVal.get(vIdToLookFor).virtualEntityIds.push(resStep.inboundVirtualEntity.virtualEntityId); }
                }
                if(!(retVal.get(vIdToLookFor).children && retVal.get(vIdToLookFor).children.length > 0)) {
                  console.warn(`could not find resolution step for ${resStep.inboundVirtualEntity.virtualEntityId} or ${resStep.candidateVirtualEntity.virtualEntityId}`, this._resolutionStepsByVirtualId, retVal.get(vIdToLookFor));
                }
              } else {
                console.warn('_resolutionStepsByVirtualId is null', this._resolutionStepsByVirtualId);
              }
            }
          });
        });
      }

      //console.log('getStepNodesForInterimEntities', retVal);
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
    /**
     * @internal
     * 
     * This is the recursive function used by 'getStepNodeGroupsRecursively' to recursively traverse and return the nested
     * tree of step nodes.
     * 
     * @param stepNodeGroups flat map of step nodes that contain other step nodes. defaults to the result of 'getDefaultStepNodeGroups'.
     * @param stepNode current node context. if the node is an interim step, the step is nested inside a step group.
     */
    private nestInterimStepsForNodeGroup(stepNodeGroups: Map<string, SzResolutionStepNode>, stepNode: SzResolutionStepNode): SzResolutionStepNode {
      let _retVal: SzResolutionStepNode = Object.assign({}, stepNode);
      if(stepNode && stepNode.children && stepNode.itemType === SzResolutionStepListItemType.GROUP && stepNode.stepType === SzResolutionStepDisplayType.INTERIM) {
        //console.log(`_nestInterimStepsForGroup: ${stepNode.id}`);

        // for each interim step, check if any other step groups "mergeStep"'s 
        // "resolvedEntityId" is one of the candidate or inbound virtual entity Id's
        let _stepGroupIdsToLookFor = stepNode.children.map((_s) => {
          return [_s.candidateVirtualEntity.virtualEntityId, _s.inboundVirtualEntity.virtualEntityId]
        }).flat();
        // create "reverse map" so we can just do simple look ups by member ids
        let _stepGroupsByResolvedVirtualIdsMap: Map<string, SzResolutionStepNode[]> = new Map();
        stepNodeGroups.forEach((stepNodeGroup, stepGroupKey) => {
          if(stepNodeGroup && stepNodeGroup.resolvedVirtualEntityId) {
            let _groups = _stepGroupsByResolvedVirtualIdsMap.has(stepNodeGroup.resolvedVirtualEntityId) ? _stepGroupsByResolvedVirtualIdsMap.get(stepNodeGroup.resolvedVirtualEntityId) : [];
            // add item to group
            _groups.push(stepNodeGroup);
            // update value
            _stepGroupsByResolvedVirtualIdsMap.set(stepNodeGroup.resolvedVirtualEntityId, _groups);
          }
        });
        //console.log(`\tlooking for step groups: ${_stepGroupIdsToLookFor.join(', ')} in `, stepNodeGroups);
        //console.log(`\tstep groups by resolvedId: `, _stepGroupsByResolvedVirtualIdsMap);

        if(_stepGroupIdsToLookFor && _stepGroupIdsToLookFor.length && stepNodeGroups) {

          let _subGroups = _stepGroupIdsToLookFor.map((vId) => {
            if(_stepGroupsByResolvedVirtualIdsMap.has(vId)) {
              return _stepGroupsByResolvedVirtualIdsMap.get(vId);
            }
            return undefined;
          }).flat()
          //console.log(`\t\t_subGroups: `, _subGroups);
          _subGroups = _subGroups.filter((sgVal) => { return sgVal !== undefined; });
          //console.log(`\t\tfiltered _subGroups: `, _subGroups);

          // for each sub stepGroup call this method again for each
          //_retVal.stepGroups = _subGroups;
          
          _retVal.children = _retVal.children.concat(_subGroups.map(this.nestInterimStepsForNodeGroup.bind(this, stepNodeGroups)));
          _retVal.children.sort((a, b) => {
            return (a.stepNumber > b.stepNumber) ? -1 : 1;
          });
        }
      } else {
        //console.warn('umm.. whut?? ', stepNode);
      }
      return _retVal;
    }

    // -------------------------------- debug methods (delete or comment out for release) --------------------------------

    stepIsMemberOfGroupDebug(virtualEntityId: string, debug?: boolean) {
      let _retVal = this.stepIsMemberOfGroup(virtualEntityId, this.howUIService.stepNodeGroups);
      if(debug !== false) { console.log(`stepIsMemberOfGroupDebug('${virtualEntityId}') ? ${_retVal}`); }
      return _retVal;
    }

    /*getRootNodeContainingNode(vId) {
      let retVal = this.howUIService.getRootNodeContainingNode(vId);
      console.log(`getRootNodeContainingNode("${vId}") : `, retVal);
    }
    getParentContainingNode(vId) {
      let retVal = this.howUIService.getParentContainingNode(vId);
      console.log(`getParentContainingNode("${vId}") : `, retVal);
    }*/

}