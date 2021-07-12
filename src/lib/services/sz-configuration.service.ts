import { Injectable, Output, Input, Inject } from '@angular/core';
import { Observable, fromEventPattern, Subject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';
import { Configuration as SzRestConfiguration, ConfigurationParameters as SzRestConfigurationParameters } from '@senzing/rest-api-client-ng';

import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';
import { SzGraphConfigurationService } from '@senzing/sdk-graph-components';
import { SzPrefsService } from './sz-prefs.service';

/**
 * Provides a service injectable that can be used to dynamically change the global
 * values that are passed throughout all components for API connection requests.
 *
 * This service is provided for advanced usage where the connection parameters have to
 * change dynamically through the application lifecycle(ie changing request namespace from 'http://api.mydomain.com' to 'http://api.mydomain.com/SUBSECTION').
 *
 * If your application just needs its values initialized that should be done by
 * passing in a config factory to the {@link SenzingSdkModule#forRoot} method.
 *
 * @example
 * this.apiconf.basePath = 'http://apis.mydomain.com/';
 *
 * @example
 * this.apiconf.parametersChanged.subscribe( (params) => { console.log('api connection params changed.', params); })
 */
@Injectable({
  providedIn: 'root'
})
export class SzConfigurationService {
  /** add an additional header to all outgoing API requests */
  public addHeaderToApiRequests(header: {[key: string]: string}): void {
    this.apiConfiguration.addAdditionalRequestHeader( header );
    if(this.graphApiConfigService && this.graphApiConfigService.addHeaderToApiRequests){
      this.graphApiConfigService.addHeaderToApiRequests( header );
    }
  }
  /** remove an additional header from all outgoing API requests */
  public removeHeaderFromApiRequests(header: {[key: string]: string} | string): void {
    this.apiConfiguration.removeAdditionalRequestHeader( header );
    if(this.graphApiConfigService && this.graphApiConfigService.removeHeaderFromApiRequests){
      this.graphApiConfigService.removeHeaderFromApiRequests( header );
    }
  }
  /** 
   * additional http/https request headers that will be added by default to 
   * all outbound api server requests.
   */
  public get additionalApiRequestHeaders(): {[key: string]: string} | undefined {
    return this.apiConfiguration.additionalHeaders;
  }
  /** 
   * set additional http/https request headers to be added by default to 
   * all outbound api server requests. most commonly used for adding custom 
   * or required non-standard headers like jwt session tokens, auth id etc.
   */
  public set additionalApiRequestHeaders(value: {[key: string]: string} | undefined) {
    this.apiConfiguration.additionalHeaders = value;
    if(this.graphApiConfigService && this.graphApiConfigService.additionalApiRequestHeaders) {
      this.graphApiConfigService.additionalApiRequestHeaders = this.apiConfiguration.additionalHeaders;
    }
  }
  /**
   * emmitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public parametersChanged: Subject<SzRestConfiguration> = new Subject<SzRestConfiguration>();

  private onParameterChange(): void {
    this.parametersChanged.next(this.apiConfiguration);
  }
  /**
   * apiKeys to use when connnecting to Api Server
   */
  @Input()
  set apiKeys(value: {[ key: string ]: string}) {
    this.apiConfiguration.apiKeys = value;
    if(this.graphApiConfigService && this.graphApiConfigService.apiKeys){
      this.graphApiConfigService.apiKeys = this.apiConfiguration.apiKeys;
    }
    this.onParameterChange();
  }
  /**
   * Username to use when using challenge response authentication.
   */
  @Input()
  set username(value: string) {
    this.apiConfiguration.username = value;
    if(this.graphApiConfigService && this.graphApiConfigService.username){
      this.graphApiConfigService.username = this.apiConfiguration.username;
    }
    this.onParameterChange();
  }
  /** password used for challenge respose. */
  @Input()
  set password(value: string) {
    this.apiConfiguration.password = value;
    if(this.graphApiConfigService && this.graphApiConfigService.password){
      this.graphApiConfigService.password = this.apiConfiguration.password;
    }
    this.onParameterChange();
  }
  @Input()
  set accessToken(value: string | (() => string)) {
    this.apiConfiguration.accessToken = value;
    if(this.graphApiConfigService && this.graphApiConfigService.accessToken){
      this.graphApiConfigService.accessToken = this.apiConfiguration.accessToken;
    }
    this.onParameterChange();
  }
  /** prefix all api requests with this value. most commonly a http or https
   * protocol://hostname:port string that your api server can be accessed through
   */
  @Input()
  public set basePath(value: string) {
    this.apiConfiguration.basePath = value;
    if(this.graphApiConfigService && this.graphApiConfigService.basePath){
      this.graphApiConfigService.basePath = this.apiConfiguration.basePath;
    }
    this.onParameterChange();
  }
  public get basePath(): string {
    return this.apiConfiguration.basePath;
  }
  /** whether or not to use CORs for api requests */
  @Input()
  set withCredentials(value: boolean) {
    this.apiConfiguration.withCredentials = value;
    if(this.graphApiConfigService && this.graphApiConfigService.withCredentials){
      this.graphApiConfigService.withCredentials = this.apiConfiguration.withCredentials;
    }
    this.onParameterChange();
  }
  /** bulk runtime set of sdk configuration */
  public fromParameters(value: SzRestConfigurationParameters) {
    const propKeys = Object.keys(value);

    for(const propKey of propKeys) {
      const propValue = value[ propKey ];
      this.apiConfiguration[propKey] = propValue;
      if(this.graphApiConfigService && this.graphApiConfigService.apiConfiguration){
        this.graphApiConfigService.apiConfiguration[propKey] = propValue;
      }
    }
  }
  /** bulk fetch of sdk configuration parameters. */
  public asConfigurationParameters(): SzRestConfigurationParameters {
    const retVal: SzRestConfigurationParameters = {};
    const propKeys = Object.keys(this.apiConfiguration);
    for(const propKey of propKeys) {
      if(this.apiConfiguration[propKey] && this.apiConfiguration[propKey] !== undefined && this.apiConfiguration[propKey] !== null) {
        retVal[ propKey ] = this.apiConfiguration[propKey];
      }
    }
    return retVal;
  }

  constructor(
    @Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration,
    public graphApiConfigService: SzGraphConfigurationService,
    public prefs: SzPrefsService
  ) {}
}
