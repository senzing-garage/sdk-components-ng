import { Injectable, Output, EventEmitter } from '@angular/core';

import {
  EntityDataService,
  ConfigService,
  SzResolvedEntity,
  SzRelatedEntity,
  SzDataSourcesResponse
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
   * get list of characteristics as attribute types
   *
   * @memberof SzDataSourcesService
   */
  public listDataSources(): Observable<string[]> {
    // get attributes
    return this.configService.listDataSources()
    .pipe(
      tap( (resp: SzDataSourcesResponse)=> console.log('SzDataSourcesService.listDataSources: ', resp.data.dataSources) ),
      map( (resp: SzDataSourcesResponse) => resp.data.dataSources )
    );
  }
}
