import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzDataSourceBreakdown } from '../../../models/responces/search-results/data-source-breakdown';
import { SzEntityRecord } from '../../../models/responces/search-results/entity-record';

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
  private _searchResult: SzSearchResultEntityData;
  @Input()
  set searchResult(value: SzSearchResultEntityData) {
    this._searchResult = value;
    console.log('sz-search-result-card-header.setSearchResult: ', this._searchResult);
  }
  get searchResult(): SzSearchResultEntityData {
    return this._searchResult;
  }
  @Input() searchValue: string;
  @Input() hideBackGroundColor: boolean;
  @Input() entityData: SzEntityRecord;
  alert = false;

  get breakDownInfoExist(): boolean {
    //console.log('card-header.component.breakDownInfoExist: ', this.searchResult);
    if (this._searchResult && this._searchResult.resolvedEntity) {
      return this._searchResult.resolvedEntity.dataSourceBreakdown.length > 0;
    } else if(this.entityData && this.entityData.dataSourceBreakdown) {
      return this.entityData.dataSourceBreakdown.length > 0;
    } else {
      return false;
    }
  }

  get breakDownInfo(): SzDataSourceBreakdown[] {
    if (this._searchResult && this._searchResult.resolvedEntity) {
      return this._searchResult.resolvedEntity.dataSourceBreakdown;
    } else if(this.entityData && this.entityData.dataSourceBreakdown) {
      return this.entityData.dataSourceBreakdown;
    }
  }

  get entityDetailsLinkName(): string {
    console.log('sz-search-result-card-header.getEntityDetailsLinkName: ', this._searchResult);
    if (this._searchResult && this._searchResult.resolvedEntity) {
      return this._searchResult.resolvedEntity.bestName;
    } else if(this._searchResult && this._searchResult.bestName) {
      return this._searchResult.bestName;
    }
  }

  get entityDetailsLink(): string | boolean {
    if (this._searchResult && this._searchResult.resolvedEntity) {
      return `/search/details/${this._searchResult.resolvedEntity.entityId}`;
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
