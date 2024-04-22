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
 * See {@link https://github.com/senzing-garage/senzing-rest-api-specification/blob/main/senzing-rest-api.yaml#L172}
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataSourcesService {
  private _dataSourceDetails: SzDataSourcesResponseData | undefined;

  constructor(
    private configService: ConfigService) {}

  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  public listDataSources(debugPath?: string): Observable<string[]> {
    // get attributes
    return this.configService.getDataSources()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data.dataSources ),
      tap( (data) => {
        console.log(`listDataSources(): ${debugPath ? debugPath : ''}`, data);
      })
    );
  }
  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  public listDataSourcesDetails(debugPath?: string): Observable<SzDataSourcesResponseData> {
    // get attributes
    return this.configService.getDataSources()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data ),
      tap( (data) => {
        this._dataSourceDetails = data;
        console.log(`listDataSourcesDetails: ${debugPath ? debugPath : ''}`, data);
      })
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
