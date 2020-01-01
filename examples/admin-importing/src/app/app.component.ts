import { Component, AfterViewInit, ViewContainerRef } from '@angular/core';
import {
  SzPrefsService,
  SzConfigurationService
} from '@senzing/sdk-components-ng';
import { tap, filter, take } from 'rxjs/operators';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  constructor(
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {}
}
