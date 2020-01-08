import { Component, OnInit, Inject } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';

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
  constructor() {}

  ngOnInit() {}

}
