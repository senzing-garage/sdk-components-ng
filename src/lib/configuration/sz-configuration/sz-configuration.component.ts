import { Component, Inject, Input, Output } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { SzConfigurationService } from '../../services/sz-configuration.service';

@Component({
  selector: 'sz-configuration',
  template: ``,
  styles: ['']
})
export class SzConfigurationComponent {
  /**
   * emmitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public parametersChanged: Subject<SzRestConfiguration> = new Subject<SzRestConfiguration>();

  private onParameterChange(): void {
    this.parametersChanged.next(this.apiConfigService.apiConfiguration);
  }

  /**
   * apiKeys to use when connnecting to Api Server
   */
  @Input()
  set apiKeys(value: {[ key: string ]: string}) {
    this.apiConfigService.apiKeys = value;
    this.onParameterChange();
  }

  /**
   * Username to use when using challenge response authentication.
   */
  @Input()
  set username(value: string) {
    this.apiConfigService.username = value;
    this.onParameterChange();
  }

  /** password used for challenge respose. */
  @Input()
  set password(value: string) {
    this.apiConfigService.password = value;
    this.onParameterChange();
  }

  @Input()
  set accessToken(value: string | (() => string)) {
    this.apiConfigService.accessToken = value;
    this.onParameterChange();
  }

  /** prefix all api requests with this value. most commonly a http or https
   * protocol://hostname:port string that your api server can be accessed through
   */
  @Input()
  set basePath(value: string) {
    this.apiConfigService.basePath = value;
    this.onParameterChange();
  }

  /** whether or not to use CORs for api requests */
  @Input()
  set withCredentials(value: boolean) {
    this.apiConfigService.withCredentials = value;
    this.onParameterChange();
  }

  constructor(private apiConfigService: SzConfigurationService) { }

}
