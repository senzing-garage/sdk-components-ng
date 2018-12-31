import { Component, OnInit,  Input, Output, EventEmitter } from '@angular/core';
import { SzEntityTypeService } from '../../services/sz-entity-type.service';
import { SzSearchHttpService } from '../../services/sz-search-http.service';
import { SzSearchService } from '../../services/sz-search.service';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { SzSearchResultEntityData } from '../../models/responces/search-results/sz-search-result-entity-data';

@Component({
  selector: 'sz-entity-detail',
  templateUrl: './sz-entity-detail.component.html',
  styleUrls: ['./sz-entity-detail.component.scss']
})
export class SzEntityDetailComponent {
  private _entityId: number;
  public projectId = 1;
  public entityDetailJSON: string = "";
  public entity: SzSearchResultEntityData;

  @Input()
  public set entityId(value: number) {
    this._entityId = value;
    this.onEntityIdChange();
  }
  public get entityId(): number {
    return this._entityId;
  }

  public onEntityRecordClick(entityId: number): void {
    this.entityId = entityId;
  }

  constructor(
    private searchService: SzSearchService,
    private searchHttpService: SzSearchHttpService
  ) {}

  onEntityIdChange() {
    if (this.projectId > 0 && this._entityId) {
      this.searchHttpService.getEntityByEntityId(this.projectId, this._entityId).
      pipe(
        tap(res => console.log('SzSearchService.getEntityById: ' + this._entityId, res))
      ).
      subscribe((entityData: SzSearchResultEntityData) => {
        console.log('sz-entity-detail.onEntityIdChange: ', entityData);
        this.entityDetailJSON = JSON.stringify(entityData, null, 4);
        this.entity = entityData;
      });
    }
  }

}
