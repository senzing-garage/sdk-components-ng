import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input, OnDestroy, Inject } from '@angular/core';
import {
  SzAlertMessageDialog,
  SzDataMartService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzEntityIdentifier,
  SzEntitiesPage
} from '@senzing/sdk-components-ng';

import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { SzSdkPrefsModel } from 'src/lib/services/sz-prefs.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public currentlySelectedEntityId: number// = 100034;
  public currentSampleData: any;
  public showSampleTable    = false;
  public showEntityDetail   = false;
  public sampleStatType;
  private _isLoading        = false;
  /** localstorage key to store pref data in */
  public STORAGE_KEY = 'senzing-web-app-example-data-table';
  /** original json value when app was loaded */
  private _localStorageOriginalValue: SzSdkPrefsModel = this.storage.get(this.STORAGE_KEY);
  /** local cached json model of prefs */
  private _prefsJSON: SzSdkPrefsModel;

  public get isLoading(): boolean {
    return this._isLoading;
  }

  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;

  sub: Subscription;
  overlayRef: OverlayRef | null;

  constructor(
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    public dataMart: SzDataMartService,
    public dialog: MatDialog,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {
    /*const searchParams = this.searchBox.getSearchParams();
    if (searchParams){
      if ( Object.keys(searchParams).length > 0) {
        // do auto search
        this.searchBox.submitSearch();
      }
    }*/
    /*this.dataMart.onSampleResultChange.subscribe((data) => {
      console.log(`new sample set data ready... `);
      this.showSampleTable = true;
    })*/
    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (srprefs) => {
      this._prefsJSON = srprefs;
      this.savePrefsToLocalStorage();
    });
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** since data can be any format we have to use loose typing */
  onCellClick(data: any) {
    console.log(`onCellClick`, data);
    if(!data.value){ return; }
  }

  onEntityIdClick(entityId: SzEntityIdentifier) {
    console.log(`APP onEntityIdClick(${entityId})`);
    if(entityId) {
      this.openEntity(entityId);
    }
  }

  openEntity(entityId: SzEntityIdentifier) {
    this.dialog.open(SzAlertMessageDialog, {
      panelClass: 'alert-dialog-panel',
      width: '350px',
      height: '200px',
      data: {
        title: `Opening Entity #${entityId} Detail`,
        text: 'This would normally be a redirect to the entity detail page.',
        showOkButton: false,
        buttonText: 'Close'
      }
    });
  }

  /** save value of  _prefsJSON to local storage */
  savePrefsToLocalStorage() {
    this.storage.set(this.STORAGE_KEY, this._prefsJSON);
  }
  
}
