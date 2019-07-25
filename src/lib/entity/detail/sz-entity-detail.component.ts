import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { SzSearchService } from '../../services/sz-search.service';
import { tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';
import { SzEntityDetailGraphComponent } from './sz-entity-detail-graph/sz-entity-detail-graph.component';

@Component({
  selector: 'sz-entity-detail',
  templateUrl: './sz-entity-detail.component.html',
  styleUrls: ['./sz-entity-detail.component.scss']
})
export class SzEntityDetailComponent implements AfterViewInit {
  private _entityId: number;
  private entityDetailJSON: string = "";
  private _requestDataOnIdChange = true;

  public entity: SzEntityData;
  // data views
  _discoveredRelationships: SzRelatedEntity[];
  _disclosedRelationships: SzRelatedEntity[];
  _possibleMatches: SzRelatedEntity[];
  _matches: SzEntityRecord[];

  /** used for print and pdf support, allows fetching DOM HTMLElement */
  @ViewChild('nativeElementRef') nativeElementRef: ElementRef;
  public get nativeElement(): HTMLElement {
    return this.nativeElementRef.nativeElement;
  }
  @ViewChild(SzEntityDetailGraphComponent)
  public graphComponent: SzEntityDetailGraphComponent;

  ngAfterViewInit() {
    // console.log("graphComponentEle:", this);
  }

  /**
   * emitted when the component begins a request for an entities data.
   * @returns entityId of the request being made.
   */
  @Output() requestStart: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when a search is done being performed.
   * @returns the result of the entity request OR an Error object if something went wrong.
   */
  @Output() requestEnd: EventEmitter<SzEntityData|Error> = new EventEmitter<SzEntityData|Error>();
  /**
   * emitted when a search encounters an exception
   * @returns error object.
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();
  /**
   * emmitted when the entity data to display has been changed.
   */
  @Output('dataChanged')
  dataChanged: Subject<SzEntityData> = new Subject<SzEntityData>();
  /**
   * emmitted when the entity id has been changed.
   */
  @Output('entityIdChanged')
  entityIdChanged: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when the user right clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphContextMenuClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user double clicks a graph entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() graphEntityDblClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * set the entity data directly, instead of via entityId lookup.
   */
  @Input('data')
  public set entityData(value: SzEntityData) {
    this.entity = value;
    this.onEntityDataChanged();
  }
  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set entityId(value: number) {
    const _hasChanged = (value !== this._entityId) ? true : false;
    this._entityId = value;
    // safety check
    if(_hasChanged && this._requestDataOnIdChange) { this.onEntityIdChange(); }
  }

  public _showGraphSection = true;
  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphSection(value: boolean) {
    this._showGraphSection = value;
  }

  public _graphTitle: string = "Relationships at a Glance";
  /**
   * graph section title
   */
  @Input()
  public set graphTitle(value: string) {
    this._graphTitle = value;
  }
  /**
   * graph section title
   */
  public get graphTitle() {
    return this._graphTitle;
  }

  public _showGraphMatchKeys: boolean = true;
  /**
   * show or hide the "At a Glance" section.
   */
  @Input()
  public set showGraphMatchKeys(value: boolean) {
    this._showGraphMatchKeys = value;
  }
  /**
   * whether or not the graph component is displaying match keys
   */
  public get showGraphMatchKeys() {
    if(this.graphComponent && this.graphComponent.graphComponent && this.graphComponent.graphComponent.showLinkLabels) {
      return this.graphComponent.graphComponent.showLinkLabels;
    } else {
      return this._showGraphMatchKeys;
    }
  }


  /**
   * set the entity data by passing in an entity id number.
   */
  @Input()
  public set requestDataOnIdChange(value: boolean) {
    this._requestDataOnIdChange = value;
  }

  /**
   * Gets the data in the model shape used by the relationship network graph.
   */
  public get graphData() {
    if(!this.entity || this.entity == null) {
      return;
    }
    return {
      resolvedEntity: this.entity.resolvedEntity,
      relatedEntities: this.entity.relatedEntities
    };
  }

  /**
   * Get the entity Id of the current entity being displayed.
   */
  public get entityId(): number {
    return this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.entityId ? this.entity.resolvedEntity.entityId : this._entityId;
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

  constructor(
    private searchService: SzSearchService,
  ) {}


  /**
   * after entity data has been changed, regenerate the filtered lists.
   *  matches, possible matches, possible relationships, and disclosed relationships.
   */
  private onEntityDataChanged() {
    // doing the set on these manually because pulling directly from setter(s)
    // causes render change cycle to break mem and hammer redraw
    if(this.entity && this.entity.resolvedEntity.records) this._matches = this.entity.resolvedEntity.records;
    if(this.entity && this.entity.relatedEntities.filter) this._possibleMatches = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    });
    if(this.entity && this.entity.relatedEntities.filter) this._discoveredRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    });
    if(this.entity && this.entity.relatedEntities.filter) this._disclosedRelationships = this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    });

    this.dataChanged.next(this.entity);
  }

  /**
   * internal handler for when a entity record displayed inside of widget is
   * clicked on.
   */
  public onEntityRecordClick(entityId: number): void {
    this.entityId = entityId;
  }
  /**
   * proxies internal graph component entity click to "graphEntityClick" event.
   */
  public onGraphEntityClick(event: any) {
    this.graphEntityClick.emit(event);
  }
  /**
   * proxies internal graph component entity double click to "graphEntityDblClick" event.
   */
  public onGraphEntityDblClick(event: any) {
    this.graphEntityDblClick.emit(event);
  }
  /**
   * proxies internal graph component entity right-click to "graphContextMenuClick" event.
   */
  public onGraphRightClick(event: any) {
    this.graphContextMenuClick.emit(event);
  }

  /**
   * when entityId property is changed, request the data from the api
   * and display the result.
   *
   * @memberof SzEntityDetailComponent
   */
  public onEntityIdChange() {
    this.entityIdChanged.emit(this._entityId);

    if (this._entityId) {
      this.requestStart.emit(this._entityId);

      this.searchService.getEntityById(this._entityId, true).
      pipe(
        tap(res => console.log('SzSearchService.getEntityById: ' + this._entityId, res))
      ).
      subscribe((entityData: SzEntityData) => {
        console.log('sz-entity-detail.onEntityIdChange: ', entityData);
        this.entityDetailJSON = JSON.stringify(entityData, null, 4);
        this.entity = entityData;
        this.onEntityDataChanged();
        this.requestEnd.emit( entityData );
        this.dataChanged.next( entityData );
      }, (err)=> {
        this.requestEnd.emit( err );
        this.exception.next( err );
      });
    }
  }

}
