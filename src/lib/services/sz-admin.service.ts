import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  AdminService, ConfigService,
  DatasourcesBody,
  SzAttributeClass, SzAttributeTypesResponse, SzAttributeTypesResponseData,
  SzDataSourcesResponse,
  SzBaseResponse, SzMeta,
  SzBulkLoadResponse,
  SzLicenseResponse, SzLicenseInfo,
  SzVersionResponse, SzVersionInfo, SzAttributeTypeResponse, SzAttributeTypeResponseData,
  SzAttributeType, SzConfigResponse, SzDataSourceResponse,
  BulkDataService, SzBulkDataAnalysisResponse,
  SzServerInfo, SzServerInfoResponse, SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
import { map, tap } from 'rxjs/operators';

/**
 * Service to provide methods and properties from the
 * api server 'admin' endpoint. provides things like lib versions
 * and license info.
 */
@Injectable({
  providedIn: 'root'
})
export class SzAdminService {
  /** release version of the senzing-rest-api server being used */
  public apiServerVersion: string;
  /** version of the OAS senzing-rest-api spec being used */
  public restApiVersion: string;
  /** release version of the @senzing/sdk-components-ng package*/
  public sdkComponentsVersion: string;
  /** version of the @senzing/sdk-graph-components package being used */
  public graphComponentsVersion: string;
  /** version of the @senzing/rest-api-client-ng package */
  public restApiClientVersion: string;
  /** compatibility integer */
  public configCompatibilityVersion: string;
  /** datatime of when the native api used was built */
  public nativeApiBuildDate: Date;
  /** native api build */
  public nativeApiBuildNumber: string;
  /** version of the native api being used */
  public nativeApiVersion: string;
  /** version information from the api server interface */
  public versionInfo: SzVersionInfo;
  /** license information from the api server interface */
  public licenseInfo: SzLicenseInfo;
  /** server information from the api server interface */
  public serverInfo: SzServerInfo;

  /** properties from serverInfo endpoint */
  public concurrency: number;
  public activeConfigId: number;
  public dynamicConfig: boolean;
  public readOnly: boolean = true;
  public adminEnabled: boolean = false;

  /** event broadcasters */
  public onVersionInfo: Subject<SzVersionInfo> = new BehaviorSubject<SzVersionInfo>({});
  public onLicenseInfo: Subject<SzLicenseInfo> = new BehaviorSubject<SzLicenseInfo>({});
  public onServerInfo: Subject<SzServerInfo> = new BehaviorSubject<SzServerInfo>({});

  constructor(
    private adminService: AdminService,
    private configService: ConfigService,
    private bulkDataService: BulkDataService
    ) {
    // this.sdkComponentsVersion = sdkVersion;
    // get information from api server from adminService
    this.getVersionInfo().subscribe( (info: SzVersionInfo) => {
      this.restApiVersion = info.restApiVersion;
      this.apiServerVersion = info.apiServerVersion;
      this.configCompatibilityVersion = info.configCompatibilityVersion;
      this.nativeApiBuildDate = info.nativeApiBuildDate;
      this.nativeApiBuildNumber = info.nativeApiBuildNumber;
      this.nativeApiVersion = info.nativeApiVersion;
      this.onVersionInfo.next(this.versionInfo);
    }, (error) => {});
    this.getLicenseInfo().subscribe( (info: SzLicenseInfo) => {
      this.onLicenseInfo.next(this.licenseInfo);
    }, (error) => {});
    this.getServerInfo().subscribe( (info: SzServerInfo) => {
      console.info('SzAdminService.getServerInfo: ', info);
      this.concurrency = info.concurrency;
      this.activeConfigId = info.activeConfigId;
      this.dynamicConfig = info.dynamicConfig;
      this.readOnly = info.readOnly;
      this.adminEnabled = info.adminEnabled;
      this.onServerInfo.next(this.serverInfo);
    }, (error) => {});
  }

  /** get diagnostic information from the rest-api-server host */
  public getHeartbeat(): Observable<SzMeta> {
    return this.adminService.heartbeat()
    .pipe(
      map( (resp: SzBaseResponse) => resp.meta )
    );
  }
  /** get diagnostic information from the rest-api-server host */
  public getLicenseInfo(): Observable<SzLicenseInfo> {
    return this.adminService.license()
    .pipe(
      map( (resp: SzLicenseResponse) => resp.data.license ),
      tap( (licInfo: SzLicenseInfo ) => { this.licenseInfo = licInfo; })
    );
  }
  /** get diagnostic information from the rest-api-server host */
  public getVersionInfo(): Observable<SzVersionInfo> {
    return this.adminService.version()
    .pipe(
      map( (resp: SzVersionResponse) => resp.data ),
      tap( (versInfo: SzVersionInfo ) => { this.versionInfo = versInfo; })
    );
  }
  /** get server information from the rest-api-server host */
  public getServerInfo(): Observable<SzServerInfo> {
    return this.adminService.getServerInfo()
    .pipe(
      map( (resp: SzServerInfoResponse) => resp.data ),
      tap( (data: SzServerInfo ) => { this.serverInfo = data; })
    );
  }
  public getServerInfoMetadata(): Observable<SzMeta> {
    return this.adminService.getServerInfo()
    .pipe(
      map( (resp: SzServerInfoResponse) => resp.meta )
    );
  }
  public addDataSources(body?: DatasourcesBody | string, dataSource?: string[], withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzDataSourcesResponseData> {
    if (!this.adminEnabled || this.readOnly) {
      throw new Error('admin operation not permitted.');
    }
    return this.configService.addDataSources(body, dataSource, withRaw, observe, reportProgress)
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data )
    );
  }
  public getActiveConfig(observe?: 'body', reportProgress?: boolean): Observable<SzConfigResponse> {
    // get active config
    return this.configService.getActiveConfig();
  }
  public getAttributeType(attrCode: string, withRaw?): Observable<SzAttributeType> {
    // get attribute type
    return this.configService.getAttributeType(attrCode, withRaw)
    .pipe(
      map( (resp: SzAttributeTypeResponse) => resp.data.attributeType )
    );
  }
  public getAttributeTypes(withInternal?: boolean, attributeClass?: SzAttributeClass, featureType?: string, withRaw?: boolean, observe?: "body", reportProgress?: boolean): Observable<SzAttributeTypesResponseData> {
    // get attribute type
    return this.configService.getAttributeTypes(withInternal, attributeClass, featureType, withRaw, observe, reportProgress)
    .pipe(
      map( (resp: SzAttributeTypesResponse) => resp.data )
    );
  }
  public getDataSource(dataSourceCode: string, withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzDataSourceResponse> {
    return this.configService.getDataSource(dataSourceCode, withRaw, observe, reportProgress);
  }
  /*
  public getTemplateConfig(observe?: 'body', reportProgress?: boolean): Observable<SzConfigResponse> {
    return this.configService.getTemplateConfig(observe, reportProgress);
  }*/
  public listDataSources(withRaw?: boolean, observe?: "body", reportProgress?: boolean): Observable<SzDataSourcesResponse> {
    return this.configService.getDataSources(withRaw, observe, reportProgress)
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp )
    );
  }
  public analyzeBulkRecords(body: string | Blob | File | { [key: string]: any}[], progressPeriod?: string, observe?: 'body', reportProgress?: boolean): Observable<SzBulkDataAnalysisResponse> {
    if (!this.adminEnabled || this.readOnly) {
      throw new Error('admin operation not permitted.');
    }
    return this.bulkDataService.analyzeBulkRecords(body, progressPeriod, undefined, observe, reportProgress)
    .pipe(
      map( (resp: SzBulkDataAnalysisResponse) => resp )
    );
  }
  public loadBulkRecords(body: string | Blob | File | { [key: string]: any}[], dataSource?: string, mapDataSources?: string, mapDataSource?: string[], maxFailures?: string | number, progressPeriod?: string, eofSendFileTimeout?: string | number, observe?: 'body', reportProgress?: boolean): Observable<SzBulkLoadResponse> {
    if (!this.adminEnabled || this.readOnly) {
      throw new Error('admin operation not permitted.');
    }
    return this.bulkDataService.loadBulkRecords(body, dataSource, mapDataSources, mapDataSource, maxFailures, progressPeriod, eofSendFileTimeout, observe, reportProgress);
  }

}
