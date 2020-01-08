import { Component, AfterViewInit, ViewContainerRef, OnInit, ElementRef, ViewChild } from '@angular/core';
import {
  SzPrefsService,
  SzAdminService,
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
  @ViewChild('filePicker')
  private filePicker: ElementRef;

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
    this.updateDataSources();
  }

  ngAfterViewInit() {
  }

  public get dataSources(): string[] {
    return this._dataSources;
  }

  public updateDataSources() {
    this.dataSourcesService.listDataSources().subscribe((datasources: string[]) => {
      console.log('datasources obtained: ', datasources);
      this._dataSources = datasources.filter(s => s !== 'TEST' && s !== 'SEARCH');
    });
  }

  protected handleDataSourceChange(fromDataSource: string, toDataSource: string) {
    console.log('MAP ' + fromDataSource + ' TO ' + toDataSource);
    this.dataSourceMap[fromDataSource] = toDataSource;
  }

  protected handleFileChange(event: Event) {
    this.analysis = null;
    const target: HTMLInputElement = <HTMLInputElement> event.target;
    const fileList = target.files;
    this.currentFile = fileList.item(0);
    console.log('handleFileChange: ', this.currentFile.name);
    this.loadResult = null;
    const promise = this.bulkDataService.analyze(this.currentFile).toPromise();
    promise.then(response => {
      console.log('RESPONSE', response);
      this.analysis = response.data;
      this.dataSourceMap = {};
      this.analysis.analysisByDataSource.forEach(a => {
        if (this._dataSources.indexOf(a.dataSource) >= 0) {
          this.dataSourceMap[a.dataSource] = a.dataSource;
        }
      });
    });
  }

  public handleFileClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.updateDataSources();
    this.filePicker.nativeElement.click();
  }

  public handleFileLoad(event: Event) {
    const newDataSources = [];
    this.analysis.analysisByDataSource.forEach(a => {
      const targetDS = this.dataSourceMap[a.dataSource];
      if (targetDS && this._dataSources.indexOf(targetDS) < 0) {
        newDataSources.push(targetDS);
      }
    });
    let promise = Promise.resolve([]);
    if (newDataSources.length > 0) {
      const p1 = this.bulkDataService.createDataSources(newDataSources).toPromise();
      const p2 = this.bulkDataService.createEntityTypes(newDataSources).toPromise();
      promise = Promise.all([p1, p2]);
    }
    promise.then(() => {
      this.bulkDataService.load(
        this.currentFile, this.dataSourceMap).toPromise().then(response => {
        console.log('RESPONSE', response);
        this.loadResult = response.data;
      });

    });
  }
}
