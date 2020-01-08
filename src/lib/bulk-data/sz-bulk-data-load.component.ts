import { Component, OnInit, Inject } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';

/**
 * Provides an interface for loading files in to a datasource.
 * allowed file types are:
 *
 *
 * @example
 * <sz-bulk-data-load></sz-bulk-data-load>
 *
 * @export
 */
@Component({
  selector: 'sz-bulk-data-load',
  templateUrl: './sz-bulk-data-load.component.html',
  styleUrls: ['./sz-bulk-data-load.component.scss']
})
export class SzBulkDataLoadComponent implements OnInit {
  constructor() {}

  ngOnInit() {
  }

}
