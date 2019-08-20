import { Component, OnInit, Input, Inject } from '@angular/core';
import { SzPrefsService2 } from '../services/sz-prefs2.service';

@Component({
  selector: 'sz-powered-by',
  templateUrl: './sz-powered-by.component.html',
  styleUrls: ['./sz-powered-by.component.scss']
})
export class SzPoweredByComponent implements OnInit {
  @Input()
  format = 'small';

  constructor(public prefs: SzPrefsService2) {
    this.prefs.searchResults.prefsChanged.subscribe( (prefs)=> {
      console.log('search results prefs from powered by', prefs);
    });
  }

  ngOnInit() {
  }

}
