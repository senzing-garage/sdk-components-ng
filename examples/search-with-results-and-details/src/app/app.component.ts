import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzPdfUtilService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData
} from '@senzing/sdk-components-ng';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number = undefined;
  public currentSearchParameters: SzEntitySearchParams;
  public showSearchResults = false;
  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }
  @ViewChild('searchBox') searchBox: SzSearchComponent;
  @ViewChild('entityDetailComponent') entityDetailComponent: SzEntityDetailComponent;

  public get showPdfDownloadButton(): boolean {
    return (this.currentSearchResults !== undefined && this.currentSearchResults && this.currentSearchResults.length > 0);
  }

  constructor(public pdfUtil: SzPdfUtilService, public searchService: SzSearchService){}

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
