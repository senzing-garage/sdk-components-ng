import { Injectable, Output, EventEmitter } from '@angular/core';

import {
  EntityDataService,
  SzEntityType,
  SzEntityTypesResponse,
  SzEntityTypesResponseData,
  ConfigService,
  SzResolvedEntity,
  SzRelatedEntity,
  SzDataSourcesResponse,
  SzDataSourcesResponseData
} from '@senzing/rest-api-client-ng';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

/**
 * Provides access to the /entitytypes api path.
 * See {@link https://github.com/Senzing/senzing-rest-api/blob/master/senzing-rest-api.yaml#L172}
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzEntityTypesService {

  constructor(
    private configService: ConfigService) {}

  /**
   * get an array of entity types.
   *
   * @memberof SzEntityTypesService
   */
  public listEntityTypes(): Observable<string[]> {
    // get attributes
    return this.configService.getEntityTypes()
    .pipe(
      map( (resp: SzEntityTypesResponse) => resp.data.entityTypes )
    );
  }
  /**
   * get an array of entity types.
   *
   * @memberof SzEntityTypesService
   */
  public listEntityTypesDetails(): Observable<{[key: string]: SzEntityType}> {
    // get attributes
    return this.configService.getEntityTypes()
    .pipe(
      map( (resp: SzEntityTypesResponse) => resp.data.entityTypeDetails )
    );
  }
  /**
   * add entity type and return a array of entity types after the operation.
   */
  public addEntityTypes(entityTypes: string[], entityClass?: string): Observable<string[]> {
    return this.configService.addEntityTypes(null, entityTypes, entityClass)
    .pipe(
      map( (resp: SzEntityTypesResponse) => resp.data.entityTypes )
    )
  }
}
