import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzEntityIdentifier, SzFeatureMode, SzHowEntityResponse, SzHowEntityResult, SzRecordId, SzRecordIdentifier, SzRecordIdentifiers, SzResolutionStep, SzResolvedEntity, SzVirtualEntity, SzVirtualEntityRecord, SzVirtualEntityResponse 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';
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
import { SzHowECSourceRecordsComponent } from '../ec/sz-dialog-how-ec-source-records.component';
import { v4 as uuidv4} from 'uuid';
import { SzResolutionStepListItem, SzResolutionStepListItemType } from '../../models/data-how';


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
    private _stepGroups: Map<string, SzResolutionStepGroup> = new Map<string, SzResolutionStepGroup>();

    private _isLoading = false;
    private _openRecordsModalOnClick = true;
    private _showNavigation = true;
    private _dataChange: Subject<SzHowEntityResult>         = new Subject<SzHowEntityResult>();
    public   dataChange                                     = this._dataChange.asObservable();
    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    public  virtualEntitiesDataChange                       = this._virtualEntitiesDataChange.asObservable();
    private _recordsMoreLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    public   recordsMoreLinkClick                           = this._recordsMoreLinkClick.asObservable();
    @Output() public dataChanged                            = new EventEmitter<SzHowEntityResult>();
    @Output() public recordsMoreLinkClicked                 = new EventEmitter<SzVirtualEntityRecordsClickEvent>();
    @Output()
    loading: EventEmitter<boolean>                          = new EventEmitter<boolean>();
    @Output() public virtualEntitiesDataChanged             = new EventEmitter<Map<string, SzResolvedVirtualEntity>>();
    @Input()
    entityId: SzEntityIdentifier;

    public get resolutionSteps(): Array<SzResolutionStep> | undefined {
      return this._resolutionSteps;
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
        private uiCoordinatorService: SzHowUICoordinatorService,
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

      if(this.entityId) {
        // get entity data
        this._isLoading = true;
        this.loading.emit(true);
        this.getData(this.entityId).subscribe((resp: SzHowEntityResponse) => {
            console.log(`how response: ${resp}`, resp.data);
            this._data                                    = resp && resp.data ? resp.data : undefined;
            this._resolutionStepsByVirtualId              = resp && resp.data && resp.data.resolutionSteps ? this._data.resolutionSteps : undefined;
            this.uiCoordinatorService.currentHowResult    = resp.data;

            if(this._data.finalStates && this._data.finalStates.length > 0) {
                // has at least one final states
                // for each final state get the virual step
                // and populate the components
                let _finalStatesData = this._data.finalStates
                .filter((fStateObj) => {
                    return this._data.resolutionSteps && this._data.resolutionSteps[ fStateObj.virtualEntityId ] ? true : false;
                })
                /*
                .map((fStateObj) => {
                    return (Object.assign(this._data.resolutionSteps[ fStateObj.virtualEntityId ], {
                        resolvedVirtualEntity: fStateObj
                    }) as SzHowFinalCardData)
                });*/

                this.finalCardsData = _finalStatesData
                console.log(`final step(s): `, this.finalCardsData);
            }
            if(this._data.resolutionSteps && Object.keys(this._data.resolutionSteps).length > 0) {
                // we have resolution steps
                let _resSteps = [];
                for(let rKey in this._data.resolutionSteps) {
                  let _stepType = SzHowUIService.getResolutionStepCardType(this._data.resolutionSteps[rKey]);
                  if(_stepType !== SzResolutionStepDisplayType.CREATE) {
                    //console.log(`#${this._data.resolutionSteps[rKey].stepNumber} type ${_stepType}`);
                    this.howUIService.expandStep(this._data.resolutionSteps[rKey].resolvedVirtualEntityId);
                  }
                  _resSteps.push( this._data.resolutionSteps[rKey] );
                }
                this._resolutionSteps = _resSteps.reverse(); // we want the steps in reverse for display purposes
            }
            if(this._resolutionSteps){
              this._resolutionStepGroupsOld = this.getDefaultResolutionStepGroups(this._resolutionSteps);
              this._stepGroups              = this.getDefaultStepGroups(this._resolutionSteps);
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
            this._dataChange.next(resp.data);
        });
      }

      this.recordsMoreLinkClick.pipe(
          takeUntil(this.unsubscribe$)
      ).subscribe((evt: SzVirtualEntityRecordsClickEvent)=> {
          this.recordsMoreLinkClicked.emit(evt);
      });
    }

    public getResolutionSteps(): Array<SzResolutionStep | SzResolutionStep[]> {
      let retVal = [];
      if(this._resolutionSteps && this._resolutionSteps.length > 1) {
        retVal = this._resolutionSteps;
      }
      console.info('getResolutionSteps: ', retVal);
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
                //this.howUIService.collapseStep(resStep.resolvedVirtualEntityId);
                //console.log(`${stepArrIndex} | previous step was add operation. append`, retVal.get(_currentGroupId));
                //(_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)] as SzResolutionStep[]).push(resStep);
              } else if(futureStepType === SzResolutionStepDisplayType.ADD) {
                // this is the first "add record" in a sequence of at least
                // two add records
                _currentGroupId   = uuidv4();
                retVal.set(_currentGroupId, {
                  id: _currentGroupId,
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

        _stepGroupsForInterimEntities.forEach((group, key) => {
          retVal.set(key, group);
        });

      }
      console.info('getDefaultStepGroups: ', retVal);
      return retVal;
    }

    private getGroupForMemberStep(step: SzResolutionStep, groups?: Map<string, SzResolutionStepGroup>): SzResolutionStepGroup {
      let _retVal: SzResolutionStepGroup;
      if(!groups) { groups = this._stepGroups; }
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
      console.info('getResolutionStepGroups: ', retVal);
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

    public isGroupExpanded(grp: SzResolutionStep | SzResolutionStepGroup) {
      let vId = (grp as SzResolutionStepGroup).id ? (grp as SzResolutionStepGroup).id : (grp as SzResolutionStep).resolvedVirtualEntityId ? (grp as SzResolutionStep).resolvedVirtualEntityId : undefined;
      if(vId) {
        return this.howUIService.isExpanded(vId);
      }
      return false;
    }

    public getListItemType(item: SzResolutionStep | SzResolutionStepGroup): SzResolutionStepListItemType {
      let _retVal = SzHowUIService.getResolutionStepListItemType(item);
      let stepNumber = (item as SzResolutionStep).stepNumber ? (item as SzResolutionStep).stepNumber : (item as SzResolutionStepGroup).id
      //console.log(`${stepNumber} ${_retVal}`, item);
      return _retVal;
    }

    private stepIsMemberOfGroup(virtualEntityId: string, groups: Map<string, SzResolutionStepGroup>) {
      let _retVal   = false;
      let _groupId  = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
      if(_groupId) {
        _retVal     = true; 
      }
      return _retVal;
    }

    private stepHasMembers(virtualEntityId: string, groups: Map<string, SzResolutionStepGroup>) {
      let _retVal   = groups && groups.get(virtualEntityId) !== undefined ? true : false;
      return _retVal;
    }

    private getResolutionStepGroupById(id: string, groups: Map<string, SzResolutionStepGroup>): SzResolutionStepGroup {
      let _g = groups.get(id);
      return _g ? _g : undefined;
    }

    private getResolutionStepGroupIdByMemberVirtualId(virtualEntityId: string, groups: Map<string, SzResolutionStepGroup>) {
      let retVal;
      if(groups) {
        groups.forEach((_value: SzResolutionStepGroup, _key: string) => {
          let _is = _value.virtualEntityIds.indexOf(virtualEntityId) > -1;
          if(_is) {
            retVal = _key;
          }
        });
      }
      return retVal;
    }
    private getResolutionStepGroupByMemberVirtualId(virtualEntityId: string, groups: Map<string, SzResolutionStepGroup>) {
      if(groups) {
        let _groupId = this.getResolutionStepGroupIdByMemberVirtualId(virtualEntityId, groups);
        if(_groupId && groups.get(_groupId)) {
          return groups.get(_groupId)
        }
      }
      return undefined;
    }

    private getResolutionStepGroupIdByMemberIndexPosition(stepIndexPosition: number, groups: Map<string, SzResolutionStepGroup>) {
      let retVal;
      if(groups) {
        groups.forEach((_value: SzResolutionStepGroup, _key: string) => {
          let _is = _value.arrayIndex === stepIndexPosition;
          if(_is) {
            retVal = _key;
          }
        });
      }
      return retVal;
    }

    public getNewResolutionStepsWithGroups() {
      let groups  = this.getDefaultStepGroups();
      let steps   = this.getResolutionStepsWithGroups(this._resolutionSteps, groups);
      console.info(`getNewResolutionStepsWithGroups() `, steps, groups);
    }

    public get resolutionStepsWithGroupsOld(): Array<SzResolutionStep | SzResolutionStepGroup> {
      let retVal = this.getResolutionStepsWithGroups(this._resolutionSteps, this._resolutionStepGroupsOld);
      return retVal;
    }

    public get stepsList(): Array<SzResolutionStep | SzResolutionStepGroup> {
      let retVal   = this.getResolutionStepsWithGroups(this._resolutionSteps, this._stepGroups);
      return retVal;
    }

    public getResolutionStepsWithGroups(steps: SzResolutionStep[], groups: Map<string, SzResolutionStepGroup>): Array<SzResolutionStep | SzResolutionStepGroup> {
      let retVal = [];
      // create "groups" for multiple sequential "add record" steps
      if(steps && steps.length > 1) {
        let _resolutionStepsWithGroups: Array<SzResolutionStep | SzResolutionStepGroup> = [];

        steps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          // check to see if step is member of group
          let _stepIsMemberOfGroup        = this.stepIsMemberOfGroup(resStep.resolvedVirtualEntityId, groups);
          let _stepHasMembers             = this.stepHasMembers(resStep.resolvedVirtualEntityId, groups);

          // check whether or not step is member of group
          if(!_stepIsMemberOfGroup && !_stepHasMembers) {
            // item is not member of group or interim step group
            // add item to array
            _resolutionStepsWithGroups.push(resStep);
          } else {
            // item is in group, if group has not been added already add it
            let _stepGroup            = _stepIsMemberOfGroup ? this.getResolutionStepGroupByMemberVirtualId(resStep.resolvedVirtualEntityId, groups) : this.getResolutionStepGroupById(resStep.resolvedVirtualEntityId, groups);
            let groupAlreadyInArray   = _resolutionStepsWithGroups.includes(_stepGroup);
            if(!groupAlreadyInArray) { _resolutionStepsWithGroups.push( _stepGroup ); }
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

@Component({
  selector: 'sz-dialog-how-rc-entity',
  templateUrl: 'sz-how-rc-entity-dialog.component.html',
  styleUrls: ['sz-how-rc-entity-dialog.component.scss']
})
export class SzHowRCEntityDialog {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  
  private _entityId: SzEntityIdentifier;
  private _showOkButton = true;
  private _isMaximized = false;
  private _isLoading = true;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
  private set maximized(value: boolean) { this._isMaximized = value; }

  @ViewChild('howEntityTag') howEntityTag: SzHowRCEntityComponent;

  public get title(): string {
    let retVal = `Resolution Steps for Entity ${this.entityId}`;
    return retVal
  }

  public okButtonText: string = "Ok";
  public get showDialogActions(): boolean {
    return this._showOkButton;
  }

  public get entityId(): SzEntityIdentifier {
    return this._entityId;
  }
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { entityId: SzEntityIdentifier, records?: SzRecordId[], okButtonText?: string, showOkButton?: boolean },
    private uiCoordinatorService: SzHowUICoordinatorService
  ) {
    if(data) {
      if(data.entityId) {
        this._entityId = data.entityId;
      }
      if(data.okButtonText) {
        this.okButtonText = data.okButtonText;
      }
      if(data.showOkButton) {
        this._showOkButton = data.showOkButton;
      }
    }
  }
  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.uiCoordinatorService.clear();
  }
  public onDataLoading(isLoading: boolean) {
    console.log('SzHowEntityDialog.onDataLoading?' , isLoading);
    this._isLoading = isLoading;
  }
  public toggleMaximized() {
    this.maximized = !this.maximized;
  }
  public onDoubleClick(event) {
    this.toggleMaximized();
  }
}