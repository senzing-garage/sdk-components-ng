import { Injectable } from '@angular/core';
import { Observable, fromEventPattern, Subject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';

import {
  EntityDataService,
  SzAttributeSearchResponse,
  SzEntityResponse,
  SzAttributeSearchResponseData,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzMappingAttrService } from './sz-mapping-attr.service';
import { SzEntitySearchParams } from './sz-search-params.model';

import { SzSearchResultEntityData } from '../models/responces/search-results/sz-search-result-entity-data';
import { SzSearchResults } from '../models/responces/search-results/search-results';
import { SzMappingAttr } from '../models/mapping-attr';

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};

  constructor(
    private entityDataService: EntityDataService,
    private mappingAttrService: SzMappingAttrService) {}

  public searchByAttributes(searchParms: SzEntitySearchParams): Observable<SzAttributeSearchResult[]> {
    this.currentSearchParams = searchParms;

    return this.entityDataService.searchByAttributes(JSON.stringify(searchParms))
    .pipe(
      map((searchRes: SzAttributeSearchResponse) => searchRes.data.searchResults as SzAttributeSearchResult[])
    );
  }

  public getSearchParams(): SzEntitySearchParams {
    return this.currentSearchParams;
  }

  public setSearchParam(paramName: any, value: any): void {
    try{
      this.currentSearchParams[paramName] = value;
    } catch(err){}
  }

  /*
  loadSearchResults(queryParams: SzEntitySearchParams, projectId: number): void {
    //this.store.dispatch(new Search.LoadSearchResultsAction({queryParams, projectId}));
  }

  loadSearchResultsByAttributes(queryParams: SzEntitySearchParams, projectId: number): void {
    //this.store.dispatch(new Search.LoadSearchResultsByAttributesAction({queryParams, projectId}));
  }
  */

  public getMappingAttributes(): Observable<SzMappingAttr[]> {
    return this.mappingAttrService.getAttributes();
  }

  public getEntityById(entityId: number): Observable<SzEntityResponse> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ entityId +')] ');

    return this.entityDataService.getEntityByEntityId(entityId)
    .pipe(
      tap(res => console.log('SzSearchService.getEntityById: ' + entityId, res)),
      map(res => (res as SzEntityResponse))
    );
  }

}
