import { Component, OnInit } from '@angular/core';
import { SzAdminService } from '../services/sz-admin.service';
import { SzBulkDataService } from '../services/sz-bulk-data.service';
import {SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Provides a textual summary of a analyze file operation.
 *
 * @example
 * <sz-bulk-data-analysis-summary></sz-bulk-data-analysis-summary>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-analysis-summary',
  templateUrl: './sz-bulk-data-analysis-summary.component.html',
  styleUrls: ['./sz-bulk-data-analysis-summary.component.scss']
})
export class SzBulkDataAnalysisSummaryComponent implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** get the file reference currently loaded in the the bulk data service */
  public get file(): File {
    if(this.bulkDataService) {
      return this.bulkDataService.currentFile;
    }
    return undefined;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }

  constructor(
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService) {}

  ngOnInit() {
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      //console.log('SzBulkDataAnalysisSummaryComponent.ServerInfo obtained: ', info);
    });
  }
  ngAfterViewInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
