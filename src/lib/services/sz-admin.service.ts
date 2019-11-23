import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminService,
  SzBaseResponse, SzBaseResponseMeta,
  SzLicenseResponse, SzLicenseInfo,
  SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
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

  constructor(private adminService: AdminService) {
    // this.sdkComponentsVersion = sdkVersion;
    // get information from api server from adminService
    this.getVersionInfo().subscribe( (info: SzVersionInfo) => {
      this.restApiVersion = info.restApiVersion;
      this.apiServerVersion = info.apiServerVersion;
      this.configCompatibilityVersion = info.configCompatibilityVersion;
      this.nativeApiBuildDate = info.nativeApiBuildDate;
      this.nativeApiBuildNumber = info.nativeApiBuildNumber;
      this.nativeApiVersion = info.nativeApiVersion;
    });
    this.getLicenseInfo().subscribe( (info: SzLicenseInfo) => {
      this.licenseInfo = info;
    });
  }

  /** get diagnostic information from the rest-api-server host */
  public getHeartbeat(): Observable<SzBaseResponseMeta> {
    // get attributes
    return this.adminService.heartbeat()
    .pipe(
      map( (resp: SzBaseResponse) => resp.meta )
    );
  }
  /** get diagnostic information from the rest-api-server host */
  public getLicenseInfo(): Observable<SzLicenseInfo> {
    // get attributes
    return this.adminService.license()
    .pipe(
      map( (resp: SzLicenseResponse) => resp.data.license ),
      tap( (licInfo: SzLicenseInfo ) => { this.licenseInfo = licInfo; })
    );
  }
  /** get diagnostic information from the rest-api-server host */
  public getVersionInfo(): Observable<SzVersionInfo> {
    // get attributes
    return this.adminService.version()
    .pipe(
      map( (resp: SzVersionResponse) => resp.data ),
      tap( (versInfo: SzVersionInfo ) => { this.versionInfo = versInfo; })
    );
  }

}
