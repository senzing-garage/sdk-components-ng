import { Component, AfterViewInit, ViewChild, ViewContainerRef, TemplateRef, OnDestroy, HostBinding, Inject } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzSdkPrefsModel,
  SzPreferencesComponent,
  SzEntityRecord,
  SzSearchByIdFormParams
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
export class AppComponent implements AfterViewInit, OnDestroy {
  /** current results from search */
  public currentSearchResults: SzAttributeSearchResult[];
  /** entity id to disply in detail component */
  public currentlySelectedEntityId: number;
  public currentEntityData: SzEntityData;
  public showNoResultsMessage = false;
  /** reference to result of sz-search-by-id query */
  public formResult: SzEntityRecord;
  /** reference to parameters of sz-search-by-id query */
  public formParams: SzSearchByIdFormParams;
  public get formResultAsString(): string {
    return JSON.stringify( this.formResult );
  }
  /** current search params being used */
  public currentSearchParameters: SzEntitySearchParams;
  /** show search results component. turned off until we have a search result */
  public showSearchResults = false;
  // prefs related vars
  /** localstorage key to store pref data in */
  public STORAGE_KEY = 'senzing-web-app';
  /** original json value when app was loaded */
  private _localStorageOriginalValue: SzSdkPrefsModel = this.storage.get(this.STORAGE_KEY);
  /** local cached json model of prefs */
  private _prefsJSON: SzSdkPrefsModel;
  /** css class for when menu bar is expanded */
  @HostBinding('class.menu-expanded') showPrefs =  false;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** search form component */
  @ViewChild('searchBox') searchBox: SzSearchComponent;
  /** entity detail component */
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;
  /** context menu to use on graph interaction */
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;
  /** preferences service interface/proxy component */
  @ViewChild(SzPreferencesComponent) prefsComponent: SzPreferencesComponent;

  ctxMenusub: Subscription;
  overlayRef: OverlayRef | null;

  /** show search results component */
  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }
  /** save value of  _prefsJSON to local storage */
  savePrefsToLocalStorage() {
    this.storage.set(this.STORAGE_KEY, this._prefsJSON);
  }
  /** get prefs json from local storage */
  getPrefsFromLocalStorage() {
    return this.storage.get(this.STORAGE_KEY);
  }

  // --------------------------------------------------  lifecycle related
  constructor(
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

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // ------------------------------------------- start graph context menu related
  public onGraphEntityClick(event: any): void {
    console.log('clicked on graph entity #' + event.entityId);
  }
  public onGraphEntityDblClick(event: any): void {
    console.log('double clicked on graph entity #' + event.entityId);
  }
  public onGraphContextClick(event: any): void {
    this.openContextMenu(event);
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

    this.ctxMenusub = fromEvent<MouseEvent>(document, 'click')
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
    if (this.ctxMenusub){
      this.ctxMenusub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  // ------------------------------------------- end graph context menu related

  // ------------------------------------------- event handlers
  /** when a search result is clicked show the entity detail component */
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
  /** clear the current search results */
  public onSearchResultsCleared(searchParams?: SzEntitySearchParams | void){
    // hide search results
    this.showNoResultsMessage = false;
    this.showSearchResults = false;
    this.currentSearchResults = undefined;
    this.currentlySelectedEntityId = undefined;
    this.currentEntityData = undefined;
    this.formResult = undefined;
    this.formParams = undefined;
  }
  /** store the current parameters on scope */
  public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
    console.log('onSearchParameterChange: ', searchParams);
    let isByIdParams = false;
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    } else {
      // console.warn('not by id: ' + isByIdParams, byIdParams);
    }
    if (!isByIdParams) {
      this.currentSearchParameters = (searchParams as SzEntitySearchParams);
    } else {
      this.formParams = (searchParams as SzSearchByIdFormParams);
    }
  }

  onSearchException(err: Error) {
    throw (err.message);
  }
  onByIdException(err) {
    // console.warn('onByIdException: ', err);
    if (err.message === 'null criteria'){
      // not enough information to construct query
      // ignore
    } else if (err && err.status === 404) {
      console.log('404 Error', );
      if (err && err.error && err.error.errors && err.error.errors.length > 0) {
        switch (err.error.errors[0].code) {
          case '37':
            // did not find entity
            console.log('specifically entity not found Error', );
            this.showNoResultsMessage = true;
            this.currentEntityData = undefined;
            this.formResult = undefined;
            break;
          case '33':
            // did not find record
            console.log('specifically record not found Error', );
            this.showNoResultsMessage = true;
            this.formResult = undefined;
            this.currentEntityData = undefined;
            break;
        }
        // this.currentEntityData = undefined;
        // this.formResult = undefined;
      }
    } else {
      throw (err.message);
    }
  }
  /** when the value from the sz-search-by-id component changes */
  onResultChange(evt: SzEntityRecord){
    console.log('onResultsChange: ', evt);
    this.showNoResultsMessage = false;
    this.formResult = evt;
    this.currentEntityData = undefined;
  }
  onEntityResult(evt: SzEntityData) {
    this.showNoResultsMessage = false;
    this.currentEntityData = evt;
    this.formResult = undefined;
  }
  /** when search results come back from component update local value */
  onSearchResults(evt: SzAttributeSearchResult[]){
    this.showNoResultsMessage = false;
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // show results
    this.showSearchResults = true;
  }
  /** hide the detail component and show the search results */
  public onBackToSearchResultsClick($event): void {
    this.showSearchResults = true;
    this.currentlySelectedEntityId = undefined;
  }
}
