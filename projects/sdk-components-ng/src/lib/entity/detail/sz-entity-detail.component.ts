import { Component, OnInit,  Input, Output, EventEmitter } from '@angular/core';
import { SzSearchService } from '../../services/sz-search.service';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

import {
  SzEntityData,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';

@Component({
  selector: 'sz-entity-detail',
  templateUrl: './sz-entity-detail.component.html',
  styleUrls: ['./sz-entity-detail.component.scss']
})
export class SzEntityDetailComponent {
  private _entityId: number;
  public projectId = 1;
  public entityDetailJSON: string = "";

  public entity: SzEntityData;
  // data views
  _discoveredRelationships: SzRelatedEntity[];
  _disclosedRelationships: SzRelatedEntity[];
  _possibleMatches: SzRelatedEntity[];
  _matches: SzEntityRecord[];



  @Input()
  public set entityId(value: number) {
    this._entityId = value;
    this.onEntityIdChange();
  }
  public get entityId(): number {
    return this._entityId;
  }

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

  public onEntityRecordClick(entityId: number): void {
    this.entityId = entityId;
  }

  constructor(
    private searchService: SzSearchService,
  ) {}

  onEntityIdChange() {
    if (this.projectId > 0 && this._entityId) {
      this.searchService.getEntityById(this._entityId).
      pipe(
        tap(res => console.log('SzSearchService.getEntityById: ' + this._entityId, res))
      ).
      subscribe((entityData: SzEntityData) => {
        console.log('sz-entity-detail.onEntityIdChange: ', entityData);
        this.entityDetailJSON = JSON.stringify(entityData, null, 4);
        this.entity = entityData;

        // doing the set on these manually because pulling directly from setter(s)
        // causes render change cycle to break mem and hammer redraw
        if(this.entity && this.entity.resolvedEntity.records) this._matches = this.entity.resolvedEntity.records
        if(this.entity && this.entity.relatedEntities.filter) this._possibleMatches = this.entity.relatedEntities.filter( (sr) => {
          return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
        });
        if(this.entity && this.entity.relatedEntities.filter) this._discoveredRelationships = this.entity.relatedEntities.filter( (sr) => {
          return sr.relationType == SzRelationshipType.POSSIBLERELATION;
        });
        if(this.entity && this.entity.relatedEntities.filter) this._disclosedRelationships = this.entity.relatedEntities.filter( (sr) => {
          return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
        });

      });
    }
  }

}
