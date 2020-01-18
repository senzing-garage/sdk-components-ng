import { Injectable, Output, EventEmitter } from '@angular/core';

import {
  EntityDataService,
  ConfigService,
  SzResolvedEntity,
  SzRelatedEntity,
  SzDataSourcesResponse,
  SzDataSourcesResponseData
} from '@senzing/rest-api-client-ng';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

/**
 * Provides access to the /datasources api path.
 * See {@link https://github.com/Senzing/senzing-rest-api/blob/master/senzing-rest-api.yaml#L172}
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataSourcesService {

  constructor(
    private configService: ConfigService) {}

  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  public listDataSources(): Observable<string[]> {
    // get attributes
    return this.configService.listDataSources()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data.dataSources )
    );
  }
  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  public listDataSourcesDetails(): Observable<SzDataSourcesResponseData> {
    // get attributes
    return this.configService.listDataSources()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data )
    );
  }
  /**
   * add datasources and return a array of datasources after the operation.
   */
  public addDataSources(dataSources: string[]): Observable<string[]> {
    return this.configService.addDataSources(dataSources)
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data.dataSources )
    )
  }
}
