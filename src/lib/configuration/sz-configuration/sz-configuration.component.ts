import { Component, Inject, Input, Output } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';

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
  set basePath(value: string) {
    this.apiConfiguration.basePath = value;
    this.onParameterChange();
  }

  /** whether or not to use CORs for api requests */
  @Input()
  set withCredentials(value: boolean) {
    this.apiConfiguration.withCredentials = value;
    this.onParameterChange();
  }

  constructor(@Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration) { }

}
