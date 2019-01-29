import { Injectable } from '@angular/core';
import { Observable, fromEventPattern, Subject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';

import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};

  constructor(
    private entityDataService: EntityDataService,
    private configService: ConfigService) {}

  /**
   * perform a search request againt the data source.
   * @link http://editor.swagger.io/?url=https://raw.githubusercontent.com/Senzing/rest-api-proposal/master/senzing-api.yaml | GET /entities
   *
   * @memberof SzSearchService
   */
  public searchByAttributes(searchParms: SzEntitySearchParams): Observable<SzAttributeSearchResult[]> {
    this.currentSearchParams = searchParms;

    return this.entityDataService.searchByAttributes(JSON.stringify(searchParms))
    .pipe(
      tap((searchRes: SzAttributeSearchResponse) => console.log('SzSearchService.searchByAttributes: ',searchParms, searchRes)),
      map((searchRes: SzAttributeSearchResponse) => searchRes.data.searchResults as SzAttributeSearchResult[])
    );
  }
  /**
   * get the current search params.
   *
   * @memberof SzSearchService
   */
  public getSearchParams(): SzEntitySearchParams {
    return this.currentSearchParams;
  }

  /**
   * set the an individual search parameter.
   * @memberof SzSearchService
   */
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

  /**
   * @alias getAttributeTypes
  */
  public getMappingAttributes(): Observable<SzAttributeType[]> {
    return this.getAttributeTypes();
  }
  /**
   * get list of characteristics as attribute types
   *
   * @memberof SzSearchService
   */
  public getAttributeTypes(): Observable<SzAttributeType[]> {
    // get attributes
    return this.configService.getAttributeTypes()
    .pipe(
      tap( (resp: SzAttributeTypesResponse)=> console.log('SzSearchService.getMappingAttributes: ',resp.data.attributeTypes) ),
      map( (resp: SzAttributeTypesResponse) => resp.data.attributeTypes )
    );
  }

  /**
   * get an SzEntityData model by providing an entityId.
   *
   * @memberof SzSearchService
   */
  public getEntityById(entityId: number): Observable<SzEntityData> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ entityId +')] ');

    return this.entityDataService.getEntityByEntityId(entityId)
    .pipe(
      tap(res => console.log('SzSearchService.getEntityById: ' + entityId, res.data)),
      map(res => (res.data as SzEntityData))
    );
  }

}
