import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SzEntityRecord, SzAttributeSearchResult, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';
import { bestEntityName } from '../../../entity/entity-utils';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-search-result-card-header',
  templateUrl: './sz-search-result-card-header.component.html',
  styleUrls: ['./sz-search-result-card-header.component.scss']
})
export class SzSearchResultCardHeaderComponent implements OnInit {
  private _searchResult: SzAttributeSearchResult;

  @Input() showDataSources: boolean = true;

  @Input() public set searchResult(value: SzAttributeSearchResult) {
    this._searchResult = value;
    //console.log('sz-search-result-card-header.setSearchResult: ', this._searchResult);
  }
  public get searchResult(): SzAttributeSearchResult {
    return this._searchResult;
  }

  @Input() public searchValue: string;
  @Input() public hideBackGroundColor: boolean;
  @Input() public entityData: SzEntityRecord;
  alert = false;

  public get recordSummariesExist(): boolean {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries.length > 0;
    }
    return false;
  }

  public get recordSummaries(): SzDataSourceRecordSummary[] | boolean {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries;
    }
    return false
  }

  public get bestName() : string {
    return bestEntityName(this._searchResult);
  }

  public get entityDetailsLinkName(): string { 
    return this.bestName;
  }

  public get entityDetailsLink(): string | boolean {
    if (this._searchResult && this._searchResult.entityId) {
      return `/search/details/${this._searchResult.entityId}`;
    } else if(this._searchResult && this._searchResult.entityId ) {
      //return '/search/by-entity-id/3086';
      return `/search/by-entity-id/${this._searchResult.entityId}`;
    }
    return false;
  }

  constructor() { }

  ngOnInit() {

  }

}
