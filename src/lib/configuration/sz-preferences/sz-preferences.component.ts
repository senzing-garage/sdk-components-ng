import { Component, Inject, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { SzConfigurationService } from '../../services/sz-configuration.service';
import { SzSdkPrefsModel, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sz-preferences',
  templateUrl: 'sz-preferences.component.html',
  styles: ['']
})
export class SzPreferencesComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _prefsJSON: SzSdkPrefsModel;

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

  constructor(
    private apiConfigService: SzConfigurationService,
    private prefs: SzPrefsService
  ) {
    // initialize prefs from localStorage value
    // this.prefs.fromJSONObject(this._localStorageOriginalValue);

    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (pJson) => {
      this._prefsJSON = pJson;
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
}
