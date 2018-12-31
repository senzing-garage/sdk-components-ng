import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzDataSourceBreakdown } from '../../../models/responces/search-results/data-source-breakdown';
import { SzEntityRecord } from '../../../models/responces/search-results/entity-record';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-record-card-header',
  templateUrl: './sz-entity-record-card-header.component.html',
  styleUrls: ['./sz-entity-record-card-header.component.scss']
})
export class SzEntityRecordCardHeaderComponent implements OnInit {
  @Input() searchResult: SzSearchResultEntityData;
  @Input() searchValue: string;
  @Input() hideBackGroundColor: boolean;
  @Input() entityData: SzEntityRecord;
  alert = false;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  constructor() {
  }

  ngOnInit() {
  }

  get breakDownInfoExist(): boolean {
    //console.log('card-header.component.breakDownInfoExist: ', this.searchResult);
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.dataSourceBreakdown.length > 0;
    } else if(this.entityData && this.entityData.dataSourceBreakdown) {
      return this.entityData.dataSourceBreakdown.length > 0;
    } else {
      return false;
    }
  }

  get breakDownInfo(): SzDataSourceBreakdown[] {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.dataSourceBreakdown;
    } else if(this.entityData && this.entityData.dataSourceBreakdown) {
      return this.entityData.dataSourceBreakdown;
    }
  }

  get entityDetailsLinkName(): string {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.bestName;
    } else if(this.entityData && this.entityData.bestName) {
      return this.entityData.bestName;
    }
  }

  get entityDetailsLink(): string | boolean {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return `/search/details/${this.searchResult.resolvedEntity.entityId}`;
    } else if(this.entityData && this.entityData.entityId ) {
      //return '/search/by-entity-id/3086';
      return `/search/by-entity-id/${this.entityData.entityId}`;
    }
    return false;
  }

  get entityDetailsId(): number | boolean {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.entityId;
    } else if(this.entityData && this.entityData.entityId ) {
      //return '/search/by-entity-id/3086';
      return this.entityData.entityId;
    }
    return false;
  }

  public onEntityDetailLinkClick(entityId: number | boolean): void {
    if(entityId && entityId > 0 && typeof entityId == 'number'){
      console.log('onEntityDetailLinkClick: "'+ entityId +'"');
      this.entityRecordClick.emit(entityId);
    }
  }
}
