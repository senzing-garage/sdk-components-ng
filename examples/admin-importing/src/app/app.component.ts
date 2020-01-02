import { Component, AfterViewInit, ViewContainerRef, OnInit } from '@angular/core';
import {
  SzPrefsService,
  SzAdminService,
  SzConfigurationService
} from '@senzing/sdk-components-ng';
import { tap, filter, take } from 'rxjs/operators';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit {
  public get adminEnabled() {
    return this.adminService.adminEnabled;
  }
  public get readOnly() {
    return this.adminService.readOnly;
  }
  constructor(
    public prefs: SzPrefsService,
    private adminService: SzAdminService,
    public viewContainerRef: ViewContainerRef){}

  ngOnInit() {
    this.adminService.onServerInfo.subscribe((info) => {
      console.log('Hi!', info);
    });
  }

  ngAfterViewInit() {
  }
}
