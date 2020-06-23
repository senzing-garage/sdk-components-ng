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
  SzEntityRecord,
  SzEntityResponse,
  SzRecordResponse,
  SzRecordResponseData
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';

export interface SzSearchEvent {
  params: SzEntitySearchParams,
  results: SzAttributeSearchResult[]
}

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};
  private currentSearchResults: SzAttributeSearchResult[] | null = null;
  public parametersChanged = new Subject<SzEntitySearchParams>();
  public resultsChanged = new Subject<SzAttributeSearchResult[]>();
  public searchPerformed = new Subject<SzSearchEvent>();

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
    //return this.entityDataService.searchByAttributes(attrs?: string, attr?: Array<string>, withRelationships?: boolean, featureMode?: string, withFeatureStats?: boolean, withDerivedFeatures?: boolean, forceMinimal?: boolean, withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzAttributeSearchResponse>;
    return this.entityDataService.searchByAttributes(JSON.stringify(searchParms))
    .pipe(
      tap((searchRes: SzAttributeSearchResponse) => console.log('SzSearchService.searchByAttributes: ', searchParms, searchRes)),
      map((searchRes: SzAttributeSearchResponse) => searchRes.data.searchResults as SzAttributeSearchResult[]),
      tap((searchRes: SzAttributeSearchResult[]) => {
        //console.warn('SzSearchService.searchByAttributes 1: ', searchRes)
        this.searchPerformed.next({
          params: this.currentSearchParams,
          results: searchRes
        });
        //console.warn('SzSearchService.searchByAttributes 2: ', searchRes)
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
    const withRelatedStr = withRelated ? 'FULL' : 'NONE';
    //return this.entityDataService.getEntityByEntityId(entityId, featureMo, forceMini, withFeatu, withDeriv, withRelated?: 'NONE' | 'PARTIAL' | 'FULL', withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzEntityResponse>;
    return this.entityDataService.getEntityByEntityId(entityId, undefined, undefined, undefined, undefined, withRelatedStr)
    .pipe(
      tap((res: SzEntityResponse) => console.log('SzSearchService.getEntityById: ' + entityId, res.data)),
      map((res: SzEntityResponse) => (res.data as SzEntityData))
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
    //return this.entityDataService.getDataSourceRecord(dataSourceCode: string, recordId: string, withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzRecordResponse>;

    return this.entityDataService.getDataSourceRecord(dsName, _recordId)
    .pipe(
      tap((res: SzRecordResponse) => console.log('SzSearchService.getEntityByRecordId: ' + dsName, res)),
      map((res: SzRecordResponse) => (res.data as SzRecordResponseData).record )
    );
  }

}
