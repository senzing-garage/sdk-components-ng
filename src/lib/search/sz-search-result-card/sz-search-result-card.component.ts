import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SzEntityDetailSectionData } from '../../models/entity-detail-section-data';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-search-result-card',
  templateUrl: './sz-search-result-card.component.html',
  styleUrls: ['./sz-search-result-card.component.scss']
})
export class SzSearchResultCardComponent implements OnInit {
  @Input()searchResult: SzEntityDetailSectionData;
  @Input()searchValue: string;
  @Input()cardTitle: string;
  @Input()index: number;
  @Input()isOpen: boolean[];
  @Input()isPrinting: boolean;
  @Input()showDataSources: boolean;

  showRecordId: boolean[] = [];

  constructor() { }

  ngOnInit() {
    if(this.searchResult) {
      this.showRecordId.fill(false, this.searchResult.records.length);
    }
  }

  toggleShowRecordId(index: number): void {
    this.showRecordId[index] = !this.showRecordId[index];
  }

  get cardOpened(): boolean {
    return this.isOpen[this.index];
  }

  get moreThanOneSource(): boolean {
    return this.searchResult.records.length > 1;
  }

  get entityDetailsLink(): string {
    return `/search/by-entity-id/${this.searchResult.entityId}`;
    //return `/search/details/${this.searchResult.entityId}`;
  }

}
