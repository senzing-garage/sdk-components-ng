import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { SzSearchResults } from '../..//models/responces/search-results/search-results';
import { SzEntitySearchParams } from '../../models/entity-search';
import { SzEntityDetailSectionData } from '../../models/entity-detail-section-data';

@Component({
  selector: 'sz-search-results',
  templateUrl: './sz-search-results.component.html',
  styleUrls: ['./sz-search-results.component.scss']
})
export class SzSearchResultsComponent implements OnInit {
  public _searchResults: SzSearchResults;
  public _searchValue: SzEntitySearchParams;
  public attributeDisplay: { attr: string, value: string }[];

  @Input('results')
  public set searchResults(value: SzSearchResults){
    // value set from webcomponent attr comes in as string
    this._searchResults = (typeof value == 'string') ? JSON.parse(value) : value;
    this.searchResultsJSON = JSON.stringify(this._searchResults, null, 4);
    console.log('@senzing/sdk/search/sz-search-results/sz-search-results.component@input(results) setter'+ (typeof value) +': \n', this._searchResults);
  };

  public get searchResults(): SzSearchResults {
    return this._searchResults;
  }

  @Input('parameters')
  public set searchValue(value: SzEntitySearchParams){
    this._searchValue = value;

    this.attributeDisplay = Object.keys(this._searchValue)
      .map(key => {
        if (this._searchValue[key]) {
          if (key.toLowerCase() === 'phonenumber') {
            return { attr: 'Phone', value: this._searchValue[key] };
          }
          if (key.toLowerCase() === 'orgname') {
            return;
          }
          return { attr: this.titleCasePipe.transform(key), value: this._searchValue[key] };
        }
      })
      .filter(i => !!i)
      .filter((searchValuePair, index, self) => {
        return searchValuePair.attr.toLowerCase() === 'type' ? Object.keys(self).includes('identifier') : true;
      });
  }

  public get searchValue(): SzEntitySearchParams {
    return this._searchValue;
  }

  @Output()
  public resultClick: EventEmitter<SzEntityDetailSectionData> = new EventEmitter<SzEntityDetailSectionData>();

  public onResultClick(evt: any, resData: SzEntityDetailSectionData): void{
    // evt proxy
    this.resultClick.emit(resData);
  }

  get searchResultsTotal(): number {
    if (this.searchResults) {
      return this.searchResults.discoveredRelationships.length +
        this.searchResults.possibleMatches.length +
        this.searchResults.matches.length +
        this.searchResults.nameOnlyMatches.length;
    }
    return 0;
  }

  // TODO: remove after debugging
  public searchResultsJSON;

  constructor(
    private titleCasePipe: TitleCasePipe
  ) {}

  ngOnInit() {}

}
