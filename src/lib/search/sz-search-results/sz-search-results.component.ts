import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { SzEntitySearchParams } from '../../models/entity-search';
import {
  EntityDataService,
  SzAttributeSearchResult,
  SzAttributeSearchResultType
} from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { SzWhyEntitiesDialog } from '../../why/sz-why-entities.component';

/**
 * Provides a graphical search results component. Data can be provided a number of ways.
 * The simplest of which is to bind the results input setter to the output of the
 * {@link SzSearchComponent} resultsChange event.
 * @export
 * 
 * @example 
 * <code><br/>
 * &lt;!-- (Angular) SzSearchComponent --&gt;<br/>
 * &lt;sz-search<br/>
 * name="Isa Creepr"<br/>
 * (resultsChange)="resultsOfSearch=$event"&gt;&lt;/sz-search&gt;<br/>
 * &lt;sz-search-results [results]="resultsOfSearch"&gt;&lt;/sz-search-results&gt;<br/><br/>
 *
 * &lt;!-- (WC javascript) SzSearchComponent and SzSearchResultsComponent combo --&gt;<br/>
 * &lt;sz-wc-search<br/>
 * id="sz-search"<br/>
 * name="Isa Creepr"&gt;&lt;/sz-wc-search&gt;<br/>
 * &lt;sz-wc-search-results id="sz-search-results"&gt;&lt;/sz-wc-search-results&gt;<br/>
 * &lt;script&gt;<br/>
 *  var szSearchComponent = document.getElementById('sz-search');<br/>
 *  var szSearchResultsComponent = document.getElementById('sz-search-results');<br/>
 *  szSearchComponent.addEventListener('resultsChange', (evt) => {<br/>
 *    console.log('search results: ', evt);<br/>
 *    szSearchResultsComponent.results = evt.detail;<br/>
 *  });<br/>
 * &lt;/script&gt;<br/>
 * </code>
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
   * Shows or hides the datasource lists in the result items header.
   * @memberof SzSearchResultsComponent
   */
  @Input() showWhyIcon: boolean = true;
  private _entitySelectActive = false;
  public get entitySelectActive(): boolean {
    return this._entitySelectActive;
  }
  private _selectedEntities:SzAttributeSearchResult[] = [];
  public get selectedEntities():SzAttributeSearchResult[] {
    return this._selectedEntities;
  }

  public get selectedEntitiesTooltipText(): string {
    if(this._selectedEntities && this._selectedEntities.length > 1) {
      return `${this._selectedEntities.length} entities selected. click compare to know why these entities didn't come together.`;
    } else if(this._selectedEntities && this._selectedEntities.length === 1) {
      return `${this._selectedEntities.length} entity selected. another must be selected for comparison.`;
    } else {
      return `0 entities selected. click each entity to select for comparison.`;
    }
  }

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

  public onComparisonModeToggleClick(evt: any) {
    this._entitySelectActive = !this._entitySelectActive;
  }

  public onCompareClick(evt: any) {
    console.log('onCompareClicked: ', this._selectedEntities);
    
    this.dialog.open(SzWhyEntitiesDialog, {
      data: {
        entities: this._selectedEntities.map((entityResult: SzAttributeSearchResult) => {
          return entityResult.entityId;
        })
      }
    });
    
  }

  public toggleSelected(entityResult: SzAttributeSearchResult) {
    if(entityResult) {
      let existingPosition = this._selectedEntities.findIndex((entityToMatch: SzAttributeSearchResult) => {
        return entityToMatch &&  entityResult && entityToMatch.entityId === entityResult.entityId;
      })
      if(existingPosition > -1 && this._selectedEntities && this._selectedEntities[ existingPosition ]) {
        // remove from array
        this._selectedEntities.splice(existingPosition, 1);
      } else {
        // add to array
        this._selectedEntities.push( entityResult );
      }
    }
  }

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
    ).subscribe( (pJson)=>{
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
