import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzPdfUtilService,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzSearchResultsComponent
} from '@senzing/sdk-components-ng';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public currentlySelectedEntityId: number = 300001;
  
  @ViewChild('howGraph') howGraph: SzSearchComponent;

  constructor(
    public pdfUtil: SzPdfUtilService,
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {
  }
}
