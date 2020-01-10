import { Component, OnInit, Inject, ViewContainerRef, Input, ViewChild, ElementRef } from '@angular/core';

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
  /** file picker element */
  @ViewChild('filePicker')
  private filePicker: ElementRef;
  /** */
  get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  };

  //loadResult: SzBulkLoadResult;
  //dataSourceMap: { [key: string]: string };
  //_dataSources: string[];

  public get adminEnabled() {
    return this.adminService.adminEnabled;
  }
  public get readOnly() {
    return this.adminService.readOnly;
  }

  /** set result of load operation from service */
  @Input() public set result(value: SzBulkLoadResult) {
    if(value){ this.bulkDataService.currentLoadResult = value; }
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }

  constructor(
    public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService,
    private dataSourcesService: SzDataSourcesService,
    public viewContainerRef: ViewContainerRef){}

    ngOnInit() {
      this.adminService.onServerInfo.subscribe((info) => {
        console.log('ServerInfo obtained: ', info);
      });
      this.bulkDataService.onAnalysisChange.subscribe( (analysis) => {
        console.log('SzBulkDataLoadComponent.onAnalysisChange: ', analysis);
      });
    }

    ngAfterViewInit() {}

    public onFileInputChange(event: Event) {
      const target: HTMLInputElement = <HTMLInputElement> event.target;
      const fileList = target.files;
      this.bulkDataService.file = fileList.item(0);
    }

    public chooseFileInput(event: Event) {
      event.preventDefault();
      event.stopPropagation();
      this.filePicker.nativeElement.click();
    }

    public loadFile(event: Event) {
      this.bulkDataService.load();
    }

}
