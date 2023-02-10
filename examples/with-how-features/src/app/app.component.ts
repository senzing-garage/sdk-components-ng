import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import {
  SzSearchComponent,
  SzSearchService,
  SzPrefsService,
  SzHowEntityResult,
  SzResolutionStep
} from '@senzing/sdk-components-ng';
import { 
  SzVirtualEntity 
} from '@senzing/rest-api-client-ng';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  //public currentlySelectedEntityId: number = 200002;
  //public currentlySelectedEntityId: number = 400124;
  public currentlySelectedEntityId: number = 401992;

  private howResult: SzHowEntityResult;  
  @ViewChild('howGraph') howGraph: SzSearchComponent;

  constructor(
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {
  }

  public onDataChange(data: SzHowEntityResult) {
    console.log('onDataChange: ',data);
    this.howResult = data;
  }

  public get resolutionStepsByVirtualId(): {[key: string]: SzResolutionStep} {
    if(this.howResult) {
      return this.howResult.resolutionSteps;
    }
    return undefined;
  }
  public get finalCardsData(): SzVirtualEntity[] {
    if(this.howResult) {
      return this.howResult.finalStates;
    }
    return undefined;
  }
}
