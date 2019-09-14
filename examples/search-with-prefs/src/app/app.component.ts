import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input, OnDestroy, HostBinding } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzPdfUtilService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzPreferencesComponent
} from '@senzing/sdk-components-ng';
import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number = 1002;
  public currentSearchParameters: SzEntitySearchParams;
  public showSearchResults = false;
  // public showPrefs = true;
  @HostBinding('class.menu-expanded') showPrefs =  false;

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  public set showGraphMatchKeys(value: boolean) {
    if (this.entityDetailComponent){
      this.entityDetailComponent.showGraphMatchKeys = value;
    }
  }
  public get showGraphMatchKeys(): boolean {
    if (this.entityDetailComponent){
      // console.log('showGraphMatchKeys: ', this.entityDetailComponent.showGraphMatchKeys);
      return this.entityDetailComponent.showGraphMatchKeys;
    }
   return false;
  }

  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }
  @ViewChild('searchBox') searchBox: SzSearchComponent;
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;
  @ViewChild(SzPreferencesComponent) prefsComponent: SzPreferencesComponent;

  sub: Subscription;
  overlayRef: OverlayRef | null;

  public get showPdfDownloadButton(): boolean {
    return (this.currentSearchResults !== undefined && this.currentSearchResults && this.currentSearchResults.length > 0);
  }

  public toggleOtherData() {
    console.warn('toggleOtherData: ', this.prefsComponent);
    const p = this.prefsComponent;
    p.EntityDetailShowOtherData = !p.EntityDetailShowOtherData;
    p.EntityDetailShowOtherDataInRecords = !p.EntityDetailShowOtherDataInRecords;
    p.SearchResultsShowOtherData = !p.SearchResultsShowOtherData;
  }

  constructor(
    public pdfUtil: SzPdfUtilService,
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

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

  onSearchException(err: Error) {
    throw (err.message);
  }

  onSearchResults(evt: SzAttributeSearchResult[]){
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // show results
    this.showSearchResults = true;
  }

  public onBackToSearchResultsClick($event): void {
    this.showSearchResults = true;
    this.currentlySelectedEntityId = undefined;
  }

  public onPDFDownloadClick(): void {
    this.pdfUtil.createPdfFromAttributeSearch( this.currentSearchResults, this.currentSearchParameters );
  }

  public onEntityPDFDownloadClick(): void {
    const filename = this.entityDetailComponent.entity.resolvedEntity.entityName.toLowerCase().replace(' ', '-entity') + '.pdf';
    this.pdfUtil.createPdfFromHtmlElement(this.entityDetailComponent.nativeElement, filename);
  }

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

  public togglePref(prefGroup: string, prefKey): void {
    if (prefGroup && this.prefs[prefGroup]){
      this.prefs[prefGroup][prefKey] = !this.prefs[prefGroup][prefKey] ;
    }
  }

  public onPrefsChange(value: any) {
    console.warn('onPrefsChange: ', value);
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
    // console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }
}
