import { Component, OnInit, Input } from '@angular/core';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';


import {
  SzEntityData,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class SzEntityDetailHeaderComponent implements OnInit {
  @Input() public searchTerm: string;
  @Input() public entity: SzEntityData;

/**
   * A list of the search results that are matches.
   * @readonly
   */
  public get matches(): SzEntityRecord[] {
    return this.entity && this.entity.resolvedEntity.records ? this.entity.resolvedEntity.records : undefined;
  }
  /**
   * A list of the search results that are possible matches.
   *
   * @readonly
   */
  public get possibleMatches(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   */
  public get discoveredRelationships(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   */
  public get disclosedRelationships(): SzRelatedEntity[] {

    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    }) : undefined;
  }



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
          total: this.possibleMatches.length,
          title: 'Possible Match'+ (this.possibleMatches.length === 1 ? '' : 'es')
        },
        {
          total: this.discoveredRelationships.length,
          title: 'Possible Relationship'+ (this.discoveredRelationships.length === 1 ? '' : 's')
        },
        {
          total: this.disclosedRelationships.length,
          title: 'Disclosed Relationship'+ (this.disclosedRelationships.length === 1 ? '' : 's')
        },
      ];
    }
    return [];
  }

}
