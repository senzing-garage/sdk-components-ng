import { Component, Inject, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { 
    SzEntityIdentifier, SzResolutionStep, SzVirtualEntityRecord 
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { SzResolutionStepDisplayType, SzResolvedVirtualEntity, SzVirtualEntityRecordsByDataSource } from '../../models/data-how';
import { SzHowUIService } from '../../services/sz-how-ui.service';


@Component({
    selector: 'sz-dialog-how-rc-virtual-entity-dialog',
    templateUrl: 'sz-how-rc-virtual-entity-dialog.component.html',
    styleUrls: ['sz-how-rc-virtual-entity-dialog.component.scss']
  })
  export class SzHowRCVirtualEntityDialog {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    private _stepData: SzResolutionStep;
    private _virtualEntity: SzResolvedVirtualEntity;
    private _featureOrder: string[];
    private _sources: SzVirtualEntityRecordsByDataSource;

    private _showOkButton = true;
    private _isMaximized = false;
    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.MERGE;
    }
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.CREATE;
    }
    @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
    private set maximized(value: boolean) { this._isMaximized = value; }
  
    //@ViewChild('howEntityTag') howEntityTag: SzHowRCEntityComponent;
  
    public get title(): string {
      let retVal = `Virtual Entity ${this.id}`;
      return retVal
    }
  
    public okButtonText: string = "Ok";
    public get showDialogActions(): boolean {
      return this._showOkButton;
    }
    public get id(): SzEntityIdentifier {
      if(this._virtualEntity) {
        return this._virtualEntity.virtualEntityId;
      }
      return undefined;
    }
    public get stepData(): SzResolutionStep {
      return this._stepData;
    }
    public get virtualEntity(): SzResolvedVirtualEntity {
      return this._virtualEntity;
    }
    public get featureOrder(): string[] {
      return this._featureOrder;
    }

    get displayType(): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(this._stepData);
    }
    get sourceCount(): number {
      let retVal  = 0;
      let _sources = this.sources;
      if(_sources){
        retVal = Object.keys(_sources).length;
      }
      return retVal;
    }
    get recordCount(): number {
        let retVal = 0;
        if(this._virtualEntity && this._virtualEntity.records !== undefined) {
            return this._virtualEntity.records.length;
        }
        return retVal;
    }
    get sources() {
      // check if we have a cached version of this first
      if(!this._sources) {
          let _recordsByDataSource: {
              [key: string]: Array<SzVirtualEntityRecord> 
          } = {};
          this._virtualEntity.records.forEach((dsRec) => {
              if(!_recordsByDataSource[dsRec.dataSource]) {
                  _recordsByDataSource[dsRec.dataSource] = [];
              }
              _recordsByDataSource[dsRec.dataSource].push(dsRec);

          });
          this._sources = _recordsByDataSource;
      }
      return this._sources;
    }

    constructor(
      @Inject(MAT_DIALOG_DATA) public data: { 
        stepData: SzResolutionStep, 
        virtualEntity: SzResolvedVirtualEntity, 
        featureOrder: string[],
        okButtonText?: string, showOkButton?: boolean 
      },
      private howUIService: SzHowUIService
      ) {
      if(data) {
        if(data.stepData) {
          this._stepData = data.stepData;
        }
        if(data.virtualEntity) {
            this._virtualEntity = data.virtualEntity;
          }
          if(data.featureOrder) {
            this._featureOrder = data.featureOrder;
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
    }
    public toggleMaximized() {
      this.maximized = !this.maximized;
    }
    public onDoubleClick(event) {
      this.toggleMaximized();
    }
  }