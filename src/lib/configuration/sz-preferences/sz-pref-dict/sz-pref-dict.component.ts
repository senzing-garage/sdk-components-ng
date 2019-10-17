import { Component, OnInit, Inject } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';

/**
 * Provides a component that lists all current API connection config parameters as
 * a human readable table.
 *
 * @example
 * <sz-configuration-about></sz-configuration-about>
 *
 * @export
 */
@Component({
  selector: 'sz-pref-dict',
  templateUrl: './sz-pref-dict.component.html',
  styleUrls: ['./sz-pref-dict.component.scss']
})
export class SzPrefDictComponent implements OnInit {
  public apiProperties: object[];

  constructor(@Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration) {}

  public getPropsAsArray(): object[] {
    // Step 1. Get all the object keys.
    let propKeys = Object.keys(this.apiConfiguration);
    // Step 2. Create an empty array.
    let retArr = [];
    // Step 3. Iterate throw all keys.
    for(let propKey of propKeys) {
      retArr.push( {key: propKey, value: this.apiConfiguration[propKey] } );
    }
    return retArr;
  }

  ngOnInit() {
    if(this.apiConfiguration){
      this.apiProperties = this.getPropsAsArray();
    }
  }

}
