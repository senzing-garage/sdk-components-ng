import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzEntityIdentifier, SzHowEntityResponse, SzHowEntityResult, SzRecordId, SzResolutionStep, SzVirtualEntity 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';
import { SzHowFinalCardData, SzVirtualEntityRecordsClickEvent } from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseBool, parseSzIdentifier } from '../../common/utils';
import { SzHowSourceRecordsComponent } from './sz-dialog-how-source-records.component';

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
    selector: 'sz-how-entity',
    templateUrl: './sz-how-entity.component.html',
    styleUrls: ['./sz-how-entity.component.scss']
})
export class SzHowEntityComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    //public finalCardsData: SzHowFinalCardData[];
    public finalCardsData: SzVirtualEntity[];
    private _data: SzHowEntityResult;
    private _featureTypesOrdered: string[] | undefined;
    private _resolutionSteps: SzResolutionStep[];
    private _resolutionStepsByVirtualId: {[key: string]: SzResolutionStep};
    private _isLoading = false;
    private _openRecordsModalOnClick = true;
    private _showToolBar = true;
    private _dataChange: Subject<SzHowEntityResult>         = new Subject<SzHowEntityResult>();
    public   dataChange                                     = this._dataChange.asObservable();
    private _recordsMoreLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    public   recordsMoreLinkClick                           = this._recordsMoreLinkClick.asObservable();
    @Output() public dataChanged                            = new EventEmitter<SzHowEntityResult>();
    @Output() public recordsMoreLinkClicked                 = new EventEmitter<SzVirtualEntityRecordsClickEvent>();
    @Output()
    loading: EventEmitter<boolean>                          = new EventEmitter<boolean>();
    @Input()
    entityId: SzEntityIdentifier;

    public get resolutionSteps(): SzResolutionStep[] | undefined {
        return this._resolutionSteps;
    }
    public get resolutionStepsByVirtualId() {
        return this._resolutionStepsByVirtualId;
    }
    public get orderedFeatures(): string[] {
        return this._featureTypesOrdered
    }
    public get isLoading(): boolean {
        return this._isLoading;
    }
    public get showToolBar(): boolean {
      return this._showToolBar;
    }
    @Input() public set showToolBar(value: boolean | string) {
        this._showToolBar = parseBool(value);
    }

    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        public dialog: MatDialog,
        private uiCoordinatorService: SzHowUICoordinatorService
    ){}

    ngOnInit() {
      this.getFeatureTypeOrderFromConfig();

      this.dataChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((data: SzHowEntityResult) => {
        this.dataChanged.emit(data);
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

    public onRecordsMoreLinkClicked(evt: SzVirtualEntityRecordsClickEvent) {
      console.log('SzHowEntityComponent.onRecordsMoreLinkClicked: ', evt);
      this._recordsMoreLinkClick.next(evt);
      if(this._openRecordsModalOnClick) {
        let targetEle = new ElementRef(evt.target);
        const dialogRef = this.dialog.open(SzHowSourceRecordsComponent, {
          panelClass: 'tooltip-dialog-panel',
          hasBackdrop: false,
          data: {
            target: targetEle,
            event: evt
          }
        });
      }
    }
}

@Component({
  selector: 'sz-dialog-how-entity',
  templateUrl: 'sz-how-entity-dialog.component.html',
  styleUrls: ['sz-how-entity-dialog.component.scss']
})
export class SzHowEntityDialog {
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

  @ViewChild('howEntityTag') howEntityTag: SzHowEntityComponent;

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