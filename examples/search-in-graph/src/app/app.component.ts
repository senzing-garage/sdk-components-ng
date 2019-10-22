import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input, Inject } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzPdfUtilService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzSdkPrefsModel,
  SzStandaloneGraphComponent,
  SzConfigurationService
} from '@senzing/sdk-components-ng';
import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number;
  public searchResultEntityIds: number[];
  public currentSearchParameters: SzEntitySearchParams;
  public showSearchResults = false;
  public showSpinner = false;
  // prefs related vars
  /** localstorage key to store pref data in */
  public STORAGE_KEY = 'senzing-web-app';
  /** original json value when app was loaded */
  private _localStorageOriginalValue: SzSdkPrefsModel = this.storage.get(this.STORAGE_KEY);
  /** local cached json model of prefs */
  private _prefsJSON: SzSdkPrefsModel;
  /** entity detail component */
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;
  /** graph component */
  @ViewChild(SzStandaloneGraphComponent) graphComponent: SzStandaloneGraphComponent;

  public set showGraphMatchKeys(value: boolean) {

    // if (this.entityDetailComponent){
    //  this.entityDetailComponent.showGraphMatchKeys = value;
    // }
  }
  public get showGraphMatchKeys(): boolean {
    // if (this.entityDetailComponent){
      // console.log('showGraphMatchKeys: ', this.entityDetailComponent.showGraphMatchKeys);
    //  return this.entityDetailComponent.showGraphMatchKeys;
    // }
   return false;
  }

  public showEntityDetail: boolean = false;
  public showFilters: boolean = true;
  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }

  @ViewChild('searchBox') searchBox: SzSearchComponent;
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;
  sub: Subscription;
  overlayRef: OverlayRef | null;

  public get showPdfDownloadButton(): boolean {
    return (this.currentSearchResults !== undefined && this.currentSearchResults && this.currentSearchResults.length > 0);
  }

  constructor(
    public pdfUtil: SzPdfUtilService,
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    public viewContainerRef: ViewContainerRef){
      // initialize prefs from localStorage value
      this.prefs.fromJSONObject(this._localStorageOriginalValue);
    }

  ngAfterViewInit() {
    const searchParams = this.searchBox.getSearchParams();
    if (searchParams){
      if ( Object.keys(searchParams).length > 0) {
        // do auto search
        this.searchBox.submitSearch();
      }
    }

    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (srprefs) => {
      this._prefsJSON = srprefs;
      this.savePrefsToLocalStorage();
      // console.warn('consumer prefs change: ', srprefs);
    });
  }

  onSearchException(err: Error) {
    throw (err.message);
  }

  onRequestStarted(evt: any) {
    console.log('onRequestStarted: ', evt);
    this.showSpinner = true;
  }
  onRequestComplete(evt: any) {
    console.log('onRequestComplete: ', evt);
  }
  onRenderComplete(evt: any) {
    console.log('onRenderComplete: ', evt);
    this.showSpinner = false;
  }

  onSearchResults(evt: SzAttributeSearchResult[]){
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // console.log('onSearchResults: ', this.currentSearchResults);

    this.searchResultEntityIds = this.currentSearchResults.map( (entityResult: SzAttributeSearchResult) => {
      return entityResult.entityId;
    });

    // show results
    if (this.searchResultEntityIds && this.searchResultEntityIds.length > 0){
      this.showSearchResults = true;
    }

    console.log('onSearchResults: ', this.searchResultEntityIds, this.currentSearchResults);
  }

  /** save value of  _prefsJSON to local storage */
  savePrefsToLocalStorage() {
    this.storage.set(this.STORAGE_KEY, this._prefsJSON);
  }
  /** get prefs json from local storage */
  getPrefsFromLocalStorage() {
    return this.storage.get(this.STORAGE_KEY);
  }

  public onBackToSearchResultsClick($event): void {
    this.showSearchResults = true;
    this.currentlySelectedEntityId = undefined;
    this.showEntityDetail = false;
  }

  public onPDFDownloadClick(): void {
    this.pdfUtil.createPdfFromAttributeSearch( this.currentSearchResults, this.currentSearchParameters );
  }

  public onEntityPDFDownloadClick(): void {
    // const filename = this.entityDetailComponent.entity.resolvedEntity.entityName.toLowerCase().replace(' ', '-entity') + '.pdf';
    // this.pdfUtil.createPdfFromHtmlElement(this.entityDetailComponent.nativeElement, filename);
  }

  public onGraphEntityClick(event: any): void {
    console.log('clicked on graph entity #' + event.entityId);
    this.currentlySelectedEntityId = event.entityId;
    this.showEntityDetail = true;
    this.showFilters = false;
  }
  public onGraphEntityDblClick(event: any): void {
    console.log('double clicked on graph entity #' + event.entityId);
  }
  public onGraphContextClick(event: any): void {
    this.openContextMenu(event);
  }

  onTabClick(tabName: string) {
    console.log('onTabClick: ' + tabName);
    switch (tabName){
      case 'detail':
        this.showFilters = false;
        this.showEntityDetail = true;
        break;
      case 'filters':
        this.showFilters = true;
        this.showEntityDetail = false;

    }
    this.graphComponent.showFiltersControl = false;
  }

  openGraphItemInNewMenu(entityId: number) {
    window.open('/entity/' + entityId, '_blank');
  }
  openContextMenu(event: any) {
    console.log('openContextMenu: ', event);
    this.closeContextMenu();
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: Math.ceil(event.x) + 80, y: Math.ceil(event.y) })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.graphContextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeContextMenu());

    return false;
  }

  closeContextMenu() {
    if (this.sub){
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  public toggleGraphMatchKeys(event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    this.showGraphMatchKeys = _checked;
  }

  public onSearchResultClick(entityData: SzAttributeSearchResult){
    // console.log('onSearchResultClick: ', entityData);
    if (entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
      this.showSearchResults = false;
    } else {
      this.currentlySelectedEntityId = undefined;
      this.showSearchResults = true;
    }
  }

  public onSearchResultsCleared(searchParams: SzEntitySearchParams){
    // hide search results
    this.showSearchResults = false;
    this.currentSearchResults = undefined;
    this.currentlySelectedEntityId = undefined;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }
}
