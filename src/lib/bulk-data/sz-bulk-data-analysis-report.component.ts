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
 * Provides a visual report for a file analysis request.
 *
 * @example
 * <sz-bulk-data-analysis-report></sz-bulk-data-analysis-report>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-analysis-report',
  templateUrl: './sz-bulk-data-analysis-report.component.html',
  styleUrls: ['./sz-bulk-data-analysis-report.component.scss']
})
export class SzBulkDataAnalysisReportComponent implements OnInit {
  /** result of last analysis operation */
  public analysis: SzBulkDataAnalysis;
  /** result of the last load operation */
  public loadResult: SzBulkLoadResult;
  /**
   * when the user changes the file dest for a datasource
   * this is updated to reflect src to target
  */
  public _dataSourceMap: { [key: string]: string };
  /** collection of datasources */
  _dataSources: string[];
  /** whether or not a file is being analyzed */
  public get analyzingFile() {
    return this.bulkDataService.isAnalyzingFile;
  }
  /** whether or not a file is being loaded */
  public get loadingFile() {
    return this.bulkDataService.isLoadingFile;
  }
  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    private dataSourcesService: SzDataSourcesService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {
      this.adminService.onServerInfo.subscribe((info) => {
        //console.log('SzBulkDataAnalysisReportComponent.ServerInfo obtained: ', info);
      });
      this.updateDataSources();
      this.bulkDataService.onAnalysisChange.subscribe( (res: SzBulkDataAnalysis) => {
        //console.log('SzBulkDataAnalysisReportComponent.onAnalysisChange: ', res);
        this.analysis = res;
      });
      this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
        //console.log('SzBulkDataAnalysisReportComponent.onLoadResult: ', res);
        this.loadResult = res;
      });
    }

    ngAfterViewInit() {}
    /** get the current datasources from the service */
    public get dataSources(): string[] {
      if(this.bulkDataService && this.bulkDataService._dataSources) {
        return this.bulkDataService._dataSources;
      }
      return undefined;
    }
    /** get the current datasources from the api server and cache list */
    public updateDataSources() {
      this.dataSourcesService.listDataSources().subscribe((datasources: string[]) => {
        //console.log('datasources obtained: ', datasources);
        this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
      });
    }
    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
      this.bulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }
}
