import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';

import {

  BulkDataService,
  SzBulkDataAnalysis,
  SzBulkDataAnalysisResponse,
  SzDataSourceRecordAnalysis,
  SzBulkLoadResult,
  SzBulkLoadError,
  SzBulkLoadResponse,
  SzError
} from '@senzing/rest-api-client-ng';

import { SzDataSourcesService } from './sz-datasources.service';
import { SzAdminService } from './sz-admin.service';
import { tap, map, catchError } from 'rxjs/operators';
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
  public currentFile: File;
  public currentAnalysis: SzBulkDataAnalysis;
  public currentLoadResult: SzBulkLoadResult;
  /** map of current datasource name to new datasource names */
  public dataSourceMap: { [key: string]: string };
  /** current datasources */
  _dataSources: string[];

  public onCurrentFileChange = new Subject<File>();
  public onAnalysisChange = new Subject<SzBulkDataAnalysis>();
  public onDataSourceMapChange = new Subject<{ [key: string]: string }>();
  public onLoadResult = new Subject<SzBulkLoadResult>();
  public onError = new Subject<Error>();
  public analyzingFile = new Subject<boolean>();
  public isAnalyzingFile = false;
  public loadingFile = new Subject<boolean>();
  public isLoadingFile = false;


  public set file(value: File) {
    this.currentFile = value;
    this.currentAnalysis = null;
    this.currentLoadResult = null;
    this.onCurrentFileChange.next( this.currentFile );
  }
  public get file(): File {
    return this.currentFile;
  }

  constructor(
    private adminService: SzAdminService,
    private datasourcesService: SzDataSourcesService,
    private bulkDataService: BulkDataService
  ) {
    this.onCurrentFileChange.subscribe( (file: File) => {
      this.analyze(file).toPromise().then( (analysisResp: SzBulkDataAnalysisResponse) => {
        console.log('autowire analysis resp on file change: ', analysisResp, this.currentAnalysis);
      });
    });
    this.analyzingFile.subscribe( (isAnalyzing: boolean) => {
      this.isAnalyzingFile = isAnalyzing;
    });
    this.loadingFile.subscribe( (isLoading: boolean) => {
      this.isLoadingFile = isLoading;
    });
    this.adminService.onServerInfo.subscribe((info) => {
      console.log('ServerInfo obtained: ', info);
    });
    this.updateDataSources();
  }

  private get dataSources(): string[] {
    return this._dataSources;
  }
  private updateDataSources() {
    this.datasourcesService.listDataSources().subscribe((datasources: string[]) => {
      console.log('datasources obtained: ', datasources);
      this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
    });
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
    this.analyzingFile.next(true);
    return this.bulkDataService.analyzeBulkRecords(file).pipe(
      catchError(err => {
        console.warn('Handling error locally and rethrowing it...', err);
        this.analyzingFile.next(false);
        this.onError.next();
        return of(undefined);
      }),
      tap( (result: SzBulkDataAnalysisResponse) => {
        this.analyzingFile.next(false);
        this.currentAnalysis = result.data;
        this.dataSourceMap = this.getDataSourceMapFromAnalysis( this.currentAnalysis.analysisByDataSource );
        this.onDataSourceMapChange.next( this.dataSourceMap );
        this.onAnalysisChange.next( this.currentAnalysis );
        console.log('analyze set analysis respose: ', this.dataSourceMap, this.currentAnalysis);
      })
    )
  }

  public load(file?: File, dataSourceMap?: { [key: string]: string }, analysis?: SzBulkDataAnalysis ): Observable<SzBulkLoadResult> | undefined {
    console.log('SzBulkDataService.load: ', dataSourceMap, file);
    file = file ? file : this.currentFile;
    dataSourceMap = dataSourceMap ? dataSourceMap : this.dataSourceMap;
    analysis = analysis ? analysis : this.currentAnalysis;

    if(file && dataSourceMap && analysis) {
      const newDataSources = this.currentAnalysis.analysisByDataSource.filter(a => {
        const targetDS = this.dataSourceMap[a.dataSource];
        return (targetDS && this._dataSources.indexOf(targetDS) < 0);
      }).map( (b) => {
        return this.dataSourceMap[b.dataSource];
      });
      /*
      this.currentAnalysis.analysisByDataSource.forEach(a => {
        const targetDS = this.dataSourceMap[a.dataSource];
        if (targetDS && this._dataSources.indexOf(targetDS) < 0) {
          newDataSources.push(targetDS);
        }
      });
      */
      console.log('handleFileLoad: new datasources', newDataSources);

      let promise = Promise.resolve([]);
      let retVal: Subject<SzBulkLoadResult> =  new Subject<SzBulkLoadResult>();
      // create new datasources if needed
      if (newDataSources.length > 0) {
        const p1 = this.createDataSources(newDataSources).toPromise();
        const p2 = this.createEntityTypes(newDataSources).toPromise();
        promise = Promise.all([p1, p2]);
      }
      // no new datasources or already avail
      this.loadingFile.next(true);
      promise.then(() => {
        this.bulkDataService.loadBulkRecords(file, dataSourceMap ).pipe(
          catchError((err: Error) => {
            console.warn('Handling error locally and rethrowing it...', err);
            this.loadingFile.next(false);
            this.onError.next( err );
            return of(undefined);
          }),
          tap((response: SzBulkLoadResponse) => {
            console.log('RESPONSE', dataSourceMap, response.data);
            this.currentLoadResult = response.data;
            this.onLoadResult.next( this.currentLoadResult );
            this.loadingFile.next(false);
            retVal.next(response.data);
          }),
          map((response: SzBulkLoadResponse) => {
            return response.data;
          })
        ).subscribe();
      });
      return retVal.asObservable();
    } else {
      console.warn('missing required parameter: ', file, dataSourceMap);
      throw new Error('missing required parameter: '+ file.name);
      return;
    }
  }
  /*
  public loaderrr(event: Event) {
    const newDataSources = [];
    if (this.currentAnalysis) {

      this.currentAnalysis.analysisByDataSource.forEach(a => {
        const targetDS = this.dataSourceMap[a.dataSource];
        if (targetDS && this._dataSources.indexOf(targetDS) < 0) {
          newDataSources.push(targetDS);
        }
      });

      console.log('handleFileLoad: new datasources', newDataSources);

      let promise = Promise.resolve([]);
      if (newDataSources.length > 0) {
        const p1 = this.createDataSources(newDataSources).toPromise();
        const p2 = this.createEntityTypes(newDataSources).toPromise();
        promise = Promise.all([p1, p2]);
      }
      promise.then(() => {
        this.bulkDataService.load(
          this.currentFile,
          this.bulkDataAnalysisComponent.dataSourceMap).toPromise().then(response => {
          console.log('RESPONSE', this.bulkDataAnalysisComponent.dataSourceMap, response);
          this.loadResult = response.data;
        });

      });
    }
  }*/

  public getDataSourceMapFromAnalysis(analysisArray: SzDataSourceRecordAnalysis[]): { [key: string]: string } {
    let _dsMap: { [key: string]: string } = {};
    analysisArray.forEach(a => {
      if (this._dataSources.indexOf(a.dataSource) >= 0) {
        _dsMap[a.dataSource] = a.dataSource;
      } else {
        //_dsMap[a.dataSource] = a.dataSource;
      }
    });
    return _dsMap;
  }

  public changeDataSourceName(fromDataSource: string, toDataSource: string) {
    console.log('MAP ' + fromDataSource + ' TO ' + toDataSource, this.dataSourceMap);
    this.dataSourceMap = this.dataSourceMap
    this.dataSourceMap[fromDataSource] = toDataSource;
  }

}
