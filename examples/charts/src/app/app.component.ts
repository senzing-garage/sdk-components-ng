import { Component, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { Subscription} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  sub: Subscription;
  overlayRef: OverlayRef | null;
  
  constructor( public overlay: Overlay, public viewContainerRef: ViewContainerRef ) {}
}
