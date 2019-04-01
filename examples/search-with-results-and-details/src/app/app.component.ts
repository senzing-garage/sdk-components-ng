import { Component, ViewChild, AfterViewInit } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzEntityDetailComponent
} from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements AfterViewInit {
  @ViewChild(SzEntityDetailComponent) entityDetailView: SzEntityDetailComponent;

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
  onSearchException(err: Error) {
    throw (err.message);
  }

  onSearchResults(evt: SzAttributeSearchResult[]) {
    console.log('searchResults: ', evt);
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

  public toggleExpanded($event, section?: string): void {
    console.log('toggleExpanded: ', $event, section);
    switch (section) {
      case 'records':
        this.entityDetailView.recordsCollapsed = !this.entityDetailView.recordsCollapsed;
        break;
      case 'possible':
        this.entityDetailView.possibleCollapsed = !this.entityDetailView.possibleCollapsed;
        break;
      case 'discovered':
        this.entityDetailView.discoveredCollapsed = !this.entityDetailView.discoveredCollapsed;
        break;
      case 'disclosed':
        this.entityDetailView.disclosedCollapsed = !this.entityDetailView.disclosedCollapsed;
        break;
     }
  }

  ngAfterViewInit() {
    console.log("entity detail:", this.entityDetailView, this);
  }

  public onSearchResultClick(entityData: SzAttributeSearchResult) {
    console.log('onSearchResultClick: ', entityData);
    // alert('clicked on search result!'+ entityData.entityId);

    if(entityData && entityData.entityId > 0) {
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
