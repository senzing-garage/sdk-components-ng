import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
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

  public keyTitle = "datasource";
  public valueTitle = "color";
  @Input() public valueType = "text";

  public newKeyPrefix = "DataSourceName";
  public keyPlaceholder = "Data Source Name";
  public _data: any = {
    'OWNERS': 'red',
    'SAMPLE_PERSON': 'purple',
  };
  private _newKeyMaxInt = Object.keys(this._data).length + 1;

  /**
   * emmitted when a property has been changed.
   * used mostly for diagnostics.
   */
  @Output()
  public dataChange: EventEmitter<any> = new EventEmitter<any>();

  @Input() public set value(val: any) {
    const isInitialValue = (this._data == undefined) ? true : false;
    this._data = val;
    if(isInitialValue) {
      this._newKeyMaxInt = Object.keys(this._data).length + 1;
    }
  }
  public get value() {
    return this._data;
  }

  public get valueAsArray() {
    let retVal = [];
    if(this._data && typeof this._data == 'object') {
      let _keys = Object.keys(this._data);
      retVal = _keys.map( (_kname) => {
        return {'name': _kname, 'value': this._data[_kname]}
      })
    }
    return retVal;
  }

  public deleteProperty(propertyKey: string) {
    if(this._data && this._data[propertyKey]){
      // remove property from data object
      delete this._data[propertyKey];
    }
    try {
      delete this._data[propertyKey];
    } catch(err) {
          console.log('deleteProperty('+propertyKey+')  error: ', err);
    }
    console.log('deleteProperty('+propertyKey+')  _data: ', this._data);
  }

  public addProperty(propertyKey?: string) {
    if(propertyKey) {
      if(this._data && this._data[propertyKey]){
        // property already exists just update
        // focus on element input and highlight text
      }
      console.log('propertyKey already defined: ', this._data[propertyKey]);
    } else {
      // autogen property key (cant have a value with no key in a JSON object)
      let _newKeyName = this.newKeyPrefix + this._newKeyMaxInt;
      this._newKeyMaxInt = this._newKeyMaxInt + 1; // bump next value up by one so were less likely to repeat
      this._data[_newKeyName] = '';
      console.log('added "'+ _newKeyName +'"');
    }
  }

  public onValueChange(propertyKey, evt) {
    if(propertyKey && evt && evt.target && evt.target.value){
      const newValue   = evt.target.value;
      this._data[propertyKey] = newValue;
      this.publish();
    } else {
      console.warn('could not update value: ', evt, this._data);
    }
  }

  public onKeyChange(propertyKey, evt) {
    const _oldData = this._data;
    const oldKey   = propertyKey;
    const oldValue = _oldData[propertyKey];
    let isOldKeySameAsNewOne = false;

    if(evt && evt.target && evt.target.value){
      const newKey   = evt.target.value;
      if(oldKey == newKey) {
        isOldKeySameAsNewOne = true;
      }
       try {
        delete _oldData[propertyKey];
      } catch(err) {
            console.log('could not remove old key ('+propertyKey+')  error: ', err);
      }
      // add new one
      _oldData[newKey] = oldValue;
      this._data = _oldData;
      this.publish();
    }
    console.log('onKeyChange: ', propertyKey, this._data);

    if(!isOldKeySameAsNewOne) {
      this._newKeyMaxInt = this._newKeyMaxInt + 1; // bump next value up by one so were less likely to repeat
    }
  }

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

  /** publish data change event using current payload */
  publish() { this.dataChange.emit(this._data); }

  ngOnInit() {}

}
