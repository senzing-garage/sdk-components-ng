import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzDataSourceBreakdown } from '../../../models/responces/search-results/data-source-breakdown';
import { SzEntityRecord } from '../../../models/responces/search-results/entity-record';
import {
  EntityDataService,
  SzAttributeSearchResult,
  SzDataSourceRecordSummary
} from '@senzing/rest-api-client-ng';

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

  @Input()
  set searchResult(value: SzAttributeSearchResult) {
    this._searchResult = value;
    //console.log('sz-search-result-card-header.setSearchResult: ', this._searchResult);
  }
  get searchResult(): SzAttributeSearchResult {
    return this._searchResult;
  }
  @Input() searchValue: string;
  @Input() hideBackGroundColor: boolean;
  @Input() entityData: SzEntityRecord;
  alert = false;

  get recordSummariesExist(): boolean {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries.length > 0;
    }
    return false
  }

  get recordSummaries(): SzDataSourceRecordSummary[] | boolean {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries;
    }
    return false
  }

  get entityDetailsLinkName(): string {
    //console.log('sz-search-result-card-header.getEntityDetailsLinkName: ', this._searchResult);
    if (this._searchResult && this._searchResult.entityName) {
      return this._searchResult.entityName;
    } else if(this._searchResult && this._searchResult.bestName) {
      return this._searchResult.bestName;
    }
  }

  get entityDetailsLink(): string | boolean {
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
