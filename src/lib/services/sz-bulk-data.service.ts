import { Injectable } from '@angular/core';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';

import {

  BulkDataService,
  SzBulkDataAnalysis,
  SzBulkDataAnalysisResponse,
  SzDataSourceRecordAnalysis,
  SzBulkLoadResult,
  SzBulkLoadResponse,
} from '@senzing/rest-api-client-ng';

import { SzDataSourcesService } from './sz-datasources.service';
import { SzAdminService } from './sz-admin.service';
import { tap, map, catchError, takeUntil } from 'rxjs/operators';
/**
 * methods used to manipulate data is bulk, ie
 * import, analyze, map, and load data from a parseable format.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzBulkDataService {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** current file to analyze or load */
  public currentFile: File;
  /**  current result of last analysis operation */
  public currentAnalysis: SzBulkDataAnalysis;
  /** current result of last file load attempt */
  public currentLoadResult: SzBulkLoadResult;
  /** map of current datasource name to new datasource names */
  public dataSourceMap: { [key: string]: string };
  /** current datasources */
  _dataSources: string[];
  /** when the file input changes this subject is broadcast */
  public onCurrentFileChange = new Subject<File>();
  /** when the analysis result changes this behavior subject is broadcast */
  public onAnalysisChange = new BehaviorSubject<SzBulkDataAnalysis>(undefined);
  /** when a datasrc destination changes this subject is broadcast */
  public onDataSourceMapChange = new Subject<{ [key: string]: string }>();
  /** when the result of a load operation changes this behavior subject is broadcast */
  public onLoadResult = new BehaviorSubject<SzBulkLoadResult>(undefined);
  /** when the file input changes this subject is broadcast */
  public onError = new Subject<Error>();
  /** when a file is being analyzed */
  public analyzingFile = new Subject<boolean>();
  /** when a file is being analyzed */
  public isAnalyzingFile = false;
  /** when a file is being analyzed in the current thread */
  public loadingFile = new Subject<boolean>();
  /** when a file is being loaded in to the engine on thread*/
  public isLoadingFile = false;

  /** the file to analyze, map, or load */
  public set file(value: File) {
    this.currentFile = value;
    this.currentAnalysis = null;
    this.currentLoadResult = null;
    this.onCurrentFileChange.next( this.currentFile );
  }
  /** the file being analyzed, mapped, or loaded */
  public get file(): File {
    return this.currentFile;
  }
  /** the datasources currently present */
  private get dataSources(): string[] {
    return this._dataSources;
  }

  constructor(
    private adminService: SzAdminService,
    private datasourcesService: SzDataSourcesService,
    private bulkDataService: BulkDataService
  ) {
    this.onCurrentFileChange.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe( (file: File) => {
      if(!file){ return; }
      this.analyzingFile.next(true);

      this.analyze(file).toPromise().then( (analysisResp: SzBulkDataAnalysisResponse) => {
        //console.log('autowire analysis resp on file change: ', analysisResp, this.currentAnalysis);
        this.analyzingFile.next(false);
      });
    });
    this.analyzingFile.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe( (isAnalyzing: boolean) => {
      this.isAnalyzingFile = isAnalyzing;
    });
    this.loadingFile.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe( (isLoading: boolean) => {
      this.isLoadingFile = isLoading;
    });
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      //console.log('ServerInfo obtained: ', info);
    });
    this.updateDataSources();
  }
  /** update the internal list of datasources
   * @internal
   */
  private updateDataSources() {
    this.datasourcesService.listDataSources().pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((datasources: string[]) => {
      //console.log('datasources obtained: ', datasources);
      this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
    });
  }
  /** create a new datasource */
  public createDataSources(dataSources: string[]): Observable<string[]> {
    //console.log('SzBulkDataService.createDataSources: ', dataSources);
    return this.datasourcesService.addDataSources(dataSources);
  }
  /** create a new entity type */
  public createEntityTypes(entityTypes: string[]): Observable<string[]> {
    //console.log('SzBulkDataService.createEntityTypes: ', entityTypes, "ACTOR");
    return this.adminService.addEntityTypes(entityTypes, "ACTOR");
  }
  /** analze a file and prep for mapping */
  public analyze(file: File): Observable<SzBulkDataAnalysisResponse> {
    //console.log('SzBulkDataService.analyze: ', file);
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
  /**
   * load a files contents in to a datasource.
   * @TODO show usage example.
   */
  public load(file?: File, dataSourceMap?: { [key: string]: string }, analysis?: SzBulkDataAnalysis ): Observable<SzBulkLoadResult> | undefined {
    //console.log('SzBulkDataService.load: ', dataSourceMap, file);
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
            //console.log('RESPONSE', dataSourceMap, response.data);
            this.currentLoadResult = response.data;
            this.onLoadResult.next( this.currentLoadResult );
            this.loadingFile.next(false);
            retVal.next(response.data);
          }),
          map((response: SzBulkLoadResponse) => {
            return response.data;
          })
        ).pipe(
          takeUntil( this.unsubscribe$ )
        ).subscribe();
      });
      return retVal.asObservable();
    } else {
      console.warn('missing required parameter: ', file, dataSourceMap);
      throw new Error('missing required parameter: '+ file.name);
      return;
    }
  }
  /**
   * Used to keep a internal map of source to target datasource names.
   * @internal
   */
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
  /**
   * change the destination datasource of a file currently being mapped to datasource.
   */
  public changeDataSourceName(fromDataSource: string, toDataSource: string) {
    //console.log('MAP ' + fromDataSource + ' TO ' + toDataSource, this.dataSourceMap);
    this.dataSourceMap = this.dataSourceMap
    this.dataSourceMap[fromDataSource] = toDataSource;
  }
  /** clear any file and associated data. removes file focus context */
  public clear(): void {
    this.currentAnalysis = undefined;
    this.currentLoadResult = undefined;
    this.currentFile = undefined;
    this.onAnalysisChange.next( this.currentAnalysis );
    this.onLoadResult.next( this.currentLoadResult );
    this.onCurrentFileChange.next( this.currentFile );
  }
  /**
   * unsubscribe event streams
   */
  destroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
