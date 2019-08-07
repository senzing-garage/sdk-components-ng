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

@Injectable({
  providedIn: 'root'
})
export class SzConfigurationService {
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

  constructor(@Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration, public graphApiConfigService: SzGraphConfigurationService) { }
}
