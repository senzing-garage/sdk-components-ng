import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzEntityIdentifier
} from '@senzing/sdk-components-ng';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number; // = 39001;
  public currentSearchParameters: SzEntitySearchParams;
  public howReportEntityId: SzEntityIdentifier;
  public _showSearchResults  = false;
  public _showEntityDetail   = false;
  public _showHowReport      = false;
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

  public get showSearchResults(): boolean {
    return this._showSearchResults && this.currentSearchResults && this.currentSearchResults.length > 0;
  }

  public get showSearchResultDetail(): boolean {
    if (this._showEntityDetail && this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }
  public get showHowReport(): boolean {
    if(this.howReportEntityId !== undefined && this._showHowReport && !this._showSearchResults && !this._showEntityDetail){
      return true;
    }
    return false;
  }
  @ViewChild('searchBox') searchBox: SzSearchComponent;
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;
  @ViewChild('graphNodeContextMenu') graphNodeContextMenu: TemplateRef<any>;
  @ViewChild('graphLinkContextMenu') graphLinkContextMenu: TemplateRef<any>;

  sub: Subscription;
  overlayRef: OverlayRef | null;

  public get showPdfDownloadButton(): boolean {
    return (this.currentSearchResults !== undefined && this.currentSearchResults && this.currentSearchResults.length > 0);
  }

  constructor(
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
  }

  onSearchException(err: Error) {
    throw (err.message);
  }

  onSearchResults(evt: SzAttributeSearchResult[]){
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // show results
    this._showSearchResults = true;
    this._showHowReport     = false;
    this._showEntityDetail  = false;
  }

  public onBackToSearchResultsClick(event): void {
    this._showSearchResults = true;
    this._showEntityDetail  = false;
    this._showHowReport     = false;
  }
  public onBackToEntityClick(event): void {
    this._showSearchResults = false;
    this._showEntityDetail  = true;
    this._showHowReport     = false;
  }

  public onGraphEntityClick(event: any): void {
    console.log('clicked on graph entity #' + event.entityId);
  }
  public onGraphEntityDblClick(event: any): void {
    console.log('double clicked on graph entity #' + event.entityId);
  }
  public onGraphContextClick(event: any): void {
    this.openContextMenu(event, this.graphNodeContextMenu);
  }
  public onGraphRelationshipContextClick(event: any) {
    console.log('onGraphRelationshipContextClick: ', event);
    this.openContextMenu(event, this.graphLinkContextMenu);
  }

  openGraphItemInNewMenu(entityId: number) {
    window.open('/entity/' + entityId, '_blank');
  }
  /**
   * create context menu for graph options
   */
   public openContextMenu(event: any, contextMenu: TemplateRef<any>) {
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

    this.overlayRef.attach(new TemplatePortal(contextMenu, this.viewContainerRef, {
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

  public isGraphEntityRemovable(entityEvt: any): boolean {
    return this.entityDetailComponent.isGraphEntityRemovable(entityEvt.entityId);
  }
  public showGraphEntityRelationships(entityEvt: any) {
    this.entityDetailComponent.showGraphEntityRelationships(entityEvt.entityId);
    this.closeContextMenu();
  }
  public hideGraphEntityRelationships(entityEvt: any) {
    this.entityDetailComponent.hideGraphEntityRelationships(entityEvt.entityId);
    this.closeContextMenu();
  }
  public hideGraphEntity(entityEvt: any) {
    this.entityDetailComponent.hideGraphEntity(entityEvt.entityId);
    this.closeContextMenu();
  }
  public openWhyReportForGraphRelationship(linkEvt: any) {
    console.log('openWhyReportForGraphRelationship: ', linkEvt);
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
      this._showSearchResults = false;
      this._showEntityDetail  = true;
      this._showHowReport     = false;
    } else {
      this._showSearchResults = true;
      this._showEntityDetail  = false;
      this._showHowReport     = false;
    }
  }

  public onHowButtonClick(entityId) {
    console.log('onHowButtonClick: ', entityId);
    this.howReportEntityId  = entityId;
    this._showSearchResults = false;
    this._showEntityDetail  = false;
    this._showHowReport     = true;
  }

  public onSearchResultsCleared(searchParams: SzEntitySearchParams | void){
    // hide search results
    this.currentSearchResults       = undefined;
    this.currentlySelectedEntityId  = undefined;
    this.howReportEntityId          = undefined;
    this._showSearchResults = false;
    this._showEntityDetail  = false;
    this._showHowReport     = false;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }
}
