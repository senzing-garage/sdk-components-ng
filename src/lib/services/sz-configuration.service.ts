import { Injectable, Output, Input, Inject } from '@angular/core';
import { Configuration as SzRestConfiguration, ConfigurationParameters as SzRestConfigurationParameters } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
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
  }
  /** remove an additional header from all outgoing API requests */
  public removeHeaderFromApiRequests(header: {[key: string]: string} | string): void {
    this.apiConfiguration.removeAdditionalRequestHeader( header );
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
  }
  /**
   * emitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public parametersChanged: Subject<SzRestConfiguration> = new Subject<SzRestConfiguration>();

  private onParameterChange(): void {
    this.parametersChanged.next(this.apiConfiguration);
  }
  /**
   * apiKeys to use when connecting to Api Server
   */
  @Input()
  set apiKeys(value: {[ key: string ]: string}) {
    this.apiConfiguration.apiKeys = value;
    this.onParameterChange();
  }
  /**
   * Username to use when using challenge response authentication.
   */
  @Input()
  set username(value: string) {
    this.apiConfiguration.username = value;
    this.onParameterChange();
  }
  /** password used for challenge response. */
  @Input()
  set password(value: string) {
    this.apiConfiguration.password = value;
    this.onParameterChange();
  }
  @Input()
  set accessToken(value: string | (() => string)) {
    this.apiConfiguration.accessToken = value;
    this.onParameterChange();
  }
  /** prefix all api requests with this value. most commonly a http or https
   * protocol://hostname:port string that your api server can be accessed through
   */
  @Input()
  public set basePath(value: string) {
    this.apiConfiguration.basePath = value;
    this.onParameterChange();
  }
  public get basePath(): string {
    return this.apiConfiguration.basePath;
  }
  /** whether or not to use CORs for api requests */
  @Input()
  set withCredentials(value: boolean) {
    this.apiConfiguration.withCredentials = value;
    this.onParameterChange();
  }
  /** bulk runtime set of sdk configuration */
  public fromParameters(value: SzRestConfigurationParameters) {
    const propKeys = Object.keys(value);

    for(const propKey of propKeys) {
      const propValue = value[ propKey ];
      this.apiConfiguration[propKey] = propValue;
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
    public prefs: SzPrefsService
  ) {}
}
