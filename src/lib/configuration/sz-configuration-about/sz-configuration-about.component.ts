import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzConfigurationService } from '../../services/sz-configuration.service';

/**
 * Provides a component that lists all current API connection config parameters as
 * a human readable table.
 *
 * @example 
 * <code>
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-configuration-about&gt;&lt;/sz-configuration-about&gt;<br/><br/>
 *
 * &lt;!-- (WC) by attribute --&gt;<br/>
 * &lt;sz-wc-configuration-about&gt;&lt;/sz-wc-configuration-about&gt;<br/>
 * </code>
 */
@Component({
  selector: 'sz-configuration-about',
  templateUrl: './sz-configuration-about.component.html',
  styleUrls: ['./sz-configuration-about.component.scss']
})
export class SzConfigurationAboutComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public apiProperties: object[];

  constructor(@Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration, private apiConfigService: SzConfigurationService) {}

  public getPropsAsArray(config: SzRestConfiguration): object[] {
    // Step 1. Get all the object keys.
    let propKeys = Object.keys(config);
    // Step 2. Create an empty array.
    let retArr = [];
    // Step 3. Iterate throw all keys.
    for(let propKey of propKeys) {
      retArr.push( {key: propKey, value: config[propKey] } );
    }
    return retArr;
  }

  ngOnInit() {
    if(this.apiConfiguration){
      this.apiProperties = this.getPropsAsArray(this.apiConfiguration);
    }
    // on property change update view
    this.apiConfigService.parametersChanged.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe( (conf: SzRestConfiguration) => {
      this.apiProperties = this.getPropsAsArray(conf);
    });
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
