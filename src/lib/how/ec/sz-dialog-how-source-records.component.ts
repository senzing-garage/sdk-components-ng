import { Component, OnInit, ElementRef, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowFinalCardData, SzVirtualEntityRecordsClickEvent } from '../../models/data-how';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../services/sz-how-ui-coordinator.service';


/**
 * Why
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity entityId="5"&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity entityId="5"&gt;&lt;/sz-wc-why-entity&gt;<br/>
*/
@Component({
    selector: 'sz-dialog-how-source-records',
    templateUrl: './sz-dialog-how-source-records.component.html',
    styleUrls: ['./sz-dialog-how-source-records.component.scss']
})
export class SzHowSourceRecordsComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private readonly _matDialogRef: MatDialogRef<SzHowSourceRecordsComponent>;
    private readonly targetElementRef: ElementRef;
    public okButtonText: string = "Ok";
    private _showOkButton = true;
    private _isMaximized = false;
    private _dataSourceName: string;
    private _records: SzVirtualEntityRecord[];
    @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
    private set maximized(value: boolean) { this._isMaximized = value; }
    public get title(): string {
      let retVal = `Records for ${this.dataSourceName}`;
      if(this.recordCount > 0) {
        retVal += `(${this.recordCount})`;
      }
      return retVal
    }
    public get records(): SzVirtualEntityRecord[] | undefined {
        return this._records;
    }
    private get recordCount(): number {
        return this._records && this._records.length !== undefined ? this._records.length : 0 
    }
    public get dataSourceName(): string {
        return this._dataSourceName;
    }
    public get showDialogActions(): boolean {
      return this._showOkButton;
    }
  
    constructor(_matDialogRef: MatDialogRef<SzHowSourceRecordsComponent>,
        @Inject(MAT_DIALOG_DATA) data: { target: ElementRef, event: SzVirtualEntityRecordsClickEvent }) {
        this._matDialogRef      = _matDialogRef;
        this.targetElementRef   = data.target;
        this._dataSourceName    = data.event.dataSourceName;
        this._records           = data.event.records;
    }
    ngOnInit() {
        const matDialogConfig: MatDialogConfig = new MatDialogConfig();
        const rect = this.targetElementRef.nativeElement.getBoundingClientRect();
        matDialogConfig.position = { left: `${rect.left}px`, top: `${rect.bottom - 50}px` };
        matDialogConfig.width = '200px';
        matDialogConfig.height = '200px';
        this._matDialogRef.updateSize(matDialogConfig.width, matDialogConfig.height);
        this._matDialogRef.updatePosition(matDialogConfig.position);
    }

    /**
     * unsubscribe when component is destroyed
     */
     ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    cancel(): void {
        this._matDialogRef.close();
    }
    public toggleMaximized() {
        this.maximized = !this.maximized;
      }
      public onDoubleClick(event) {
        this.toggleMaximized();
      }
}