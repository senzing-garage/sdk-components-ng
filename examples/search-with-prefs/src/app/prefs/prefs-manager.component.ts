import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SzPrefsService } from '@senzing/sdk-components-ng';

@Component({
  selector: 'sz-prefs-manager',
  templateUrl: './prefs-manager.component.html',
  styleUrls: ['./prefs-manager.component.scss']
})
export class SzPrefsManagerComponent implements OnInit {
  constructor(
    private prefs: SzPrefsService
  ) {
    this.prefs.searchResults.prefsChanged.subscribe( (pJson) => {
      console.warn('SEARCH RESULTS PREF CHANGE!', pJson);
    });
  }

  ngOnInit() {}

}
