import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-section-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SzEntityDetailSectionSummaryComponent implements OnInit {
  @Input()section: SzEntityDetailSectionSummary;
  @Input()sectionId: number;

  constructor() { }

  ngOnInit() {
  }

  get sectionTarget(): string {
    return 'detail-section-'+ this.sectionId;
  }

  get noResults(): boolean {
    if(this.section) {
      return this.section.total <= 0;
    }
    return true;
  }

  get isMatchedRecords(): boolean {
    return this.section.title.toLowerCase() === 'matched records' || this.section.title.toLowerCase() === 'matched record';
  }

  get isPossibleMatches(): boolean {
    return this.section.title.toLowerCase() === 'possible matches' || this.section.title.toLowerCase() === 'possible match';
  }
  get isPossibleRelationships(): boolean {
    return this.section.title.toLowerCase() === 'possible relationships' || this.section.title.toLowerCase() === 'possible relationship';
  }
  get isDisclosedRelationships(): boolean {
    return this.section.title.toLowerCase() === 'disclosed relationships' || this.section.title.toLowerCase() === 'disclosed relationship';
  }
}
