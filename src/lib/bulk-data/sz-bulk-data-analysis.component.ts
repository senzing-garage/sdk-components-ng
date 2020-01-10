import { Component, OnInit, Inject, ViewContainerRef, Input } from '@angular/core';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzAdminService } from '../services/sz-admin.service';
import { SzDataSourcesService } from '../services/sz-datasources.service';
import { SzConfigurationService } from '../services/sz-configuration.service';
import { SzBulkDataService } from '../services/sz-bulk-data.service';

import {
  SzBulkDataAnalysis,
  Configuration as SzRestConfiguration,
  SzDataSourceRecordAnalysis,
  SzBulkLoadResult,
  SzBulkLoadError,
  SzBulkLoadStatus,
  SzError
} from '@senzing/rest-api-client-ng';
import { tap, map } from 'rxjs/operators';

/**
 * Provides a component that analyzes a datasource characteristics and mapping.
 *
 * @example
 * <sz-bulk-data-analysis></sz-bulk-data-analysis>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-analysis',
  templateUrl: './sz-bulk-data-analysis.component.html',
  styleUrls: ['./sz-bulk-data-analysis.component.scss']
})
export class SzBulkDataAnalysisComponent implements OnInit {
  analysis: SzBulkDataAnalysis;
  loadResult: SzBulkLoadResult;
  public _dataSourceMap: { [key: string]: string };
  _dataSources: string[];
  public get analyzingFile() {
    return this.bulkDataService.isAnalyzingFile;
  }
  public get loadingFile() {
    return this.bulkDataService.isLoadingFile;
  }

  public get dataSourceMap(): { [key: string]: string } {
    return this._dataSourceMap;
  }

  @Input() public set file(value: File) {
    if(value){ this.analyzeFile(value); }
  }

  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    private dataSourcesService: SzDataSourcesService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {
      this.adminService.onServerInfo.subscribe((info) => {
        console.log('ServerInfo obtained: ', info);
      });
      this.updateDataSources();
      this.bulkDataService.onAnalysisChange.subscribe( (res: SzBulkDataAnalysis) => {
        this.analysis = res;
      });
      this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
        this.loadResult = res;
      });

    }

    ngAfterViewInit() {
    }

    public get dataSources(): string[] {
      return this._dataSources;
    }

    public updateDataSources() {
      this.dataSourcesService.listDataSources().subscribe((datasources: string[]) => {
        console.log('datasources obtained: ', datasources);
        this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
      });
    }

    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
      this.bulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }

    public clear() {
      this.analysis = null;
    }

    public analyzeFile(file: File) {
      /*
      return this.bulkDataService.analyze(file).pipe(
        tap( function(result) {
          this.analysis = result.data;
          this._dataSourceMap = this.getDataSourceMapFromAnalysis( this.analysis.analysisByDataSource );
          console.log('analyzeFile: ', this._dataSourceMap, this.analysis);
        }.bind(this)),
        map( (result) => result.data )
      )*/
      return this.bulkDataService.analyze(file);
    }

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
}
