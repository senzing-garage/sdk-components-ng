import { Component, TemplateRef, ViewContainerRef, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { fromEvent, Subscription, filter, take } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import { SzEntityIdentifier } from '@senzing/rest-api-client-ng';
import { SzRelationshipNetworkComponent } from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  title = 'graph';
  sub: Subscription;
  overlayRef: OverlayRef | null;
  
  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  @ViewChild('graphComponent') graphComponentEle: SzRelationshipNetworkComponent;

  
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;

  /**
   * create context menu for graph options
   */
  public openContextMenu(event: any) {
    // console.log('openContextMenu: ', event);
    this.closeContextMenu();
    const positionStrategy = this.overlay.position().global();
    positionStrategy.top(Math.ceil(event.eventPageY)+'px');
    positionStrategy.left(Math.ceil(event.eventPageX)+'px');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.graphContextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    console.warn('openContextMenu: ', event);
    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeContextMenu());

    return false;
  }
  /**
   * close graph context menu
   */
  closeContextMenu() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  hideGraphItem(event: any) {
    console.log('hideGraphItem: ', event.entityId);
    this.graphComponentEle.removeNode(event.entityId);
  }

  /**
   * open up a context menu on graph entity right-click
   */
  public onContextClick(event: any): void {
    this.openContextMenu(event);
  }

  /**
   * on entity node right click in the graph.
   * proxies to synthetic "contextMenuClick" event.
   * automatically adds the container ele page x/y to relative svg x/y for total x/y offset
   */
  public onRightClick(event: any) {
    if(this.graphContainerEle && this.graphContainerEle.nativeElement) {
      interface EvtModel {
        address?: string;
        entityId?: number;
        iconType?: string;
        index?: number;
        isCoreNode?: false;
        isQueriedNode?: false;
        name?: string;
        orgName?: string;
        phone?: string;
        x?: number;
        y?: number;
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: EvtModel = Object.assign({}, event);
      // change x/y to include element relative offset
      evtSynth.x = (Math.floor(pos.x) + Math.floor(event.x));
      evtSynth.y = (Math.floor(pos.y) + Math.floor(event.y));

       console.warn('onRightClick: ', pos, event, evtSynth);
      this.contextMenuClick.emit( evtSynth );
    }
  }
  public onGraphZoom(event: any) {

  }

  constructor( public overlay: Overlay, public viewContainerRef: ViewContainerRef ) {}
}
