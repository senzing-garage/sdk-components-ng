import { Component, ChangeDetectorRef, TemplateRef, ViewContainerRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzGraphComponent } from '../../../graph/sz-graph.component';
import { filter, fromEvent, Subject, Subscription, take, takeUntil } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import { SzEntityIdentifier } from '@senzing/rest-api-client-ng';
import { SzWhyEntitiesDialog } from '../../../why/sz-why-entities.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { SzMatchKeyTokenFilterScope } from '../../../models/graph';
import { SzCSSClassService } from '../../../services/sz-css-class.service';

/**
 * Embeddable Graph Component
 * used to display a entity and its network relationships
 * to other entities visually.
 *
 * Optionally can display a embedded filter control to allow user
 * to change the components parameters of this component.
 *
 * @example 
 * <code>
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-standalone-graph<br/>
          filterWidth="320"<br/>
          [graphIds]="graphIds"<br/>
          [showPopOutIcon]="false"<br/>
          [showMatchKeyControl]="false"<br/>
          [showFiltersControl]="false"<br/>
          [filterControlPosition]="'top-right'"<br/>
          (entityClick)="onGraphEntityClick($event)"<br/>
          [showMatchKeys]="true"<br/>
      &gt;&lt;/sz-standalone-graph&gt;<br/><br/>
 *
 * &lt;!-- (WC) by attribute --&gt;<br/>
 * &lt;sz-wc-standalone-graph<br/>
          filter-width="320"<br/>
          graph-ids="1,1001,1002"<br/>
          show-pop-out-icon="false"<br/>
          show-match-key-control="false"<br/>
          show-filters-control="false"<br/>
          filter-control-position="top-right"<br/>
          show-match-keys="true"<br/>
      &gt;&lt;/sz-wc-standalone-graph&gt;<br/><br/>
 *
 * &lt;!-- (WC) by DOM --&gt;<br/>
 * &lt;sz-wc-standalone-graph id="sz-wc-standalone-graph"&gt;&lt;/sz-wc-standalone-graph&gt;<br/>
 * &lt;script&gt;<br/>
 * document.getElementById('sz-wc-standalone-graph').graphIds = [1,1001,1002];<br/>
 * document.getElementById('sz-wc-standalone-graph').addEventListener('entityClick', (data) => { console.log('entity clicked on!', data); })<br/>
 * &lt;/script&gt;<br/><br/>
 * </code>
 */
@Component({
  selector: 'sz-standalone-graph',
  templateUrl: './sz-standalone-graph.component.html',
  styleUrls: ['../../../graph/sz-graph.component.scss']
})
export class SzStandaloneGraphComponent extends SzGraphComponent implements AfterViewInit {  
  /** @internal */
  overlayRef: OverlayRef | null;

  private _showGraphNodeContextMenu: boolean          = false;
  private _showGraphLinkContextMenu: boolean          = true;
  private _showGraphEntityContextMenuOnClick: boolean = false;
  private _showGraphLinkContextMenuOnClick: boolean   = false;
  public override filterShowDataSources: string[] = [];

  /** built-in graph context menus */
  @ViewChild('graphNodeContextMenu') graphNodeContextMenu: TemplateRef<any>;
  @ViewChild('graphLinkContextMenu') graphLinkContextMenu: TemplateRef<any>;
  
  /** whether or not to show the built-in context menu on graph link right-click */
  public get showGraphLinkContextMenu(): boolean {
    return this._showGraphLinkContextMenu;
  }
  /** whether or not to show the built-in context menu on graph link right-click */
  @Input() set showGraphLinkContextMenu(value: boolean) {
    this._showGraphLinkContextMenu = value;
  }
  /** whether or not to show the built-in context menu on graph entity right-click */
  public get showGraphContextMenu(): boolean {
    return this._showGraphNodeContextMenu;
  }
  /** whether or not to show the built-in context menu on graph entity right-click */
  @Input() set showGraphContextMenu(value: boolean) {
    this._showGraphNodeContextMenu = value;
  }

  /** whether or not to trigger the built-in entity context menu on single-click instead
   * of the default right-click 
   */
  @Input() set showGraphEntityContextMenuOnClick(value: boolean) {
    this._showGraphEntityContextMenuOnClick = value;
  }
  /** whether or not to trigger the built-in relationship context menu on single-click instead
   * of the default right-click 
   */
  @Input() set showGraphLinkContextMenuOnClick(value: boolean) {
    this._showGraphLinkContextMenuOnClick = value;
  }

  constructor(
    public _p_prefs: SzPrefsService,
    private _p_cd: ChangeDetectorRef,
    private _p_css: SzCSSClassService,
    public overlay: Overlay,
    public dialog: MatDialog,
    public viewContainerRef: ViewContainerRef
  ) {
    super(_p_prefs, _p_cd, _p_css)
  }

  ngAfterViewInit() {
    if(this._showGraphLinkContextMenuOnClick) {
      this.relationshipClick.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onLinkContextMenuClick.bind(this))
    } else {
      this.relationshipContextMenuClick.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onLinkContextMenuClick.bind(this))
    }
    if(this._showGraphEntityContextMenuOnClick) {
      this.entityClick.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onContextMenuClick.bind(this))
    } else {
      this.contextMenuClick.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onContextMenuClick.bind(this))
    }
  }

  /** @internal */
  private _graphContextMenuSub: Subscription;
  /** 
   * shows a graph context menu when triggered by an appropriate event
   * @internal 
   */
  private openGraphContextMenu(event: any, contextMenu: TemplateRef<any>) {
    this.closeGraphContextMenu();
    let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    const positionStrategy = this.overlay.position().global();
    positionStrategy.top(Math.ceil(event.eventPageY - scrollY)+'px');
    positionStrategy.left(Math.ceil(event.eventPageX)+'px');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(contextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    this._graphContextMenuSub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeGraphContextMenu());

    return false;
  }
  /**
   * closes any active graph context menu 
   * @internal 
   */
  private closeGraphContextMenu() {
    if (this._graphContextMenuSub){
      this._graphContextMenuSub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  /**
   * proxies internal graph component entity right-click to "graphContextMenuClick" event.
   */
  private onContextMenuClick(event: any) {
    if(this._showGraphNodeContextMenu) {
      this.openGraphContextMenu(event, this.graphNodeContextMenu);
    }
  }
  /** when link context click is invokes check to see if we should 
   * show the built in context menu.
  */
  private onLinkContextMenuClick(event) {
    if(this._showGraphLinkContextMenu) {
      this.openGraphContextMenu(event, this.graphLinkContextMenu);
    }
  }
  /** when the filter component's match key scope is changed from EXTRANEOUS to CORE or vice-versa */
  public onFilterMatchKeyTokenSelectionScopeChanged(scope: SzMatchKeyTokenFilterScope) {
    //console.log('sz-standalone-graph.onMatchKeyTokenSelectionScopeChanged: ', scope, this.matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.CORE, this.matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.EXTRANEOUS);
    this.matchKeyTokenSelectionScope        = scope;
    this._showExtraneousMatchKeyTokenChips  = (this.matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.EXTRANEOUS) ?  true : false;
    this._showCoreMatchKeyTokenChips        = (this.matchKeyTokenSelectionScope === SzMatchKeyTokenFilterScope.CORE) ?        true : false;

  }

  /** can a specific entity node be removed from canvas */
  public isGraphEntityRemovable(entityId: SzEntityIdentifier): boolean {
    return this.graphNetworkComponent.canRemoveNode(entityId);
  }
  /** show any entities that are related to a specific entity that are 
   * currently not on the canvas
   */
  public showGraphEntityRelationships(entityId: SzEntityIdentifier) {
    this.graphNetworkComponent.expandNode(entityId);
  }
  /** hide all visible(expanded) entities related to a specific entity
   * that are themselves not related to any other visible entities
   */
  public hideGraphEntityRelationships(entityId: SzEntityIdentifier) {
    this.graphNetworkComponent.collapseNode(entityId);
  }
  /** remove single node and any directly related nodes that are only related to the entity specified */
  public hideGraphEntity(entityId: SzEntityIdentifier) {
    this.graphNetworkComponent.removeNode(entityId);
  }
  /** the built-in graph link context menu has an option to show
   * a "Why Not" report modal on select.
   * @internal
   */
  public openWhyReportForGraphRelationship(event: any) {
    if(event && event.sourceEntityId && event.targetEntityId) {
      this.closeGraphContextMenu();
      this.dialog.open(SzWhyEntitiesDialog, {
        panelClass: 'why-entities-dialog-panel',
        data: {
          entities: [event.sourceEntityId, event.targetEntityId],
          showOkButton: false,
          okButtonText: 'Close'
        }
      });
    }
  }
}
