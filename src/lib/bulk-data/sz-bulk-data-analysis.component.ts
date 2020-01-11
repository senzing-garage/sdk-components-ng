import { Component, OnInit, Inject, ViewContainerRef, Input } from '@angular/core';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzAdminService } from '../services/sz-admin.service';
import { SzBulkDataService } from '../services/sz-bulk-data.service';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult
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
  /** show the textual summaries for analyze and  */
  private _showSummary = true;
  /** get the current analysis from service */
  get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  };
  /** does user have admin rights */
  public get adminEnabled() {
    return this.adminService.adminEnabled;
  }
  /** is the current server instance read only */
  public get readOnly() {
    return this.adminService.readOnly;
  }
  /** whether or not a file is being analysed */
  public get analyzingFile(): boolean {
    return this.bulkDataService.isAnalyzingFile;
  }
  /** whenther or not a file is being loaded */
  public get loadingFile(): boolean {
    return this.bulkDataService.isLoadingFile;
  }
  /** set result of load operation from service */
  @Input() public set result(value: SzBulkLoadResult) {
    if(value){ this.bulkDataService.currentLoadResult = value; }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }
  /** @alias showSummary */
  @Input() public set showSummaries(value: boolean) {
    this.showSummary = value;
  }
  /** whether or not to show the analysis and load summaries embedded in component */
  @Input() public set showSummary(value: boolean) {
    this._showSummary = value;
  }
  /** whether or not the analysis and load summaries are shown in component */
  public get showSummary(): boolean {
    return this._showSummary;
  }
  /** set the file to be analyzed */
  @Input() public set file(value: File) {
    if(value){ this.analyzeFile(value); }
  }

  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {
      this.adminService.onServerInfo.subscribe((info) => {
        console.log('ServerInfo obtained: ', info);
      });
      /*
      this.bulkDataService.onAnalysisChange.subscribe( (res: SzBulkDataAnalysis) => {
        this.analysis = res;
      });
      this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
        this.result = res;
      });*/

    }

    /** convenience method to analyze a file. used by file setter. */
    public analyzeFile(file: File) {
      return this.bulkDataService.analyze(file);
    }
}
