import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input, OnDestroy } from '@angular/core';
import {
  SzDataMartService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzEntityIdentifier,
  SzEntitiesPage
} from '@senzing/sdk-components-ng';

import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subject, Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
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
    public dataMart: SzDataMartService,
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
    console.log(data);
  }

  onLoading(value: boolean) {
    this._isLoading = value;
  }
  
}
