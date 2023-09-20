import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { SzEntitySearchParams } from '../../models/entity-search';
import {
  EntityDataService,
  SzAttributeSearchResult,
  SzAttributeSearchResultType,
  SzEntityIdentifier
} from '@senzing/rest-api-client-ng';
import { SzPrefsService, SzSearchResultsPrefs } from '../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { SzWhyEntitiesDialog } from '../../why/sz-why-entities.component';
import { SzAlertMessageDialog } from '../../shared/alert-dialog/sz-alert-dialog.component';
import { parseBool } from '../../common/utils';
import { howClickEvent } from '../../models/data-how';

/**
 * Provides a graphical search results component. Data can be provided a number of ways.
 * The simplest of which is to bind the results input setter to the output of the
 * {@link SzSearchComponent} resultsChange event.
 * @export
 * 
 * @example 
 * <!-- (Angular) SzSearchComponent -->
 * <sz-search
 * name="Isa Creepr"
 * (resultsChange)="resultsOfSearch=$event"></sz-search>
 * <sz-search-results [results]="resultsOfSearch"></sz-search-results>
 *
 * @example 
 * <!-- (WC javascript) SzSearchComponent and SzSearchResultsComponent combo -->
 * <sz-wc-search
 * id="sz-search"
 * name="Isa Creepr"></sz-wc-search>
 * <sz-wc-search-results id="sz-search-results"></sz-wc-search-results>
 * <script>
 *  var szSearchComponent = document.getElementById('sz-search');
 *  var szSearchResultsComponent = document.getElementById('sz-search-results');
 *  szSearchComponent.addEventListener('resultsChange', (evt) => {
 *    console.log('search results: ', evt);
 *    szSearchResultsComponent.results = evt.detail;
 *  });
 * </script>
 * 
 */
@Component({
  selector: 'sz-search-results',
  templateUrl: './sz-search-results.component.html',
  styleUrls: ['./sz-search-results.component.scss']
})
export class SzSearchResultsComponent implements OnInit, OnDestroy {
  public searchResultsJSON; // TODO: remove after debugging
  public _searchResults: SzAttributeSearchResult[];
  public _searchValue: SzEntitySearchParams;
  public attributeDisplay: { attr: string, value: string }[];
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  /**
   * Shows or hides the datasource lists in the result items header.
   * @memberof SzSearchResultsComponent
   */
  @Input() showDataSources: boolean = true;

  /**
   * Shows or hides the match keys in the result items header.
   * @memberof SzSearchResultsComponent
   */
  @Input() set showMatchKeys(value: boolean) {
    if(value && this.prefs.searchResults.showMatchKeys === undefined) {
      // current pref is undefined, set it only once so user
      // can override this value
      this.prefs.searchResults.showMatchKeys = value;
    }
  }
  public get showMatchKeys(): boolean {
    return this.prefs.searchResults.showMatchKeys !== undefined ? this.prefs.searchResults.showMatchKeys : false;
  }

  private _showWhyComparisonButton: boolean = false;
  /**
   * Shows or hides the multi-select "Why" comparison button.
   * @memberof SzSearchResultsComponent
   */
  @Input() set showWhyComparisonButton(value: boolean | string) {
    this._showWhyComparisonButton = parseBool(value);
  }
  public get showWhyComparisonButton(): boolean {
    return this._showWhyComparisonButton;
  }
  private _openWhyComparisonModalOnClick: boolean = true;
  /** whether or not to automatically open a modal with the entity comparison on 
   * "Why" button click. (disable for custom implementation/action)
   */
   @Input() openWhyComparisonModalOnClick(value: boolean) {
    this._openWhyComparisonModalOnClick = value;
  }
  private _showHowButton: boolean = false;
  /**
   * Shows or hides the multi-select "Why" comparison button.
   * @memberof SzSearchResultsComponent
   */
  @Input() set showHowButton(value: boolean | string) {
    this._showHowButton = parseBool(value);
    if(value !== undefined) {
      this.prefs.searchResults.showHowButton = parseBool(value);
    }
  }
  public get showHowButton(): boolean {
    return this._showHowButton;
  }
  /** (Event Emitter) when the user clicks on the "Why" button */
  @Output() whyButtonClick = new EventEmitter<SzEntityIdentifier[]>();
  /** (Event Emitter) when the user clicks on the "How" button */
  @Output() howButtonClick = new EventEmitter<howClickEvent>();

  private _entitySelectActive = false;
  public get entitySelectActive(): boolean {
    return this._entitySelectActive;
  }
  /** @internal */
  private _selectedEntities:SzAttributeSearchResult[] = [];
  /**
   * get the entities selected during a multi-select operation such as when 
   * "Why" comparison mode select is active.
   */
  public get selectedEntities():SzAttributeSearchResult[] {
    return this._selectedEntities;
  }
  // the api service only allows two entities at a time to be compared
  // if this changes in the future change this to match
  private _maximumEntitiesSelected = 2;
  // used to prevent annoying the user with multiple alert messages
  private _maximumAlertAlreadyShown = false;

  /**
   * The results of a search response to display in the component.
   * @memberof SzSearchResultsComponent
   */
  @Input('results')
  public set searchResults(value: SzAttributeSearchResult[]){
    // value set from webcomponent attr comes in as string
    this._searchResults = (typeof value == 'string') ? JSON.parse(value) : value;
    //this.searchResultsJSON = JSON.stringify(this._searchResults, null, 4);
  };
  /**
   * The search results being displayed in the component.
   *
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get searchResults(): SzAttributeSearchResult[] {
    return this._searchResults;
  }

  // ----------- getters for different grouping/filtering of search results ----------

  /**
   * A list of the search results that are matches.
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get matches(): SzAttributeSearchResult[] {
    return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
      return sr.resultType == SzAttributeSearchResultType.MATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are possible matches.
   *
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get possibleMatches(): SzAttributeSearchResult[] {
    return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
      return sr.resultType == SzAttributeSearchResultType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get discoveredRelationships(): SzAttributeSearchResult[] {
    return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
      return sr.resultType == SzAttributeSearchResultType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get nameOnlyMatches(): SzAttributeSearchResult[] {
    return this._searchResults && this._searchResults.filter ? this._searchResults.filter( (sr) => {
      return sr.resultType == SzAttributeSearchResultType.NAMEONLYMATCH;
    }) : undefined;
  }

  /**
   * The current search parameters being used.
   * used for displaying the parameters being searched on above result list.
   * @memberof SzSearchResultsComponent
   */
  @Input('parameters')
  public set searchValue(value: SzEntitySearchParams){
    this._searchValue = value;

    if(value){
      this.attributeDisplay = Object.keys(this._searchValue)
      .filter((key, index, self) => {
        if(key === 'IDENTIFIER_TYPE'){
          return Object.keys(self).includes('IDENTIFIER');
        }
        if(key === 'NAME_TYPE'){
          return false;
        }
        if(key === 'ADDR_TYPE'){
          return false;
        }
        if(key === 'COMPANY_NAME_ORG'){
          return false;
        }

        return true;
      })
      .map(key => {
        const humanKeys = {
          'PHONE_NUMBER':'PHONE',
          'NAME_FULL':'NAME',
          'PERSON_NAME_FULL':'NAME',
          'NAME_FIRST':'FIRST NAME',
          'NAME_LAST':'LAST NAME',
          'EMAIL_ADDRESS': 'EMAIL',
          'ADDR_CITY':'CITY',
          'ADDR_STATE':'STATE',
          'ADDR_POSTAL_CODE':'ZIP CODE',
          'SSN_NUMBER':'SSN',
          'DRIVERS_LICENSE_NUMBER':'DL#'
        }
        let retVal = {attr: key, value: this._searchValue[key]};                  // temp const
        if(humanKeys[retVal.attr]){ retVal.attr = humanKeys[retVal.attr]; };      // repl enum val with human readable
        retVal.attr = this.titleCasePipe.transform(retVal.attr.replace(/_/g,' ')); // titlecase trans

        return retVal
      })
      .filter(i => !!i);
    }
  }
  /**
   * The current search parameters being used.
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  public get searchValue(): SzEntitySearchParams {
    return this._searchValue;
  }
  /**
   * Occurs when a search result item is clicked.
   *
   * @memberof SzSearchResultsComponent
   */
  @Output()
  public resultClick: EventEmitter<SzAttributeSearchResult> = new EventEmitter<SzAttributeSearchResult>();
  /**
   * DOM click handler which then triggers the "resultClick" event emitter.
   *
   * @memberof SzSearchResultsComponent
   */
  public onResultClick(evt: any, resData: SzAttributeSearchResult): void
  {
    if(this._entitySelectActive){
      this.toggleSelected( resData );
      return;
    }

    // preflight check to see if user is trying to select text
    if(window && window.getSelection){
      var selection = window.getSelection();
      if(selection.toString().length === 0) {
        // evt proxy
        this.resultClick.emit(resData);
      }
    } else {
      this.resultClick.emit(resData);
    }
  }
  /** when the user clicks the multi-select button to enable/disable click to select behavior this handler is invoked */
  public onComparisonModeActiveChange(isActive: boolean) {
    this._entitySelectActive = isActive;
  }
  /** for multi-select the user has to click the button to change the default row behavior from 
   * click->go to detail to click->select for comparison
   */
  public onComparisonModeToggleClick(evt: any) {
    this._entitySelectActive = !this._entitySelectActive;
  }
  /** when the compare button is clicked */
  public onCompareClick(evt: any) {
    console.log('onCompareClicked: ', this._selectedEntities);
    let selectedEntityIds = this._selectedEntities.map((entityResult: SzAttributeSearchResult) => {
      return entityResult.entityId;
    });

    this.whyButtonClick.emit(selectedEntityIds);
    if(this._openWhyComparisonModalOnClick) {
      this.dialog.open(SzWhyEntitiesDialog, {
        panelClass: 'why-entities-dialog-panel',
        minWidth: 800,
        height: 'var(--sz-why-dialog-default-height)',
        data: {
          entities: selectedEntityIds,
          showOkButton: false,
          okButtonText: 'Close'
        }
      });
    }
  }
  /** when the "how" button is clicked */
  public onHowClicked(event: howClickEvent) {
    //console.log('@senzing/sz-search-results/onHowClicked: ', entityId);
    this.howButtonClick.emit(event);
  }
  /** clear any selected entity results if "_showWhyComparisonButton" set to true */
  public clearSelected() {
    this._selectedEntities = [];
  }
  /** add entity to selection if not already in it. remove entity from selection if already in selection */
  public toggleSelected(entityResult: SzAttributeSearchResult) {
    if(entityResult) {
      let existingPosition = this._selectedEntities.findIndex((entityToMatch: SzAttributeSearchResult) => {
        return entityToMatch &&  entityResult && entityToMatch.entityId === entityResult.entityId;
      })
      if(existingPosition > -1 && this._selectedEntities && this._selectedEntities[ existingPosition ]) {
        // remove from array
        this._selectedEntities.splice(existingPosition, 1);
      } else if(this._selectedEntities.length < this._maximumEntitiesSelected) {
        // add to array
        this._selectedEntities.push( entityResult );
      } else if(this._selectedEntities.length >= this._maximumEntitiesSelected && !this._maximumAlertAlreadyShown) {
        let alertDialog = this.dialog.open(SzAlertMessageDialog, {
          panelClass: 'alert-dialog-panel',
          height: '240px',
          width: '338px',
          data: {
            'title':`${this._maximumEntitiesSelected} Already Selected`,
            'text':'the maximum number of entities that can be compared has been reached.',
            'buttonText':'Ok'
          }
        });
        alertDialog.afterClosed().pipe(
          take(1)
        ).subscribe((closedWithButton) => {
          if(closedWithButton) this._maximumAlertAlreadyShown = true;
        })
      }
    }
  }
  /** is a search result already selected */
  public isSelected(entityResult: SzAttributeSearchResult) {
    if(entityResult) {
      let existingPosition = this._selectedEntities.findIndex((entityToMatch: SzAttributeSearchResult) => {
        return entityToMatch &&  entityResult && entityToMatch.entityId === entityResult.entityId;
      })
      if(existingPosition > -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Total number of search results being displayed.
   *
   * @readonly
   * @memberof SzSearchResultsComponent
   */
  get searchResultsTotal(): number {
    return (this.searchResults && this.searchResults.length) ? this.searchResults.length : 0;
  }

  constructor(
    private titleCasePipe: TitleCasePipe,
    private prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.prefs.searchResults.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (pJson: SzSearchResultsPrefs)=>{
      //console.warn('SEARCH RESULTS PREF CHANGE!', pJson);
      this.cd.detectChanges();
    });
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
