import { Component, Input, Output } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { SzConfigurationService } from '../../services/sz-configuration.service';

/**
 * Provides a service integration web component(WC) that can be used to set, read, change, and
 * API configuration parameters used through all components.
 *
 * For Angular implementations we recommend using {@link SzConfigurationService} as an injectable as it
 * provides the more robust solution.
 *
 * @example <!-- (WC) SzConfigurationComponent Example - javascript -->
 * <sz-wc-configuration id="sz-api-conf"></sz-wc-configuration>
 * document.getElementById('sz-api-conf').basePath = 'http://apis.mydomain.com';
 *
 * @example <!-- (WC) SzConfigurationComponent Example - By attribute -->
 * <sz-wc-configuration base-path="http://apis.mydomain.com/api"></sz-wc-configuration>
 *
 * @export
 */
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

  /** 
   * set additional http/https request headers to be added by default to 
   * all outbound api server requests. most commonly used for adding custom 
   * or required non-standard headers like jwt session tokens, auth id etc.
   */
  @Input()
  set additionalHeaders(value: {[key: string]: string} | string) {
    if((value as string).indexOf && (value as string).indexOf(',') > -1) {
      // assume string in format of "key=value,key=value"
      try{
        let _additionalHeaders = {};
        let _pairs =  (value as string).split(',');
        if(_pairs && _pairs.forEach) {
          _pairs.forEach((_pair)=>{
            let _pairAsArr = _pair.split('=').map((tok) => {
              return (tok && tok.trim) ?  tok.trim() : tok;
            });
            if(_pairAsArr && _pairAsArr.length >= 2) {
              _additionalHeaders[ _pairAsArr[0] ] = _pairAsArr[1];
            }
          });
        }
      }catch(err){}
    } else {
      // assume object with key-value pairs
      this.apiConfigService.additionalApiRequestHeaders = (value as {[key: string]: string});
    }
    this.onParameterChange();
  }

  constructor(private apiConfigService: SzConfigurationService) { }

}
