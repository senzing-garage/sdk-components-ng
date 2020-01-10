import { Component, AfterViewInit, ViewContainerRef, OnInit, ElementRef, ViewChild } from '@angular/core';
import {
  SzPrefsService,
  SzAdminService,
  SzBulkDataAnalysisComponent,
  SzBulkDataLoadComponent,
  SzDataSourcesService,
  SzConfigurationService,
  SzBulkDataService
} from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzDataSourceRecordAnalysis,
  SzBulkLoadResult,
  SzBulkLoadError,
  SzBulkLoadStatus,
  SzError
} from '@senzing/rest-api-client-ng';

import { tap, filter, take } from 'rxjs/operators';
import {
  from as observableFrom,
  throwError as observableThrowError,
  of as observableOf,
  Observable ,
  Subject,
  Subscription,
  fromEvent
} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit {
  @ViewChild(SzBulkDataAnalysisComponent) public bulkDataAnalysisComponent: SzBulkDataAnalysisComponent;
  @ViewChild(SzBulkDataLoadComponent) public bulkDataLoadComponent: SzBulkDataLoadComponent;

  analysis: SzBulkDataAnalysis;
  loadResult: SzBulkLoadResult;

  currentFile: File;

  dataSourceMap: { [key: string]: string };

  _dataSources: string[];

  public get adminEnabled() {
    return this.adminService.adminEnabled;
  }
  public get readOnly() {
    return this.adminService.readOnly;
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
  }

  ngAfterViewInit() {
    // console.log('ViewChild analysis component: ', this.bulkDataAnalysisComponent);
  }

}
