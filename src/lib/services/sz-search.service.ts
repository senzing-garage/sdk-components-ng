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
  SzAttributeSearchResult,
  SzEntityRecord
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};
  private currentSearchResults: SzAttributeSearchResult[] | null = null;
  public parametersChanged = new Subject<SzEntitySearchParams>();
  public resultsChanged = new Subject<SzAttributeSearchResult[]>();
  public searchPerformed = new Subject<{params: SzEntitySearchParams, results: SzAttributeSearchResult[]}>();

  constructor(
    private entityDataService: EntityDataService,
    private configService: ConfigService) {}

  /**
   * perform a search request againt the data source.
   * @link http://editor.swagger.io/?url=https://raw.githubusercontent.com/Senzing/senzing-rest-api/master/senzing-rest-api.yaml | GET /entities
   *
   * @memberof SzSearchService
   */
  public searchByAttributes(searchParms: SzEntitySearchParams): Observable<SzAttributeSearchResult[]> {
    this.currentSearchParams = searchParms;

    return this.entityDataService.searchByAttributes(JSON.stringify(searchParms))
    .pipe(
      tap((searchRes: SzAttributeSearchResponse) => console.log('SzSearchService.searchByAttributes: ', searchParms, searchRes)),
      map((searchRes: SzAttributeSearchResponse) => searchRes.data.searchResults as SzAttributeSearchResult[]),
      tap((searchRes: SzAttributeSearchResult[]) => {
        this.searchPerformed.next({
          params: this.currentSearchParams,
          results: searchRes
        });
      })
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
   * set an individual search parameter.
   * @memberof SzSearchService
   */
  public setSearchParam(paramName: any, value: any): void {
    try {
      this.currentSearchParams[paramName] = value;
      this.parametersChanged.next(this.currentSearchParams);
    } catch(err) {}
  }

  /**
   * get the current search results from the last search.
   * @memberof SzSearchService
   */
  public getSearchResults() : SzAttributeSearchResult[] | null {
    return this.currentSearchResults;
  }

  /**
   * set the current search results from the last search.
   * @memberof SzSearchService
   */
  public setSearchResults(results: SzAttributeSearchResult[] | null) : void {
    this.currentSearchResults = results ? results : null;
    this.resultsChanged.next( this.currentSearchResults );
  }

  /**
   * clears out current search parameters and search results.
   * @memberof SzSearchService
   */
  public clearCurrentSearchState() : void {
    this.currentSearchParams  = {};
    this.currentSearchResults = null;
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
      tap( (resp: SzAttributeTypesResponse)=> console.log('SzSearchService.getMappingAttributes: ', resp.data.attributeTypes) ),
      map( (resp: SzAttributeTypesResponse) => resp.data.attributeTypes )
    );
  }

  /**
   * get an SzEntityData model by providing an entityId.
   *
   * @memberof SzSearchService
   */
  public getEntityById(entityId: number, withRelated = false): Observable<SzEntityData> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ entityId +', '+ withRelated +')] ');

    return this.entityDataService.getEntityByEntityId(entityId, withRelated)
    .pipe(
      tap(res => console.log('SzSearchService.getEntityById: ' + entityId, res.data)),
      map(res => (res.data as SzEntityData))
    );
  }

  /**
   * get an SzEntityData model by providing an datasource and record id.
   *
   * @memberof SzSearchService
   */
  public getEntityByRecordId(dsName: string, recordId: number, withRelated = false): Observable<SzEntityRecord> {
    console.log('@senzing/sdk/services/sz-search[getEntityByRecordId('+ dsName +', '+ recordId +')] ', dsName, recordId);
    const _recordId: string = recordId.toString();
    return this.entityDataService.getDataSourceRecord(dsName, _recordId)
    .pipe(
      tap(res => console.log('SzSearchService.getEntityByRecordId: ' + dsName, res)),
      map(res => (res.data as SzEntityRecord))
    );
  }

}
