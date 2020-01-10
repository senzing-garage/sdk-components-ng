import { Component, OnInit } from '@angular/core';
import { SzBulkDataService } from '../services/sz-bulk-data.service';
import { SzBulkLoadResult } from '@senzing/rest-api-client-ng';

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
  /** result of the last load operation */
  public loadResult: SzBulkLoadResult;

  constructor(private bulkDataService: SzBulkDataService) {}

  ngOnInit() {
    this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
      this.loadResult = res;
    });
  }
}
