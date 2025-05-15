import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input, Inject } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzSdkPrefsModel,
  SzStandaloneGraphComponent,
  SzConfigurationService,
  SzEntityIdentifier
} from '@senzing/sdk-components-ng';
import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number;
  public searchResultEntityIds: SzEntityIdentifier[] = [1];
  //public searchResultEntityIds: SzEntityIdentifier[] = [300002];
  //public searchResultEntityIds: SzEntityIdentifier[] = [500038];
  public currentSearchParameters: SzEntitySearchParams;
  public showSearchResults = true;
  public showSpinner = false;
  public _showMatchKeysInFilter: string[];
  
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
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    public viewContainerRef: ViewContainerRef){
      // initialize prefs from localStorage value
      // BEFORE this.prefs.prefsChanged => this.savePrefsToLocalStorage
      // otherwise will overwrite with defaults
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
      // this.savePrefsToLocalStorage();
      console.warn('consumer prefs change: ', srprefs);
      this.savePrefsToLocalStorage();
    });
  }

  toggleShowSpinner() {
    this.showSpinner = !this.showSpinner;
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
  onRenderStarted(evt: any) {
    console.log('onRenderStarted: ', evt);
    this.showSpinner = true;
  }
  onRenderComplete(evt: any) {
    console.log('onRenderComplete: ', evt);
    this.showSpinner = false;
  }
  onDataLoading(evt: any) {
    console.log('onDataLoading: ', evt);
    this.showSpinner = true;
  }
  onDataLoaded(evt: any) {
    console.log('onDataLoaded: ', evt);
    this.showSpinner = false;
  }
  onMatchKeysChange(data: string[]) {
    console.warn('onMatchKeysChange: ', data);
    this._showMatchKeysInFilter = data;
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
    //this.pdfUtil.createPdfFromAttributeSearch( this.currentSearchResults, this.currentSearchParameters );
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
    this.closeContextMenu();
  }
  /**
   * create context menu for graph options
   */
   public openContextMenu(event: any) {
    // console.log('openContextMenu: ', event);
    this.closeContextMenu();
    let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    const positionStrategy = this.overlay.position().global();
    positionStrategy.top(Math.ceil(event.eventPageY - scrollY)+'px');
    positionStrategy.left(Math.ceil(event.eventPageX)+'px');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.graphContextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    console.warn('openContextMenu: ', event);
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
  
  hideGraphItem(event: any) {
    console.log('hideGraphItem: ', event.entityId);
    this.graphComponent.removeNode(event.entityId);
    this.closeContextMenu();
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

  public onSearchResultsCleared(searchParams?: SzEntitySearchParams | void){
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
