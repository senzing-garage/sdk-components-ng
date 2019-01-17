import { Component, OnInit, Inject, Input } from '@angular/core';
import { SzRestConfiguration } from '../../common/sz-rest-configuration';
import { Configuration as ApiConfiguration } from '@senzing/rest-api-client-ng';

@Component({
  selector: 'sz-configuration',
  template: ``,
  styles: ['']
})
export class SzConfigurationComponent implements OnInit {
  @Input()
  set apiKeys(value: {[ key: string ]: string}) {
    this.apiConfiguration.apiKeys = value;
  }

  @Input()
  set username(value: string) {
    this.apiConfiguration.username = value;
  }

  @Input()
  set password(value: string) {
    this.apiConfiguration.password = value;
  }

  @Input()
  set accessToken(value: string | (() => string)) {
    this.apiConfiguration.accessToken = value;
  }

  @Input()
  set basePath(value: string) {
    this.apiConfiguration.basePath = value;
  }

  @Input()
  set withCredentials(value: boolean) {
    this.apiConfiguration.withCredentials = value;
  }

  constructor(@Inject(ApiConfiguration) public apiConfiguration: ApiConfiguration) { }

  ngOnInit() {

  }

}
