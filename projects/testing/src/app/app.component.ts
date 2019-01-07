import { Component } from '@angular/core';
import { SzSearchResults, SzSearchResultEntityData, SzEntitySearchParams } from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  public currentSearchResults: SzSearchResults;
  public currentlySelectedEntityId: number = 4067;
  public currentSearchParameters: SzEntitySearchParams;

  public showSearchResults = false;
  public showSearchResultDetail = false;

  onSearchResults(evt: SzSearchResults){
    console.log('searchResults: ',evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // show results
    this.showSearchResults = true;
    // hide detail
    this.showSearchResultDetail = false;
  }

  public onSearchResultClick(entityData: SzSearchResultEntityData){
    console.log('onSearchResultClick: ', entityData);
    //alert('clicked on search result!'+ entityData.entityId);

    if(entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
      this.showSearchResultDetail = true;
      this.showSearchResults = false;
    } else {
      this.showSearchResultDetail = false;
    }
  }

  public onSearchResultsCleared(searchParams: SzEntitySearchParams){
    // hide search results
    this.showSearchResults = false;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }
}
