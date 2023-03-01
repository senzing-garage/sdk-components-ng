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
import { SzHowFinalCardData, SzVirtualEntityRecordsClickEvent, SzResolvedVirtualEntity, SzResolutionStepDisplayType } from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil, zip, map } from 'rxjs';
import { parseBool, parseSzIdentifier } from '../../common/utils';
import { SzHowECSourceRecordsComponent } from '../ec/sz-dialog-how-ec-source-records.component';



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
    private _resolutionSteps: Array<SzResolutionStep | SzResolutionStep[]>;
    private _resolutionStepsByVirtualId: {[key: string]: SzResolutionStep};
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

    public get resolutionSteps(): Array<SzResolutionStep | SzResolutionStep[]> | undefined {
      //this._resolutionSteps[0].stepNumber
      return this._resolutionSteps;
    }

    public cooerceToStep(stepItem: SzResolutionStep | SzResolutionStep[]): SzResolutionStep {
      let retVal: SzResolutionStep | undefined;
      if((stepItem as SzResolutionStep).stepNumber) {
        retVal = (stepItem as SzResolutionStep);
      }
      return retVal;
    }

    public cooerceToSteps(stepItem: SzResolutionStep | SzResolutionStep[]): SzResolutionStep[] {
      let retVal: SzResolutionStep[] | undefined;
      if((stepItem as SzResolutionStep[]).length) {
        retVal = (stepItem as SzResolutionStep[]);
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
                    this._data.resolutionSteps[rKey].resolvedVirtualEntityId
                    _resSteps.push( this._data.resolutionSteps[rKey] );
                }
                this._resolutionSteps = _resSteps.reverse(); // we want the steps in reverse for display purposes
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

    public get resolutionStepsWithGroups(): Array<SzResolutionStep | SzResolutionStep[]> {
      let retVal = [];
      // create "groups" for multiple sequential "add record" steps
      if(this._resolutionSteps && this._resolutionSteps.length > 1) {
        let _groups = [];
        let _resolutionStepsWithGroups: Array<SzResolutionStep | SzResolutionStep[]> = [];

        this._resolutionSteps.forEach((resStep: SzResolutionStep, stepArrIndex: number) => {
          let futureStepType  = this._resolutionSteps[(stepArrIndex + 1)]  ? SzHowUIService.getStepListItemType((this._resolutionSteps[(stepArrIndex + 1)] as SzResolutionStep), resStep.stepNumber) : undefined;
          let currentStepType = this._resolutionSteps[stepArrIndex]        ? SzHowUIService.getStepListItemType((this._resolutionSteps[ stepArrIndex     ] as SzResolutionStep), resStep.stepNumber) : undefined;
          let lastStepType    = this._resolutionSteps[(stepArrIndex - 1)]  ? SzHowUIService.getStepListItemType((this._resolutionSteps[(stepArrIndex - 1)] as SzResolutionStep), resStep.stepNumber) : undefined;

          if(currentStepType !== SzResolutionStepDisplayType.ADD){ 
            _resolutionStepsWithGroups.push(resStep);
          } else {
            // current type is "add"
              // check if previous step was add
              // if so add this item to previous item
              if(lastStepType === SzResolutionStepDisplayType.ADD) {
                console.log(`${stepArrIndex} | previous step was add operation. append(${_resolutionStepsWithGroups.length - 1}:${lastStepType})`,_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)], _resolutionStepsWithGroups);
                (_resolutionStepsWithGroups[(_resolutionStepsWithGroups.length - 1)] as SzResolutionStep[]).push(resStep);
              } else if(futureStepType === SzResolutionStepDisplayType.ADD) {
                // this is the first "add record" in a sequence of at least
                // two add records
                _resolutionStepsWithGroups.push([resStep]);
                console.log(`${stepArrIndex} | first add operation in series`, _resolutionStepsWithGroups);

              } else {
                // this is a "singular" "add record" step, do not group it
                _resolutionStepsWithGroups.push(resStep);
              }
          }
        });
        retVal  = _resolutionStepsWithGroups;
      }
      console.info('resolutionStepsWithGroups: ', retVal);
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

    getStepTitle(step: SzResolutionStep): string {
      let retVal = '';
      if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
          // both items are records
          retVal = 'Create Virtual Entity';
      } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
          // both items are virtual entities
          retVal = 'Merge Interim Entities';
      } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
          // one of the items is record, the other is virtual
          retVal = 'Add Record to Virtual Entity';
      }
      return retVal;
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public onRecordsMoreLinkClicked(evt: SzVirtualEntityRecordsClickEvent) {
      console.log('SzHowEntityComponent.onRecordsMoreLinkClicked: ', evt);
      this._recordsMoreLinkClick.next(evt);
      if(this._openRecordsModalOnClick) {
        let targetEle = new ElementRef(evt.target);
        const dialogRef = this.dialog.open(SzHowECSourceRecordsComponent, {
          panelClass: 'tooltip-dialog-panel',
          hasBackdrop: false,
          data: {
            target: targetEle,
            event: evt
          }
        });
      }
    }

    public isResolutionStep(value: SzResolutionStep | SzResolutionStep[]): boolean {
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