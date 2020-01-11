import { Component, OnInit } from '@angular/core';
import { SzBulkDataService } from '../services/sz-bulk-data.service';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';

/**
 * show tabular results for an analytics operation.
 *
 * @example
 * <sz-bulk-data-load-report></sz-bulk-data-load-report>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-load-report',
  templateUrl: './sz-bulk-data-load-report.component.html',
  styleUrls: ['./sz-bulk-data-load-report.component.scss']
})
export class SzBulkDataLoadReportComponent implements OnInit {
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

  constructor(private bulkDataService: SzBulkDataService) {}

  ngOnInit() {
    /*
    this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
      this.loadResult = res;
    });*/
  }
}
