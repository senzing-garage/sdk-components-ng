import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  BulkDataService,
  SzBulkDataAnalysisResponse,
  SzBulkLoadError,
  SzBulkLoadResponse,
  SzError
} from '@senzing/rest-api-client-ng';

import { SzDataSourcesService } from './sz-datasources.service';
import { SzAdminService } from './sz-admin.service';
/**
 * methods used to manipulate datasources, entity types, entity classes,
 * and analyze and load data.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzBulkDataService {
  constructor(
    private adminService: SzAdminService,
    private datasourcesService: SzDataSourcesService,
    private bulkDataService: BulkDataService,
  ) { }

  public getDataSources(): Observable<string[]> {
    //console.log('SzBulkDataService.getDataSources');
    return this.datasourcesService.listDataSources();
  }

  public createDataSources(dataSources: string[]): Observable<string[]> {
    console.log('SzBulkDataService.createDataSources: ', dataSources);
    return this.datasourcesService.addDataSources(dataSources);
  }

  public createEntityTypes(entityTypes: string[]): Observable<string[]> {
    console.log('SzBulkDataService.createEntityTypes: ', entityTypes, "ACTOR");
    return this.adminService.addEntityTypes(entityTypes, "ACTOR");
  }

  public analyze(file: File): Observable<SzBulkDataAnalysisResponse> {
    console.log('SzBulkDataService.analyze: ', file);
    return this.bulkDataService.analyzeBulkRecords(file);
  }

  public load(file: File, dataSourceMap: { [key: string]: string } ): Observable<SzBulkLoadResponse> {
    console.log('SzBulkDataService.load: ', dataSourceMap, file);
    return this.bulkDataService.loadBulkRecords(file, dataSourceMap );
  }
}
