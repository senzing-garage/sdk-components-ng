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

  /** password used for challenge respose. */
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


  constructor(@Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration) { }
}
