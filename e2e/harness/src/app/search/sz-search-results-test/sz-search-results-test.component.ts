import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

//import { SzSearchResults } from '../..//models/responces/search-results/search-results';
//import { SzEntityDetailSectionData } from '../../models/entity-detail-section-data';

import {
  EntityDataService,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams, SzSearchService, JSONScrubber } from '@senzing/sdk-components-ng';


@Component({
    selector: 'app-sz-search-results-test',
    templateUrl: './sz-search-results-test.component.html',
    styleUrls: ['./sz-search-results-test.component.scss'],
    standalone: false
})
export class SzSearchResultsTestComponent implements OnInit {
  public _searchResults: SzAttributeSearchResult[];
  public _searchValue: SzEntitySearchParams;
  public attributeDisplay: { attr: string, value: string }[];
  // TODO: remove after debugging
  public searchResultsJSON;

  @Input('results')
  public set searchResults(value: SzAttributeSearchResult[]){
    // value set from webcomponent attr comes in as string
    this._searchResults = (typeof value == 'string') ? JSON.parse(value) : value;
    //this.searchResultsJSON = JSON.stringify(this._searchResults, null, 4);
    console.log('@senzing/sdk/search/sz-search-results/sz-search-results.component@input(results) setter'+ (typeof value) +': \n', this._searchResults);
  };

  public get searchResults(): SzAttributeSearchResult[] {
    return this._searchResults;
  }

  // ----------- getters for different grouping/filtering of search results ----------

  public get matches(): SzAttributeSearchResult[] {
    return this._searchResults.filter( (sr) => {
      return sr.resultType == "MATCH";
    });
  }

  public get possibleMatches(): SzAttributeSearchResult[] {
    return this._searchResults.filter( (sr) => {
      return sr.resultType == "POSSIBLE_MATCH";
    });
  }
  public get discoveredRelationships(): SzAttributeSearchResult[] {
    return this._searchResults.filter( (sr) => {
      return sr.resultType == "POSSIBLE_RELATION";
    });
  }
  public get nameOnlyMatches(): SzAttributeSearchResult[] {
    return this._searchResults.filter( (sr) => {
      return sr.resultType == "NAME_ONLY_MATCH";
    });
  }

  @Input('parameters')
  public set searchValue(value: SzEntitySearchParams){
    this._searchValue = value;

    this.attributeDisplay = Object.keys(this._searchValue)
      .filter((key, index, self) => {
        if(key === 'IDENTIFIER_TYPE'){
          return Object.keys(self).includes('IDENTIFIER');
        }
        if(key === 'NAME_TYPE'){
          return false;
        }
        return true;
      })
      .map(key => {
        /*
        if (this._searchValue[key]) {
          if (key === 'PHONE_NUMBER') {
            return { attr: 'Phone', value: this._searchValue[key] };
          }
          if (key.toLowerCase() === 'orgname') {
            return;
          }
          return { attr: this.titleCasePipe.transform(key), value: this._searchValue[key] };
        }*/
        const humanKeys = {
          'PHONE_NUMBER':'PHONE',
          'NAME_FULL':'NAME',
          'EMAIL_ADDRESS': 'EMAIL'
        }
        let retVal = {attr: key, value: this._searchValue[key]};                  // temp const
        if(humanKeys[retVal.attr]){ retVal.attr = humanKeys[retVal.attr]; };      // repl enum val with human readable
        retVal.attr = this.titleCasePipe.transform(retVal.attr.replace('_',' ')); // titlecase trans

        return { attr: this.titleCasePipe.transform(key), value: this._searchValue[key] }
      })
      .filter(i => !!i);
  }

  public get searchValue(): SzEntitySearchParams {
    return this._searchValue;
  }


  @Output()
  public resultClick: EventEmitter<SzAttributeSearchResult> = new EventEmitter<SzAttributeSearchResult>();

  public onResultClick(evt: any, resData: SzAttributeSearchResult): void{
    // evt proxy
    this.resultClick.emit(resData);
  }

  get searchResultsTotal(): number {
    return (this.searchResults && this.searchResults.length) ? this.searchResults.length : 0;
  }

  constructor(
    private titleCasePipe: TitleCasePipe
  ) {}

  ngOnInit() {}
}
