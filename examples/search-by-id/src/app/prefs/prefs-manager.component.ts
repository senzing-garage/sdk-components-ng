import { AfterViewInit, Component, EventEmitter, Input, Inject, OnInit, Output, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { SzPrefsService, SzSdkPrefsModel } from '@senzing/sdk-components-ng';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'sz-prefs-manager',
  templateUrl: './prefs-manager.component.html',
  styleUrls: ['./prefs-manager.component.scss']
})
export class SzPrefsManagerComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _prefsJSON: SzSdkPrefsModel;
  // key that is used to access the data in local storage
  @Input()
  public STORAGE_KEY = 'senzing-web-app';
  private _localStorageOriginalValue: SzSdkPrefsModel = this.storage.get(this.STORAGE_KEY);

  public sForm_allowedTypeAttributes = [
    'NIN_NUMBER',
    'ACCOUNT_NUMBER',
    'SSN_NUMBER',
    'SSN_LAST4',
    'DRIVERS_LICENSE_NUMBER',
    'PASSPORT_NUMBER',
    'NATIONAL_ID_NUMBER',
    'OTHER_ID_NUMBER',
    'TAX_ID_NUMBER',
    'TRUSTED_ID_NUMBER',
    'SOCIAL_NETWORK'
  ].sort();

  @ViewChild('graphMaxDegrees') graphMaxDegrees: ElementRef;
  @ViewChild('graphMaxEntities') graphMaxEntities: ElementRef;

  public isAllowedAttributeChecked(attrKey: string){
    let retVal = false;
    if (this._prefsJSON && this._prefsJSON.searchForm && this._prefsJSON.searchForm.allowedTypeAttributes) {
      // console.log(`isAllowedAttributeChecked( ${attrKey} )`, (this._prefsJSON.searchForm.allowedTypeAttributes.indexOf(attrKey) > 0));
      retVal = (this._prefsJSON.searchForm.allowedTypeAttributes.indexOf(attrKey) >= 0);
    }
    return retVal;
  }

  public boolPrefChecked(prefGroup: string, prefKey: string){
    let retVal = false;
    if (this.prefs[prefGroup] && typeof this.prefs[prefGroup][prefKey] === 'boolean') {
      // console.log(`isAllowedAttributeChecked( ${attrKey} )`, (this._prefsJSON.searchForm.allowedTypeAttributes.indexOf(attrKey) > 0));
      retVal = this.prefs[prefGroup][prefKey];
    }
    return retVal;
  }

  public prefValAsInt(prefGroup: string, prefKey: string): number {
    let retVal = -1;
    // console.log(`prefValAsInt( ${prefKey} )`, typeof this.prefs[prefGroup][prefKey]);
    retVal = this.prefs[prefGroup][prefKey];
    return retVal;
  }

  constructor(
    private prefs: SzPrefsService,
    @Inject(LOCAL_STORAGE) private storage: StorageService
  ) {
    // initialize prefs from localStorage value
    this.prefs.fromJSONObject(this._localStorageOriginalValue);

    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (pJson) => {
      this._prefsJSON = pJson;
      this.savePrefsToLocalStorage();
      // console.warn('SAVED SDK PREFS TO LocalStorage', pJson, this.storage.get(this.STORAGE_KEY) || 'LocaL storage is empty');
    });
  }

  ngOnInit() {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  savePrefsToLocalStorage() {
    this.storage.set(this.STORAGE_KEY, this._prefsJSON);
  }

  getPrefsFromLocalStorage() {
    return this.storage.get(this.STORAGE_KEY);
  }

  updateBoolPrefValue(prefGroup: string, prefKey: string, evt) {
    const _checked = evt.target.checked;
    if (this.prefs[prefGroup] && typeof this.prefs[prefGroup][prefKey] === 'boolean'){
      this.prefs[prefGroup][prefKey] = _checked;
    }
  }

  updateArrayBoolPrefValue(prefGroup: string, prefKey: string, prefVal: string, evt) {
    console.log(`updateArrayBoolPrefValue(${prefGroup}, ${prefKey})`, evt);
    const _checked = evt.target.checked;
    if (this.prefs[prefGroup] && this.prefs[prefGroup][prefKey] ){
      let prefs = this.prefs[prefGroup][prefKey];
      const existsAtIndex = prefs.indexOf(prefVal);
      console.log(`existsAtIndex: ${existsAtIndex}`, prefs, _checked);
      if (existsAtIndex >= 0 && !_checked){
        // remove from list
        prefs = prefs.splice(existsAtIndex, 1);
      } else if (_checked) {
        // add to list
        prefs.push(prefVal);
      }
      this.prefs[prefGroup][prefKey] = prefs;
    }
  }

  updateIntPrefValue(prefGroup: string, prefKey: string, prefVal: number): void {
    //console.log(`updateIntPrefValue(${prefGroup}, ${prefKey})`, prefVal, typeof this.prefs[prefGroup][prefKey]);
    if (prefVal > 0 && this.prefs[prefGroup] && this.prefs[prefGroup][prefKey]){
      this.prefs[prefGroup][prefKey] = prefVal;
    }
  }


}
