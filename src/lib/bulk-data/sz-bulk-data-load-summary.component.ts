import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzBulkDataService } from '../services/sz-bulk-data.service';
import { SzBulkLoadResult } from '@senzing/rest-api-client-ng';

/**
 * show textual summary of data load operation.
 *
 * @example
 * <sz-bulk-data-load-summary></sz-bulk-data-load-summary>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-load-summary',
  templateUrl: './sz-bulk-data-load-summary.component.html',
  styleUrls: ['./sz-bulk-data-load-summary.component.scss']
})
export class SzBulkDataLoadSummaryComponent implements OnInit {
  /** result of the last load operation */
  public loadResult: SzBulkLoadResult;

  constructor( public prefs: SzPrefsService,
    private bulkDataService: SzBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

    ngOnInit() {
      /** get the result of the last load operation */
      this.bulkDataService.onLoadResult.subscribe( (res: SzBulkLoadResult) => {
        this.loadResult = res;
      });
    }
}
