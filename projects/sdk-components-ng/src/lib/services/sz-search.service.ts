import { Injectable } from '@angular/core';
import { Observable, fromEventPattern, Subject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';

import { SzSearchHttpService } from './sz-search-http.service';
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
    private searchHttpService: SzSearchHttpService,
    private mappingAttrService: SzMappingAttrService) {}

  public searchByAttributes(searchParms: SzEntitySearchParams, projectId: number): Observable<SzSearchResults> {
    this.currentSearchParams = searchParms;
    return this.searchHttpService.searchByAttributes(searchParms, projectId)
    .pipe(
      map((searchRes: any) => searchRes as SzSearchResults)
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

  public getEntityById(projectId: number, entityId: number): Observable<any> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ projectId +','+ entityId +')] ');

    return this.searchHttpService.getEntityByEntityId(projectId, entityId)
    .pipe(
      tap(res => console.log('SzSearchService.getEntityById: ' + entityId, res)),
      map(res => (res as SzSearchResultEntityData))
    );
  }

}
