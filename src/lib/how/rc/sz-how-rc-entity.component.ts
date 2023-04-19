import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzEntityIdentifier, SzFeatureMode, SzHowEntityResponse, SzHowEntityResult, SzRecordId, SzRecordIdentifier, SzRecordIdentifiers, SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord, SzVirtualEntityResponse 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { 
  SzHowFinalCardData, 
  SzVirtualEntityRecordsClickEvent, 
  SzResolvedVirtualEntity, 
  SzResolutionStepGroup,
  SzResolutionStepDisplayType 
} from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil, zip, map } from 'rxjs';
import { parseBool, parseSzIdentifier } from '../../common/utils';
import { v4 as uuidv4} from 'uuid';
import { SzResolutionStepListItem, SzResolutionStepListItemType, SzResolutionStepNode } from '../../models/data-how';
import { SzHowRCVirtualEntityDialog } from './sz-how-rc-virtual-entity-dialog.component';


/**
 * Display the "How" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-entity entityId="5"&gt;&lt;/sz-how-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-how-entity entityId="5"&gt;&lt;/sz-wc-how-entity&gt;<br/>
*/
@Component({
    selector: 'sz-how-rc-entity',
    templateUrl: './sz-how-rc-entity.component.html',
    styleUrls: ['./sz-how-rc-entity.component.scss']
})
export class SzHowRCEntityComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    //public finalCardsData: SzHowFinalCardData[];
    public finalCardsData: SzVirtualEntity[];
    private _data: SzHowEntityResult;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _featureTypesOrdered: string[] | undefined;
    private _resolutionSteps: Array<SzResolutionStep>;
    private _resolutionStepsByVirtualId: {[key: string]: SzResolutionStep};
    private _resolutionStepGroupsOld: Map<string, SzResolutionStepGroup> = new Map<string, SzResolutionStepGroup>();
    //private _stepGroups: Map<string, SzResolutionStepGroup>     = new Map<string, SzResolutionStepGroup>();
    private _stepNodeGroups: Map<string, SzResolutionStepNode>  = new Map<string, SzResolutionStepNode>();

    private _isLoading                        = false;
    private _showNavigation                   = true;
    private _entityId: SzEntityIdentifier;
    private _dataLoadedForId: SzEntityIdentifier;
    private _expandCardsWhenLessThan: number  = 2;
    private _entityIdChange: Subject<SzEntityIdentifier>      = new Subject<SzEntityIdentifier>();
    public   entityIdChange                                   = this._entityIdChange.asObservable();
    private _dataChange: Subject<SzHowEntityResult>           = new Subject<SzHowEntityResult>();
    public   dataChange                                       = this._dataChange.asObservable();
    private _finalEntitiesChange: Subject<SzVirtualEntity[]>  = new Subject<SzVirtualEntity[]>();
    public  finalEntitiesChange                               = this._finalEntitiesChange.asObservable();
    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    public  virtualEntitiesDataChange                         = this._virtualEntitiesDataChange.asObservable();
    private _virtualEntityInfoLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    public  virtualEntityInfoLinkClick                        = this._virtualEntityInfoLinkClick.asObservable();
    @Output() public dataChanged                              = new EventEmitter<SzHowEntityResult>();
    @Output() public virtualEntityInfoLinkClicked             = new EventEmitter<SzVirtualEntityRecordsClickEvent>();
    @Output()
    loading: EventEmitter<boolean>                            = new EventEmitter<boolean>();
    @Output() public virtualEntitiesDataChanged               = new EventEmitter<Map<string, SzResolvedVirtualEntity>>();
    @Input() public set entityId(value: SzEntityIdentifier) {
      this._entityId = value;
      if(this._dataLoadedForId != this.entityId) {
        this._entityIdChange.next(this.entityId);
      }
    }
    public get entityId(): SzEntityIdentifier {
      return this._entityId;
    }
    public get resolutionSteps(): Array<SzResolutionStep> | undefined {
      return this._resolutionSteps;
    }

    public get resolutionStepsByVirtualId() {
      return this._resolutionStepsByVirtualId;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
      return this._virtualEntitiesById;
    }
    public get orderedFeatures(): string[] {
      return this._featureTypesOrdered
    }
    public get isLoading(): boolean {
      return this._isLoading;
    }
    public get showNavigation(): boolean {
      return this._showNavigation;
    }
    @Input() public set showNavigation(value: boolean | string) {
      this._showNavigation = parseBool(value);
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        public dialog: MatDialog,
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {
      this.getFeatureTypeOrderFromConfig();
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
            this.howUIService.expandFinal(vEnt.virtualEntityId);
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

    private onEntityIdChange() {
      if(this.entityId) {
        // get entity data
        this._isLoading = true;
        this.loading.emit(true);
        this.getData(this.entityId).subscribe((resp: SzHowEntityResponse) => {
            console.log(`how response: ${resp}`, resp.data);
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
                this.howUIService.finalStates  = _finalStatesData;
            }
            if(this._data.resolutionSteps && Object.keys(this._data.resolutionSteps).length > 0) {
                // we have resolution steps
                let _resSteps   = [];
                let _stepCount  = Object.keys(this._data.resolutionSteps).length;
                for(let rKey in this._data.resolutionSteps) {
                  let _stepType = SzHowUIService.getResolutionStepCardType(this._data.resolutionSteps[rKey]);
                  if(_stepType !== SzResolutionStepDisplayType.CREATE || _stepCount <= this._expandCardsWhenLessThan) {
                    //console.log(`#${this._data.resolutionSteps[rKey].stepNumber} type ${_stepType}`);
                    this.howUIService.expandStep(this._data.resolutionSteps[rKey].resolvedVirtualEntityId);
                  }
                  _resSteps.push( this._data.resolutionSteps[rKey] );
                }
                this._resolutionSteps = _resSteps.reverse(); // we want the steps in reverse for display purposes
            }
            if(this._resolutionSteps){
              this._resolutionStepGroupsOld     = this.getDefaultResolutionStepGroups(this._resolutionSteps);
              //this._stepGroups                  = this.getDefaultStepGroups(this._resolutionSteps);
              this._stepNodeGroups              = this.getDefaultStepNodeGroups(this._resolutionSteps);
              this.howUIService.stepNodeGroups  = this._stepNodeGroups;
              //this.howUIService.stepGroups      = this._stepGroups;
              this.howUIService.stepNodes       = this.getResolutionStepsAsNodes(this._resolutionSteps, this._stepNodeGroups);
              //this.howUIService.stepsList       = this.getResolutionStepsWithGroups(this._resolutionSteps, this._stepGroups);
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

    collapseAllSteps() {
      this.howUIService.collapseAll();
    }

    public cooerceToStep(stepItem: SzResolutionStep | SzResolutionStepGroup): SzResolutionStep {
      let retVal: SzResolutionStep | undefined;
      if((stepItem as SzResolutionStep).stepNumber) {
        retVal = (stepItem as SzResolutionStep);
      }
      return retVal;
    }

    public cooerceToStepGroup(stepItem: SzResolutionStep | SzResolutionStepGroup): SzResolutionStepGroup {
      let retVal: SzResolutionStepGroup | undefined;
      if((stepItem as SzResolutionStepGroup).resolutionSteps || (stepItem as SzResolutionStepGroup).interimSteps || (stepItem as SzResolutionStepGroup).mergeStep) {
        retVal = (stepItem as SzResolutionStepGroup);
      }
      return retVal;
    }

    public getResolutionSteps(): Array<SzResolutionStep | SzResolutionStep[]> {
      let retVal = [];
      if(this._resolutionSteps && this._resolutionSteps.length > 1) {
        retVal = this._resolutionSteps;
      }
      console.info('getResolutionSteps: ', retVal);
      return retVal;
    }

    private getVirtualEntityIdsForNode(step: SzResolutionStepNode) {
      let retVal: string[] = [];
      if(step && step.children && step.children.map) {
        retVal = step.children.map(this.getVirtualEntityIdsForNode.bind(this));
        if(retVal && retVal.flat){ retVal = retVal.flat(); }
      } else {
        retVal.push(step.id);
        retVal.push(step.inboundVirtualEntity.virtualEntityId);
        retVal.push(step.candidateVirtualEntity.virtualEntityId);
      }
      return retVal = Array.from(new Set(retVal)); // de-dupe any values
    }

    public getStepNodesForInterimEntities(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepNode> {
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

      console.log('getStepGroupsForInterimEntities', retVal);
      return retVal;
    }

    public getStepGroupsForInterimEntities(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepGroup> {
      let retVal        = new Map<string, SzResolutionStepGroup>();
      let interimGroups = new Map<string, SzResolutionStepGroup>();

      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      if(_rSteps && _rSteps.length > 1) {
        // first initialize a group for each "merge" step
        _rSteps.filter((resStep: SzResolutionStep) => {
          return SzHowUIService.getResolutionStepCardType(resStep) === SzResolutionStepDisplayType.MERGE;
        }).forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          interimGroups.set(resStep.resolvedVirtualEntityId, {
            id: resStep.resolvedVirtualEntityId,
            mergeStep: resStep
          });
        });
        // now go through all the steps
        // and for each member in a interim entity 
        // create a group
        _rSteps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          let vIdToLookFor  = resStep.resolvedVirtualEntityId;
          interimGroups.forEach((value: SzResolutionStepGroup, key: string) => {
            if(value.mergeStep && (
              value.mergeStep.candidateVirtualEntity.virtualEntityId === vIdToLookFor || 
              value.mergeStep.inboundVirtualEntity.virtualEntityId === vIdToLookFor)) {
              
              // step is a member of a merge
              if(!retVal.has(vIdToLookFor)) {
                // createa a group for it
                retVal.set(vIdToLookFor, {
                  id: vIdToLookFor,
                  mergeStep: value.mergeStep,
                  interimSteps: [resStep],
                  virtualEntityIds: [resStep.candidateVirtualEntity.virtualEntityId, resStep.inboundVirtualEntity.virtualEntityId].filter((virtualEntityId: string) => {
                    // make sure step is not another interim group
                    return !interimGroups.has(virtualEntityId);
                  })
                });
              }
              // for each step who's resolvedId matches the
              // iterim step id add it as a resolutionStep
              if(this._resolutionStepsByVirtualId) {
                // we only want to add steps if they are "Add Record" or "Create Entity" steps
                if(this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId]) {
                  let stepType = SzHowUIService.getResolutionStepCardType(this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId]);
                  if(stepType === SzResolutionStepDisplayType.CREATE || stepType === SzResolutionStepDisplayType.ADD) { retVal.get(vIdToLookFor).interimSteps.push(this._resolutionStepsByVirtualId[resStep.candidateVirtualEntity.virtualEntityId]); }
                }
                if(this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId]) {
                  let stepType = SzHowUIService.getResolutionStepCardType(this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId]);
                  if(stepType === SzResolutionStepDisplayType.CREATE || stepType === SzResolutionStepDisplayType.ADD) { retVal.get(vIdToLookFor).interimSteps.push(this._resolutionStepsByVirtualId[resStep.inboundVirtualEntity.virtualEntityId]  ); }
                }
                if(!(retVal.get(vIdToLookFor).interimSteps && retVal.get(vIdToLookFor).interimSteps.length > 0)) {
                  console.warn(`could not find resolution step for ${resStep.inboundVirtualEntity.virtualEntityId} or ${resStep.candidateVirtualEntity.virtualEntityId}`, this._resolutionStepsByVirtualId, retVal.get(vIdToLookFor));
                }
              } else {
                console.warn('_resolutionStepsByVirtualId is null', this._resolutionStepsByVirtualId);
              }
            }
          });
        });
      }
      console.log('getStepGroupsForInterimEntities', retVal);
      return retVal;
    }

    private _nestInterimStepsForNodeGroup(stepNodeGroups: Map<string, SzResolutionStepNode>, stepNode: SzResolutionStepNode): SzResolutionStepNode {
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
          
          _retVal.children = _retVal.children.concat(_subGroups.map(this._nestInterimStepsForNodeGroup.bind(this, stepNodeGroups)));
          _retVal.children.sort((a, b) => {
            return (a.stepNumber > b.stepNumber) ? -1 : 1;
          });
        }
      } else {
        //console.warn('umm.. whut?? ', stepNode);
      }
      return _retVal;
    }

    public getStepNodeGroupsRecursively (_rSteps?: Array<SzResolutionStep>, defaultStepGroups?: Map<string, SzResolutionStepNode>): Map<string, SzResolutionStepNode> {
      let _stepGroups       = defaultStepGroups ? defaultStepGroups : this.getDefaultStepNodeGroups(_rSteps);
      let _recursiveGroups:Map<string, SzResolutionStepNode> = new Map();
      _stepGroups.forEach((sGroup: SzResolutionStepNode, sGKey: string) => {
        _recursiveGroups.set(sGKey, this._nestInterimStepsForNodeGroup(_stepGroups, sGroup));
      })
      if(_stepGroups && _stepGroups.forEach) {
        // for each map, collect it's virtual ids
        for (let [key, value] of  _stepGroups.entries()) {
          _stepGroups.get(key).virtualEntityIds = this.getVirtualEntityIdsForNode(value);
        }
      }
      return _recursiveGroups;
    }

    private limitStepNodeGroupsToTopLevel(groups?: Map<string, SzResolutionStepNode>): Map<string, SzResolutionStepNode> {
      let retVal = new Map();
      for (let [key, value] of  groups.entries()) {
        let isGroupMemberOfOtherGroup = this.stepIsMemberOfGroup(value.id, groups);
        if(!isGroupMemberOfOtherGroup) {
          retVal.set(key, value);
        }
      }
      return retVal;
    }

    /*
    public getStepNodes() {
      let _steps                = this._resolutionSteps;
      let _defaultStepGroups    = this.getDefaultStepNodeGroups(_steps);
      let _stepGroups           = this.getStepNodeGroupsRecursively(_steps, _defaultStepGroups);

      let _retVal = _steps.map((rStep: SzResolutionStep) => {
        // for each step figure out what type of items it is
        let _newStep: SzResolutionStepNode = Object.assign({
          id: rStep.resolvedVirtualEntityId,
          stepType: SzHowUIService.getResolutionStepCardType(rStep)
        }, rStep);

        if(_stepGroups.has(rStep.resolvedVirtualEntityId)) {
          // item is group
          //_newStep.children
        }

        return _newStep;
      });

      console.info(`getStepNodes: `, _retVal, _stepGroups, _defaultStepGroups);
      return _retVal;
    }*/

    public get stepNodes(): Array<SzResolutionStepNode> {
      if(!this.howUIService.stepNodes || this.howUIService.stepNodes === undefined) {
        this.howUIService.stepNodes   = this.getResolutionStepsAsNodes(this._resolutionSteps, this._stepNodeGroups);
      }
      return this.howUIService.stepNodes;
    }

    public getDefaultStepNodeGroups(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepNode> {
      let retVal = new Map<string, SzResolutionStepNode>();
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      if(_rSteps && _rSteps.length > 1) {
        if(_rSteps && _rSteps.length > 1) {
          let _stepNodesForInterimEntities = this.getStepNodesForInterimEntities(_rSteps);
          let _currentGroupId   = uuidv4();

          let _filteredSteps = _rSteps.filter((resStep: SzResolutionStep, stepArrIndex: number) => {
            // if step is a member of an interim entity we should 
            // exclude it from list
            return !this.isStepMemberOfGroup(resStep, _stepNodesForInterimEntities) && !(SzHowUIService.getResolutionStepCardType(resStep) === SzResolutionStepDisplayType.MERGE);
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
                if(lastStepType === SzResolutionStepDisplayType.ADD) {
                  retVal.get(_currentGroupId).children.push(resStep);
                  this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
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
  
                  retVal.get(_currentGroupId).children.push(resStep);
                  this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                  //_resolutionStepsWithGroups.push([resStep]);
                  //console.log(`${stepArrIndex} | first add operation in series`, retVal.get(_currentGroupId));
                } else {
                  // this is a "singular" "add record" step, do not group it
                  //_resolutionStepsWithGroups.push(resStep);
                }
                retVal.get(_currentGroupId).virtualEntityIds = retVal.get(_currentGroupId).children.map((rStep: SzResolutionStep) => { return rStep.resolvedVirtualEntityId; });
            }
          });
  
          _stepNodesForInterimEntities.forEach((group, key) => {
            retVal.set(key, group);
            this.howUIService.collapseStep(group.id);
          });
        }  
      }
      return retVal;
    }

    public getDefaultStepGroups(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepGroup> {
      let retVal = new Map<string, SzResolutionStepGroup>();
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      if(_rSteps && _rSteps.length > 1) {
        let _stepGroupsForInterimEntities = this.getStepGroupsForInterimEntities(_rSteps);
        let _currentGroupId   = uuidv4();

        let _filteredSteps = _rSteps.filter((resStep: SzResolutionStep, stepArrIndex: number) => {
          // if step is a member of an interim entity we should 
          // exclude it from list
          return !this.isStepMemberOfGroup(resStep, _stepGroupsForInterimEntities) && !(SzHowUIService.getResolutionStepCardType(resStep) === SzResolutionStepDisplayType.MERGE);
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
              if(lastStepType === SzResolutionStepDisplayType.ADD) {
                retVal.get(_currentGroupId).resolutionSteps.push(resStep);
                this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                //console.log(`${stepArrIndex} | previous step was add operation. append`, retVal.get(_currentGroupId));
                //(_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)] as SzResolutionStep[]).push(resStep);
              } else if(futureStepType === SzResolutionStepDisplayType.ADD) {
                // this is the first "add record" in a sequence of at least
                // two add records
                _currentGroupId   = uuidv4();
                retVal.set(_currentGroupId, {
                  id: _currentGroupId,
                  isStackGroup: true,
                  resolutionSteps: []
                });

                retVal.get(_currentGroupId).arrayIndex = stepArrIndex;
                retVal.get(_currentGroupId).resolutionSteps.push(resStep);
                this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                //_resolutionStepsWithGroups.push([resStep]);
                //console.log(`${stepArrIndex} | first add operation in series`, retVal.get(_currentGroupId));
              } else {
                // this is a "singular" "add record" step, do not group it
                //_resolutionStepsWithGroups.push(resStep);
              }
              retVal.get(_currentGroupId).virtualEntityIds = retVal.get(_currentGroupId).resolutionSteps.map((rStep: SzResolutionStep) => { return rStep.resolvedVirtualEntityId; });
          }
        });

        _stepGroupsForInterimEntities.forEach((group, key) => {
          retVal.set(key, group);
          this.howUIService.collapseStep(group.id);
        });

      }
      console.info('getDefaultStepGroups: ', retVal);
      return retVal;
    }

    private getGroupForMemberStep(step: SzResolutionStep, groups?: Map<string, SzResolutionStepGroup>): SzResolutionStepNode {
      let _retVal: SzResolutionStepGroup;
      if(!groups) { groups = this._stepNodeGroups; }
      if(groups && step) {
        let _idToLookFor = step.resolvedVirtualEntityId;
        let _sk = false;
        groups.forEach((groupToSearch: SzResolutionStepGroup, key: string) => {
          if(!_sk && groupToSearch.virtualEntityIds && groupToSearch.virtualEntityIds.indexOf(_idToLookFor) > -1 || groupToSearch.id === _idToLookFor) {
            _retVal = groupToSearch;
          }
        });
      }
      return _retVal;
    }

    public getNestedStepGroup(vId) {
      let _stepGroups = this.getDefaultStepNodeGroups(this._resolutionSteps);
      let _retVal;
      if(_stepGroups && _stepGroups.has(vId)) {
        _retVal = this._nestInterimStepsForNodeGroup(_stepGroups, _stepGroups.get(vId));
        _retVal.virtualEntityIds = this.getVirtualEntityIdsForNode(_retVal);
        console.log(`getNestedStepGroup(${vId})`, _retVal, _stepGroups);
        return _retVal;
      }
      return undefined;
    }

    public getResolutionStepsAsNodesDebug() {
      return this.getResolutionStepsAsNodes(this._resolutionSteps, this._stepNodeGroups);
    }

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
          if(!_stepIsMemberOfGroup && !_stepHasMembers) {
            // item is not member of group or interim step group
            // add item to array
            let _stepToAdd: SzResolutionStepNode = Object.assign({
              id: resStep.resolvedVirtualEntityId,
              itemType: SzResolutionStepListItemType.STEP,
              displayType: this.getListItemType(resStep),
              isMemberOfGroup: _stepIsMemberOfGroup,
            }, resStep);
            if(_stepIsMemberOfGroup) { _stepToAdd.memberOfGroup = this.getResolutionStepGroupIdByMemberVirtualId(resStep.resolvedVirtualEntityId, groups); }
            _resolutionStepsWithGroups.push(_stepToAdd);
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
            _sN.virtualEntityIds = this.getVirtualEntityIdsForNode(_sN);
          });
        }
        // filter out top level groups or items that are members of groups
        /*if(_resolutionStepsWithGroups && _resolutionStepsWithGroups.map) {
          _resolutionStepsWithGroups.map((_sN) => {
            _sN.virtualEntityIds = this.getVirtualEntityIdsForNode(_sN);
          });
        }*/
        // set return value to temporary copy
        retVal  = _resolutionStepsWithGroups;
      }
      // remove any top-level groups that are members of other groups
      if(retVal) {
        retVal = retVal.filter((rNode) => {
          return !this.stepIsMemberOfGroup(rNode.id, groups);
        });
      }
      console.info(`getResolutionStepsAsNodes() `, retVal, this._resolutionSteps, groups);
      return retVal;
    }

    private getStepNodeForChild(step: SzResolutionStep, groups?: Map<string, SzResolutionStepNode>): SzResolutionStepGroup {
      let _retVal: SzResolutionStepNode;
      if(!groups) { groups = this._stepNodeGroups; }
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

    private isStepChildOfStep(step: SzResolutionStep, groups?: Map<string, SzResolutionStepNode>) {
      if(this.getStepNodeForChild(step, groups) !== undefined) {
        return true;
      }
      return false;
    }

    private isStepMemberOfGroup(step: SzResolutionStep, groups?: Map<string, SzResolutionStepGroup>) {
      if(this.getGroupForMemberStep(step, groups) !== undefined) {
        return true;
      }
      return false;
    }

    public getDefaultResolutionStepGroups(_rSteps?: Array<SzResolutionStep>): Map<string, SzResolutionStepGroup> {
      let retVal = new Map<string, SzResolutionStepGroup>();
      if(!_rSteps) {
        _rSteps = this._resolutionSteps;
      }
      // create "groups" for multiple sequential "add record" steps
      if(_rSteps && _rSteps.length > 1) {
        //let _resolutionStepsWithGroups: Array<SzResolutionStep | SzResolutionStep[]> = [];
        let _currentGroupId   = uuidv4();

        _rSteps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          let futureStepType  = _rSteps[(stepArrIndex + 1)]  ? SzHowUIService.getResolutionStepCardType((_rSteps[(stepArrIndex + 1)] as SzResolutionStep), resStep.stepNumber) : undefined;
          let currentStepType = _rSteps[stepArrIndex]        ? SzHowUIService.getResolutionStepCardType((_rSteps[ stepArrIndex     ] as SzResolutionStep), resStep.stepNumber) : undefined;
          let lastStepType    = _rSteps[(stepArrIndex - 1)]  ? SzHowUIService.getResolutionStepCardType((_rSteps[(stepArrIndex - 1)] as SzResolutionStep), resStep.stepNumber) : undefined;

          if(currentStepType !== SzResolutionStepDisplayType.ADD){ 
            //_resolutionStepsWithGroups.push(resStep);
          } else {
            // current type is "add"
              // check if previous step was add
              // if so add this item to previous item
              if(lastStepType === SzResolutionStepDisplayType.ADD) {
                retVal.get(_currentGroupId).resolutionSteps.push(resStep);
                //this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                //console.log(`${stepArrIndex} | previous step was add operation. append`, retVal.get(_currentGroupId));
                //(_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)] as SzResolutionStep[]).push(resStep);
              } else if(futureStepType === SzResolutionStepDisplayType.ADD) {
                // this is the first "add record" in a sequence of at least
                // two add records
                _currentGroupId   = uuidv4();
                retVal.set(_currentGroupId, {
                  id: _currentGroupId,
                  isStackGroup: true,
                  resolutionSteps: []
                });

                retVal.get(_currentGroupId).arrayIndex = stepArrIndex;
                retVal.get(_currentGroupId).resolutionSteps.push(resStep);
                //this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                //_resolutionStepsWithGroups.push([resStep]);
                //console.log(`${stepArrIndex} | first add operation in series`, retVal.get(_currentGroupId));
              } else {
                // this is a "singular" "add record" step, do not group it
                //_resolutionStepsWithGroups.push(resStep);
              }
              retVal.get(_currentGroupId).virtualEntityIds = retVal.get(_currentGroupId).resolutionSteps.map((rStep: SzResolutionStep) => { return rStep.resolvedVirtualEntityId; });
          }
        });
        //retVal  = _resolutionStepsWithGroups;
      }
      //console.info('getResolutionStepGroups: ', retVal);
      return retVal;
    }

    public toggleCollapsedState(step: SzResolutionStep | SzResolutionStepGroup) {
      let vId = (step as SzResolutionStepGroup).id ? (step as SzResolutionStepGroup).id : (step as SzResolutionStep).resolvedVirtualEntityId ? (step as SzResolutionStep).resolvedVirtualEntityId : undefined;
      if(vId) {
        if(this.howUIService.isExpanded(vId)){
          this.howUIService.collapse(vId);
        } else {
          this.howUIService.expand(vId);
        }
      }
    }

    public toggleGroupCollapsedState(gId: SzResolutionStepGroup) {
      this.howUIService.toggleExpansion(undefined, gId.id);
    }

    public isParentEntityHidden(member: SzResolutionStep | SzResolutionStepGroup) {
      let finalEntity = this.getFinalEntityFromMember(member);
      let retVal = false;
      if(finalEntity) {
        retVal = !this.howUIService.isFinalEntityExpanded(finalEntity.virtualEntityId)
      }
      //console.log(`isParentEntityHidden(${retVal})`, finalEntity, member);
      return retVal;
    }

    private getFinalEntityFromMember(member: SzResolutionStep | SzResolutionStepGroup) {
      let isGroup = (member as SzResolutionStepGroup).virtualEntityIds ? true : false;
      // you can dance if you want to !!! ... umm.. umm.. bumm.. SAFETY DANCE!!  OOOOOOhhhOOOhhhOooo SAFETY DANCE!
      if(!(this.finalCardsData && this.finalCardsData.find)) {
        return undefined;
      }
      if(isGroup) {
        // check to see if all virtual entity ids are in a particular group
        let memberAsGroup = (member as SzResolutionStepGroup);
        let parentFinal = this.finalCardsData.find((fEnt: SzVirtualEntity) => {
          let idToLookFor = fEnt.virtualEntityId;
          return memberAsGroup.virtualEntityIds && memberAsGroup.virtualEntityIds.includes(idToLookFor);
        });
        return parentFinal;
      } else {
        // is step
        let memberAsStep = (member as SzResolutionStep);
        let parentFinal = this.finalCardsData.find((fEnt: SzVirtualEntity) => {
          // look through fEnt.records for record matches??!?! (yeah this is dirty)
          // but no better way to tie these two together for now
          let _recordsToLookFor = memberAsStep.candidateVirtualEntity.records.concat(memberAsStep.inboundVirtualEntity.records);
          let _hasAllRecords    = _recordsToLookFor.every((record) => {
            // convert records to strings for comparison
            let _recKeys  = fEnt.records.map((r)=>{ return r.dataSource+':'+r.recordId+':'+r.internalId});
            let hasRecord = _recKeys.includes(record.dataSource+':'+record.recordId+':'+record.internalId);
            return hasRecord;
          });
          /*let _hasSomeRecords   = _recordsToLookFor.some((record) => {
            let _recKeys  = fEnt.records.map((r)=>{ return r.dataSource+':'+r.recordId+':'+r.internalId});
            let hasRecord = _recKeys.includes(record.dataSource+':'+record.recordId+':'+record.internalId);
            return hasRecord;
          });*/
          return _hasAllRecords;
        });
        /*console.log(`\tis step(${memberAsStep.resolvedVirtualEntityId})`, 
        parentFinal, memberAsStep, 
        this.finalCardsData, this._data.finalStates);*/

        return parentFinal;
      }
      return undefined;
    }

    public getFinalEntityFromMemberByStepNumber(stepNumber: number){
      // first get step
      let stepsOrGroups = this.stepsList;
      let member = stepsOrGroups.find((stepOrGroup) => {
        let isGroup       = stepOrGroup.itemType === SzResolutionStepListItemType.GROUP ? true : false;

        if(isGroup) {
          return stepOrGroup.children.find((step) => {
            return step.stepNumber === stepNumber;
          })
        } else {
          return stepOrGroup.stepNumber === stepNumber;
        }
        return undefined;
      });
      if(member) {
        // now get parent group
        let finalEntity = this.getFinalEntityFromMember(member);
        console.log('getFinalEntityFromMemberByStepNumber: found step in stepsList: ', member, finalEntity);
      }
    }

    public isGroupExpanded(grp: SzResolutionStepNode) {
      let vId = grp.id ? grp.id : grp.resolvedVirtualEntityId ? grp.resolvedVirtualEntityId : undefined;
      if(vId) {
        return this.howUIService.isGroupExpanded(vId);
      }
      return false;
    }

    public getListItemType(item: SzResolutionStep | SzResolutionStepGroup): SzResolutionStepListItemType {
      let _retVal = SzHowUIService.getResolutionStepListItemType(item);
      let stepNumber = (item as SzResolutionStep).stepNumber ? (item as SzResolutionStep).stepNumber : (item as SzResolutionStepGroup).id
      //console.log(`${stepNumber} ${_retVal}`, item);
      return _retVal;
    }

    public stepIsMemberOfGroup(virtualEntityId: string, groups: Map<string, SzResolutionStepNode>) {
      let _retVal   = false;
      let _groupId  = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
      if(_groupId) {
        _retVal     = true; 
      }
      return _retVal;
    }
    stepIsMemberOfGroupDebug(virtualEntityId: string, debug?: boolean) {
      let _retVal = this.stepIsMemberOfGroup(virtualEntityId, this._stepNodeGroups);
      if(debug !== false) { console.log(`stepIsMemberOfGroupDebug('${virtualEntityId}') ? ${_retVal}`); }
      return _retVal;
    }

    private stepHasMembers(virtualEntityId: string, groups: Map<string, SzResolutionStepNode>) {
      let _retVal   = groups && groups.get(virtualEntityId) !== undefined ? true : false;
      return _retVal;
    }

    private getResolutionStepGroupById(id: string, groups: Map<string, SzResolutionStepNode>): SzResolutionStepNode {
      let _g = groups.get(id);
      return _g ? _g : undefined;
    }

    public getResolutionStepGroupIdByMemberVirtualIdDebug(virtualEntityId: string) {
      let groups  = this.getStepNodeGroupsRecursively(this._resolutionSteps, this._stepNodeGroups);
      let _retVal = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
      console.info(`getResolutionStepGroupIdByMemberVirtualIdDebug('${virtualEntityId}'): `,_retVal, groups);
      return _retVal;
    }

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
    private getResolutionStepGroupByMemberVirtualId(virtualEntityId: string, groups: Map<string, SzResolutionStepNode>) {
      if(groups) {
        let _groupId = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
        if(_groupId && groups.get(_groupId)) {
          return groups.get(_groupId)
        }
      }
      return undefined;
    }

    public get resolutionStepsWithGroupsOld(): Array<SzResolutionStep | SzResolutionStepNode> {
      let retVal = this.getResolutionStepsWithGroups(this._resolutionSteps, this._resolutionStepGroupsOld);
      return retVal;
    }

    public get stepsList(): Array<SzResolutionStepNode> {
      if(!this.howUIService.stepNodes || this.howUIService.stepNodes === undefined) {
        this.howUIService.stepNodes   = this.getResolutionStepsWithGroups(this._resolutionSteps, this._stepNodeGroups);
      }
      return this.howUIService.stepNodes;
    }

    public getResolutionStepsWithGroups(steps: SzResolutionStep[], groups: Map<string, SzResolutionStepNode>): Array<SzResolutionStepNode> {
      let retVal = [];
      // create "groups" for multiple sequential "add record" steps
      if(steps && steps.length > 0) {
        let _resolutionStepsWithGroups: Array<SzResolutionStepNode> = [];

        steps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          // check to see if step is member of group
          let _stepIsMemberOfGroup        = this.stepIsMemberOfGroup(resStep.resolvedVirtualEntityId, groups);
          let _stepHasMembers             = this.stepHasMembers(resStep.resolvedVirtualEntityId, groups);

          // check whether or not step is member of group
          if(!_stepIsMemberOfGroup && !_stepHasMembers) {
            // item is not member of group or interim step group
            // add item to array
            _resolutionStepsWithGroups.push(Object.assign({
              id: resStep.resolvedVirtualEntityId,
              itemType: SzResolutionStepListItemType.STEP,
              displayType: this.getListItemType(resStep)
            }, resStep));
          } else {
            // item is in group, if group has not been added already add it
            let _stepGroup            = _stepIsMemberOfGroup ? this.getResolutionStepGroupByMemberVirtualId(resStep.resolvedVirtualEntityId, groups) : this.getResolutionStepGroupById(resStep.resolvedVirtualEntityId, groups);
            let groupAlreadyInArray   = _resolutionStepsWithGroups.includes(_stepGroup);
            if(!groupAlreadyInArray) { 
              _resolutionStepsWithGroups.push( _stepGroup ); 
            }
          }
        });
        retVal  = _resolutionStepsWithGroups;
      }
      //console.info('resolutionStepsWithGroups: ', retVal);
      return retVal;
    }

    getStepNumberByVirtualEntityId(virtualEntityId: string) {
        let retVal = undefined;
        if(this._resolutionStepsByVirtualId && this._resolutionStepsByVirtualId[virtualEntityId]) {
            retVal = this._resolutionStepsByVirtualId[virtualEntityId].stepNumber;
        }
        return retVal;
    }

    public getConstructionStepForVirtualEntity(virtualEntityId: string) {
        let retVal = undefined;
        if(this._resolutionStepsByVirtualId && this._resolutionStepsByVirtualId[virtualEntityId]) {
            // there is a step entry for the virtualEntityId passed to this function
            retVal = this._resolutionStepsByVirtualId[virtualEntityId];
        }
        return retVal;
    }

    getData(entityId: SzEntityIdentifier): Observable<SzHowEntityResponse> {
        return this.entityDataService.howEntityByEntityID(
            this.entityId as number
        )
    }
    
    getFeatureTypeOrderFromConfig() {
        this.configDataService.getOrderedFeatures().subscribe((res: any)=>{
            this._featureTypesOrdered = res;
            console.log('getFeatureTypeOrderFromConfig: ', res);
        });
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public isResolutionStep(value: SzResolutionStep | SzResolutionStepGroup): boolean {
      let retVal = false;
      if((value as SzResolutionStep).stepNumber !== undefined) {
        retVal = true;
      }
      return retVal;
    }

    /** 
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
}