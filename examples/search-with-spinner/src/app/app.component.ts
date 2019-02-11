import { Component } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number = undefined;
  public currentSearchParameters: SzEntitySearchParams;
  public searchException: Error;
  public errorMessage: string;

  public showSearchResults = false;
  public get showSearchResultDetail(): boolean {
    if(this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }

  onSearchResults(evt: SzAttributeSearchResult[]){
    console.log('searchResults: ',evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property

    // clear errors
    this.errorMessage = undefined;

    // show results
    this.showSearchResults = true;
  }

  onSearchException(err: Error) {
    this.searchException = err;
    console.log(err);
    if(err.message == 'null criteria'){
      this.errorMessage = "Please add a criteria to search for.";
    } else if(err.message.startsWith('Http failure')) {
      this.errorMessage = "API Server unreachable.";
    } else {
      this.errorMessage = this.searchException.message;
    }
  }

  public onBackToSearchResultsClick($event): void {
    this.showSearchResults = true;
    this.currentlySelectedEntityId = undefined;
  }

  public onSearchResultClick(entityData: SzAttributeSearchResult){
    console.log('onSearchResultClick: ', entityData);
    //alert('clicked on search result!'+ entityData.entityId);

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
    // clear errors
    this.errorMessage = undefined;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.currentSearchParameters = searchParams;
  }

  // -----------  progress spinner related
  public _showProgressSpinner: boolean = false;
  public progressSpinnerMinTime: number = 500;
  public progressSpinnerMaxTime: number = 2000;

  public _progressSpinnerTO;
  public _progressSpinnerTE;

  public get showProgressSpinner(): boolean {
    return this._showProgressSpinner;
  }

  public set showProgressSpinner(value) {
    console.log('setter: showProgressSpinner('+ value +')');
    let onMinTimeElapsed = () => {
      if(this._progressSpinnerTE){ clearTimeout(this._progressSpinnerTE); }
      this._progressSpinnerTE = false;
      console.log('onMinTimeElapsed 1');
    }

    let clearTimers = () => {
      if(this._progressSpinnerTE){ clearTimeout(this._progressSpinnerTE); }
      if(this._progressSpinnerTO){ clearTimeout(this._progressSpinnerTO); }
      this._progressSpinnerTE = false;
      this._progressSpinnerTO = false;
    }

    if(value){
      // -- show spinner
      this._showProgressSpinner = value;

      // set min display timer
      if(!this._progressSpinnerTE){
        this._progressSpinnerTE = setTimeout(onMinTimeElapsed, this.progressSpinnerMinTime);
      }

      // set max timeout value
      if(!this._progressSpinnerTO){
        this._progressSpinnerTO = setTimeout(()=>{
          this._showProgressSpinner = false;
          clearTimers();
          console.log('onMaxTimeElapsed');
        }, this.progressSpinnerMaxTime);
      }
    } else {
      // -- hide spinner

      if(this._progressSpinnerTE){
        // time not yet elapsed
        // just add additional "this._showProgressSpinner=false"
        onMinTimeElapsed = () => {
          this._showProgressSpinner = false;
          clearTimers();
          console.log('onMinTimeElapsed 2');
        }
      } else {
        // min time elapsed, just hide it
        this._showProgressSpinner = false;
        clearTimers();
      }
    }
  }

}
