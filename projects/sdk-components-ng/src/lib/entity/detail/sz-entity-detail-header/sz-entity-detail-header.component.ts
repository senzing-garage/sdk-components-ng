import { Component, OnInit, Input } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';
import { SzProject } from '../../../project/project';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-header',
  templateUrl: './sz-entity-detail-header.component.html',
  styleUrls: ['./sz-entity-detail-header.component.scss']
})
export class SzEntityDetailHeaderComponent implements OnInit {
  @Input() public searchTerm: string;
  @Input() public project: SzProject;
  @Input() public entity: SzSearchResultEntityData;

  constructor() {
  }

  ngOnInit() {}

  get sectionSummaryInfo(): SzEntityDetailSectionSummary[] {
    if (this.entity) {
      return [
        {
          total: this.entity.resolvedEntity.records.length,
          title: 'Matched Record'+ (this.entity.resolvedEntity.records.length === 1 ? '' : 's')
        },
        {
          total: this.entity.possibleMatches.length,
          title: 'Possible Match'+ (this.entity.possibleMatches.length === 1 ? '' : 'es')
        },
        {
          total: this.entity.discoveredRelationships.length,
          title: 'Possible Relationship'+ (this.entity.discoveredRelationships.length === 1 ? '' : 's')
        },
        {
          total: this.entity.disclosedRelationships.length,
          title: 'Disclosed Relationship'+ (this.entity.disclosedRelationships.length === 1 ? '' : 's')
        },
      ];
    }
    return [];
  }

}
