import { Component, OnInit, Inject } from '@angular/core';
import { SzRestConfiguration } from '../../common/sz-rest-configuration';

@Component({
  selector: 'sz-configuration-about',
  templateUrl: './sz-configuration-about.component.html',
  styleUrls: ['./sz-configuration-about.component.scss']
})
export class SzConfigurationAboutComponent implements OnInit {
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
