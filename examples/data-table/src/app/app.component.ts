import { Component, AfterViewInit, ViewChild, ElementRef, ViewContainerRef, TemplateRef, Input } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchComponent,
  SzSearchService,
  SzEntityDetailComponent,
  SzEntityData,
  SzPrefsService,
  SzConfigurationService,
  SzEntityIdentifier
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
export class AppComponent implements AfterViewInit {
  public currentlySelectedEntityId: number// = 100034;
  public currentSampleData: any;
  public showSampleTable    = false;
  public showEntityDetail   = false;
  public sampleStatType;

  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;

  sub: Subscription;
  overlayRef: OverlayRef | null;

  constructor(
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {
    /*const searchParams = this.searchBox.getSearchParams();
    if (searchParams){
      if ( Object.keys(searchParams).length > 0) {
        // do auto search
        this.searchBox.submitSearch();
      }
    }*/
  }

  /** since data can be any format we have to use loose typing */
  onCellClick(data: any) {
    console.log(data);
  }

  onDataSourceSelectionChanged(data: any) {
    console.log(`app onDataSourceSelectionChanged: `, data);
    //this.sampleStatDataSources = data
  }
  getNewSampleData(parameters: any) {
    console.log(`app getNewSampleData: `, parameters);
    //this.sampleStatDataSources = data
  }
  
}
