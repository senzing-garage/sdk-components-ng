import { Component, Input, Output, HostBinding, OnInit, ViewChild, AfterViewInit, EventEmitter, OnDestroy, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { Graph, NodeInfo, LinkInfo } from './graph-types';
import { Simulation } from 'd3-force';


import { EntityGraphService, SzEntityNetworkResponse, SzEntityNetworkData, SzFeatureMode, SzRelatedEntity, SzEntityData, SzEntityIdentifier, SzEntityPath, SzEntityIdentifiers, SzDetailLevel } from '@senzing/rest-api-client-ng';
import { map, tap, first, takeUntil, take, filter } from 'rxjs/operators';
import { Subject, Observable, BehaviorSubject, of } from 'rxjs';
import { parseSzIdentifier, parseBool, isValueTypeOfArray } from '../../common/utils';
import { SzNetworkGraphInputs, SzGraphTooltipEntityModel, SzGraphTooltipLinkModel, SzGraphNodeFilterPair, SzEntityNetworkMatchKeyTokens } from '../../../lib/models/graph';
import { SzSearchService } from '../../services/sz-search.service';

/**
 * Provides a SVG of a relationship network diagram via D3.
 * @export
 */
@Component({
  selector: 'sz-relationship-network',
  templateUrl: './sz-relationship-network.component.html',
  styleUrls: ['./sz-relationship-network.component.scss']
})
export class SzRelationshipNetworkComponent implements AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  static SOURCE_LINE_CHAR_LIMIT = 27;
  static MIN_RECORD_ID_LENGTH = 3;

  static readonly ICONS = {
    business: {
      shape: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
      enclosed: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
    }, // TODO replace the business .png with SVG
    userFemale: {
      // The outline of the face and shoulders for the female icon
      shape: "M687.543 599.771c-29.257 73.143-95.086 124.343-175.543 124.343s-146.286-51.2-175.543-117.029c-146.286 36.571-256 146.286-256 277.943v95.086h870.4v-95.086c0-138.971-117.029-248.686-263.314-285.257zM768 592.457c0 0-51.2-299.886-65.829-365.714-14.629-87.771-95.086-160.914-197.486-160.914-95.086 0-182.857 65.829-197.486 160.914-7.314 51.2-73.143 329.143-80.457 343.771 0 0 7.314 14.629 95.086-14.629 7.314 0 43.886-14.629 51.2-14.629 36.571 51.2 80.457 80.457 138.971 80.457 51.2 0 102.4-29.257 138.971-87.771 29.257 14.629 14.629 36.571 117.029 58.514zM512 599.771c-43.886 0-80.457-21.943-109.714-65.829v0c0 0-7.314-7.314-7.314-7.314s0 0 0 0-7.314-7.314-7.314-14.629c0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0-7.314 0-7.314-7.314-7.314-7.314s0 0 0 0c0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314 0-14.629 0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-21.943-14.629-43.886s7.314-43.886 14.629-51.2c0 0 7.314 0 7.314-7.314 14.629 14.629 7.314-7.314 7.314-21.943 0-43.886 0-51.2 0-58.514 29.257-21.943 80.457-51.2 117.029-51.2 0 0 0 0 0 0 43.886 0 51.2 14.629 73.143 36.571 14.629 29.257 43.886 51.2 109.714 51.2 0 0 0 0 7.314 0 0 0 0 14.629 0 29.257s0 43.886 7.314 14.629c0 0 0 0 7.314 7.314s14.629 21.943 14.629 51.2c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314 0 7.314 0 7.314 0 14.629 0 0 0 0 0 0-7.314 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0s-0 7.314-0 7.314c0 0 0 0 0 0 0 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0s-7.314 7.314-7.314 7.314v0c-29.257 43.886-73.143 65.829-109.714 65.829z",
      // The space enclosed by the face of the female icon
      enclosed: "M512 599.771c-43.886 0-80.457-21.943-109.714-65.829v0c0 0-7.314-7.314-7.314-7.314s0 0 0 0-7.314-7.314-7.314-14.629c0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0-7.314 0-7.314-7.314-7.314-7.314s0 0 0 0c0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314 0-14.629 0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-21.943-14.629-43.886s7.314-43.886 14.629-51.2c0 0 7.314 0 7.314-7.314 14.629 14.629 7.314-7.314 7.314-21.943 0-43.886 0-51.2 0-58.514 29.257-21.943 80.457-51.2 117.029-51.2 0 0 0 0 0 0 43.886 0 51.2 14.629 73.143 36.571 14.629 29.257 43.886 51.2 109.714 51.2 0 0 0 0 7.314 0 0 0 0 14.629 0 29.257s0 43.886 7.314 14.629c0 0 0 0 7.314 7.314s14.629 21.943 14.629 51.2c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314 0 7.314 0 7.314 0 14.629 0 0 0 0 0 0-7.314 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0s-0 7.314-0 7.314c0 0 0 0 0 0 0 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0s-7.314 7.314-7.314 7.314v0c-29.257 43.886-73.143 65.829-109.714 65.829z"
    },
    userMale: {
      // The outline of the face and shoulders for the male icon
      shape: "M256 48C148.5 48 60.1 129.5 49.2 234.1c-.8 7.2-1.2 14.5-1.2 21.9 0 7.4.4 14.7 1.2 21.9C60.1 382.5 148.5 464 256 464c114.9 0 208-93.1 208-208S370.9 48 256 48zm135.8 326.1c-22.7-8.6-59.5-21.2-82.4-28-2.4-.7-2.7-.9-2.7-10.7 0-8.1 3.3-16.3 6.6-23.3 3.6-7.5 7.7-20.2 9.2-31.6 4.2-4.9 10-14.5 13.6-32.9 3.2-16.2 1.7-22.1-.4-27.6-.2-.6-.5-1.2-.6-1.7-.8-3.8.3-23.5 3.1-38.8 1.9-10.5-.5-32.8-14.9-51.3-9.1-11.7-26.6-26-58.5-28h-17.5c-31.4 2-48.8 16.3-58 28-14.5 18.5-16.9 40.8-15 51.3 2.8 15.3 3.9 35 3.1 38.8-.2.7-.4 1.2-.6 1.8-2.1 5.5-3.7 11.4-.4 27.6 3.7 18.4 9.4 28 13.6 32.9 1.5 11.4 5.7 24 9.2 31.6 2.6 5.5 3.8 13 3.8 23.6 0 9.9-.4 10-2.6 10.7-23.7 7-58.9 19.4-80 27.8C91.6 341.4 76 299.9 76 256c0-48.1 18.7-93.3 52.7-127.3S207.9 76 256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256c0 43.9-15.6 85.4-44.2 118.1z",
      // The space enclosed by the face of the male icon
      enclosed: "M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"
    },
    // TODO introduce a gender-neutral person icon for when we can tell a node is a person but the gender isn't specified.
    default: {
      shape: "M256 48C148.5 48 60.1 129.5 49.2 234.1c-.8 7.2-1.2 14.5-1.2 21.9 0 7.4.4 14.7 1.2 21.9C60.1 382.5 148.5 464 256 464c114.9 0 208-93.1 208-208S370.9 48 256 48zm135.8 326.1c-22.7-8.6-59.5-21.2-82.4-28-2.4-.7-2.7-.9-2.7-10.7 0-8.1 3.3-16.3 6.6-23.3 3.6-7.5 7.7-20.2 9.2-31.6 4.2-4.9 10-14.5 13.6-32.9 3.2-16.2 1.7-22.1-.4-27.6-.2-.6-.5-1.2-.6-1.7-.8-3.8.3-23.5 3.1-38.8 1.9-10.5-.5-32.8-14.9-51.3-9.1-11.7-26.6-26-58.5-28h-17.5c-31.4 2-48.8 16.3-58 28-14.5 18.5-16.9 40.8-15 51.3 2.8 15.3 3.9 35 3.1 38.8-.2.7-.4 1.2-.6 1.8-2.1 5.5-3.7 11.4-.4 27.6 3.7 18.4 9.4 28 13.6 32.9 1.5 11.4 5.7 24 9.2 31.6 2.6 5.5 3.8 13 3.8 23.6 0 9.9-.4 10-2.6 10.7-23.7 7-58.9 19.4-80 27.8C91.6 341.4 76 299.9 76 256c0-48.1 18.7-93.3 52.7-127.3S207.9 76 256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256c0 43.9-15.6 85.4-44.2 118.1z",
      enclosed: "M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"
    }
  };
  public entityId: number | undefined;
  chart: any;
  /** whethor or not to show the tooltip */
  tooltipShowing      = false;
  graphData: any;
  /** tooltip data for entity hover */
  public toolTipEntData: SzGraphTooltipEntityModel | undefined;
  /** tooltip daata for entity relationship links */
  public toolTipLinkData: SzGraphTooltipLinkModel | undefined;
  /** data used to populate tooltip template, switched ref to either "toolTipEntData" or "toolTipLinkData" */
  public toolTipData: SzGraphTooltipEntityModel | SzGraphTooltipLinkModel | undefined;
  /** position of tooltip left relative to graph canvas */
  public toolTipPosLeft = 0;
  /** position of tooltip top relative to graph canvas */
  public toolTipPosTop = 0;

  private _loading = false;
  @Output() public get loading(): boolean {
    return this._loading;
  }
  private _rendered = false;
  @Output() public get rendered(): boolean {
    return this._rendered;
  }

  /** @internal */
  private _dataRequested  = new BehaviorSubject<boolean>(false);
  /** observeable for when new data has been requested from the api */
  public dataRequested    = this._dataRequested.asObservable();
  /** @internal */
  private _dataLoaded     = new Subject<SzNetworkGraphInputs>();
  /** observeable for when data has been updated */
  public dataLoaded       = this._dataLoaded.asObservable();
  /** @internal */
  private _requestStarted: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** observeable for when new data has been requested from the api */
  public requestStarted   = this._requestStarted.asObservable().pipe(filter((value) => value !== false));
  /** @internal */
  private _requestComplete: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** observeable stream for the event that occurs when a network api request is completed */
  public requestComplete  = this._requestComplete.asObservable().pipe(filter((value) => value !== false));
  /** @internal */
  private _renderStarted: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** Observeable stream that occurs when the rendering cycle of a graph is in progress */
  public renderStarted = this._renderStarted.asObservable().pipe(filter((value) => value !== false));
  /** @internal */
  private _renderComplete: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** observeable stream for the event that occurs when a draw operation is completed */
  public renderComplete = this._renderComplete.asObservable().pipe(filter((value) => value !== false));
  /** @internal */
  private _requestNoResults: Subject<boolean> = new BehaviorSubject<boolean>(false);
  /** observeable stream for the event that occurs when a request completed but has no results */
  public noResults = this._requestNoResults.asObservable().pipe(filter((value) => value !== false));
  /** @internal */
  private _lastPrimaryRequestParameters: {
    entityIds: SzEntityIdentifier[],
    maxDegrees: number,
    buildOut: number, 
    maxEntities: number
  } = undefined;
  /** @internal */
  private _onZoom: Subject<number> = new Subject<number>();
  /** observeable stream for when the canvas zoom level is changed */
  public onZoom: Observable<number> = this._onZoom.asObservable();

  /** Event emitter for the event that occurs when a network request is initiated*/
  @Output() onRequestStarted: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** Event emitter for the event that occurs when a network api request is completed */
  @Output() onRequestCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** Event emitter that occurs when the rendering cycle of a graph is in progress */
  @Output() onRenderStarted: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** Event emitter that occurs when the rendering cycle of a graph is in progress */
  @Output() onRenderCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** Event emitter for the event that occurs when a request completed but has no results */
  @Output() onNoResults: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** emit "onDataRequested" when data requested */
  @Output() public onDataRequested:   EventEmitter<boolean> = new EventEmitter<boolean>();
  /** Event emitter for when new data has been requested from the api */
  @Output() public onDataLoaded:      EventEmitter<SzNetworkGraphInputs> = new EventEmitter<SzNetworkGraphInputs>();
  /** emit "onDataUpdated" when data requested */
  @Output() public onDataUpdated:     EventEmitter<any> = new EventEmitter<any>();
  /** Event emitter for when the canvas zoom level is changed */
  @Output() public scaleChanged: EventEmitter<number> = new EventEmitter<number>();

  // assigned during render phase to D3 selector groups
  private svg: any;
  private svgZoom: any;
  private linkGroup: any;
  private nodeGroup: any;

  // --- used for compatibility sensing
  public isKeyLines = false;
  public isD3 = true;

  /** svg element */
  @ViewChild('graphEle', {static: false}) svgComponent: ElementRef | undefined;
  public svgElement: SVGElement | undefined;
  @ViewChild('zoomEle', {static: false}) svgZoomComponent: ElementRef | undefined;
  public svgZoomElement: SVGGElement | undefined;
  /** tooltip container element */
  @ViewChild('tooltipContainer', {static: false})
  public tooltipContainer: ElementRef | undefined;
  /** tooltip entity template */
  @ViewChild('ttEnt')  tooltipEntTemplate: | undefined;
  /** relationship link tooltip template */
  @ViewChild('ttLink') tooltipLinkTemplate: | undefined;
  /** tooltip template switchable ref */
  public toolTipTemplate: | undefined;
  /** tooltip element, child element of container with absolute pos  */
  @ViewChild('tooltip') tooltip: ElementRef | undefined;

  private _showLinkLabels: boolean = false;
  @Input() public set showLinkLabels(value: boolean) {
    this._showLinkLabels = value;
    /*
    if(value && this.linkLabel) {
      this.linkLabel.style("opacity", 1);
      // console.log('@senzing/sdk-components-ng:sz-relationship-network.setShowLinkLabels: ', value, 1);
    } else if(this.linkLabel) {
      this.linkLabel.style("opacity", 0);
      // console.log('@senzing/sdk-components-ng:sz-relationship-network.setShowLinkLabels: ', value, 0);
    } else {
      // console.log('@senzing/sdk-components-ng:sz-relationship-network.setShowLinkLabels: UNKNOWN!', this._showLinkLabels, this.linkLabel);
    }
    */
  }

  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }

  @HostBinding('class.showing-link-labels') public get showingLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @HostBinding('class.not-showing-link-labels') public get hidingLinkLabels(): boolean {
    return !this._showLinkLabels;
  }

  @Input() public set loadedData(value: SzNetworkGraphInputs) {
    if (value === undefined || value === null) {
      console.log("Undefined set value");
      return;
    }
    //this.render(value);
  }  
  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statWidth: number = 800;
  /**
   * sets the width of the component
   */
  @HostBinding('style.width.px')@Input() svgWidth: string | undefined;

  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statHeight: number = 400;
  /**
   * sets the height attribute of the svg.
   * @deprecated svg is always 100% of parent dom elements height
   */
  @HostBinding('style.height.px')@Input() svgHeight: string | undefined;

  /**
   * this matches up with the "_statWidth" and "_statHeight" to
   * content centering and dynamic scaling properties.
   * @internal
  */
  private _svgViewBox: string = '150 50 400 300';
  /**
   * sets the viewBox attribute on the svg element.
  */
  @Input() public set svgViewBox(value: string) { this._svgViewBox = value; }
  /**
   * gets the viewBox attribute on the svg element.
   */
  public get svgViewBox() { return this._svgViewBox; }

  /**
   * the preserveAspectRatio attribute on the svg element.
   * @interal
   */
  private _preserveAspectRatio: string = "xMidYMid meet";
   /**
   * sets the preserveAspectRatio attribute on the svg element.
   * used to set aspect ratio, centering etc for dynamic scaling.
   */
  @Input() public set svgPreserveAspectRatio(value: string) { this._preserveAspectRatio = value; }
  /**
   * gets the preserveAspectRatio attribute on the svg element.
   */
  public get svgPreserveAspectRatio() { return this._preserveAspectRatio; }

  private _fixDraggedNodes: boolean = true;
  /**
   * sets whether or not to fix nodes in place after dragging.
   */
  @Input() public set fixDraggedNodes(value: boolean) { this._fixDraggedNodes = value; }

  /** @internal */
  //private _forcePositionsLocked: boolean = false;
  /** @internal */
  //private _lockForceSimulationPosition: boolean = true;
  /**
   * sets whether or not to fix nodes in place or 
   * to let the force gravity/charge negotiate related node movement.
   */
  /*
  @Input() public set lockForceSimulationPosition(value: boolean) { 
    this._lockForceSimulationPosition = value;
    // if weve already rendered the graph
    // immediately set force position lock
    if(this.rendered){
      if(value == false && this._forcePositionsLocked == true) {
        this._forcePositionsLocked = value;
        this.unlockForcePosition();
      }
      this._forcePositionsLocked = value;
    }
  }*/

  /** @internal */
  private _entityIds: string[] | undefined;

  /** whether or not to re-draw on id change */
  @Input() public reloadOnIdChange = false;

  /**
   * Set the entityIds of the src entities to do discovery search around.
   */
  @Input() set entityIds(value: SzEntityIdentifier | SzEntityIdentifier[]) {
    let _changed = false;
    let _oldIds  = this._entityIds;

    if(value && typeof value === 'string') {
      if(value && value.indexOf(',')) {
        // string array
        _changed = this._entityIds != value.split(',');
        this._entityIds = value.split(',');
      } else {
        // single string
        _changed = this._entityIds != [value];
        this._entityIds = [value];
      }
    } else if(value && typeof value === 'number') {
      // single number
      _changed = this._entityIds != [ value.toString() ];
      this._entityIds = [ value.toString() ];
    } else if(value && isValueTypeOfArray(value)) {
      // passed string[] or number[].
      // we need to always convert to "string[]" or else the 
      // result wont be what we expect
      let _tempArr  = (value as unknown as string[]).map((val) => { return val.toString(); });
      _changed      = this._entityIds != _tempArr;
      this._entityIds = _tempArr;
      //console.log(`entityIds = ${value}(any[]) | ${_changed}`, this._entityIds, value, (value as unknown as []));
    } else if(value) {
      // unknown type of value
      // I guess we just.... guess??
      _changed = this._entityIds != value.toString().split(',');
      this._entityIds = value.toString().split(',');
      //console.log(`entityIds = ${value}(number[])`, value, value.toString().split(','), ((value as unknown as string[]) && (value as unknown as string[]).map));
    }
    if(this.reloadOnIdChange && this._entityIds && this._entityIds.some( (eId) => { return _oldIds && _oldIds.indexOf(eId) < 0; })) {
      this.reload( this._entityIds.map((eId) => { return parseInt(eId); }) );
    }
    //console.log('sdk-graph-components/sz-relationship-network.component: entityIds setter( '+_changed+' )', this._entityIds);
  }

  /**
   * amount of degrees of separation to populate the graph with
   */
  private _maxDegrees: number | undefined;
  @Input() set maxDegrees(value: string | number) {
    this._maxDegrees = +value;
  }
  private _buildOut: number | undefined;
  @Input() set buildOut(value: string| number) { this._buildOut = +value; }

  /** @internal */
  private _maxEntities: number | undefined;
  /** @internal */
  private _maxEntitiesPreflightLimit: number | undefined;
  /** the maximum entities to pull back from the api request */
  @Input() set maxEntities(value: string | number) { 
    this._maxEntities = parseInt(value as string); 
  }
  /** the maximum entities to pull back from the api request */
  public get maxEntities(): number {
    return this._maxEntities;
  }
  /** @internal */
  private _unlimitedMaxEntities: boolean = false;
  /** sets whether or not to ignore the value set in "maxEntities" */
  @Input() public set noMaxEntitiesLimit(value: boolean | string) {
    this._unlimitedMaxEntities = parseBool(value as string);
  }
  /** whether or not to ignore the value set in "maxEntities" */
  public get noMaxEntitiesLimit(): boolean {
    return this._unlimitedMaxEntities;
  }
  /** @internal */
  private _unlimitedMaxScope: boolean = false;
  /** sets whether or not to ignore the value set in "buildOut" */
  @Input() public set noMaxScopeLimit(value: boolean | string) {
    this._unlimitedMaxScope = parseBool(value as string);
  }
  /** whether or not to ignore the value set in "buildOut" */
  public get noMaxScopeLimit(): boolean {
    return this._unlimitedMaxScope;
  }
  /** when a preflight request completes */
  @Output() onPreflightRequestComplete: EventEmitter<any> = new EventEmitter<any>();
  /** when the initial or preflight request has the total relationships available
   * this event is emitted.
  */
  @Output() onTotalRelationshipsCountUpdated: EventEmitter<number> = new EventEmitter<number>();

  /**
   * the space between nodes
   */
  private _linkGravity = 8;
  @Input() public set linkGravity(value: number) { this._linkGravity = value; }

  /**
   * name label padding
   */
  private _labelPadding = 8;
  @Input() public set labelPadding(value: number) { this._labelPadding = value; }

  /**
   * name label ellipsis clipping
   */
   private _labelMaxLength = 15;
   @Input() public set labelMaxLength(value: number) { this._labelMaxLength = value; }  

  private _zoomEnabled = true;
  /** 
   * can only be set to false prior to render cycle. default is true .
   */
  @Input() public set zoomEnabled(value: boolean) { 
    this._zoomEnabled = value;
    if(value) {
      this.initializeZoom();
    }
  }
  /** is zooming enabled */
  public get zoomEnabled(): boolean { 
    return this._zoomEnabled !== undefined; 
  }
  /** @internal */
  private _expandByDefaultWhenLessThan: number;
  /** when this value is set, if the initial amount of relationships is 
   * less than this number than all items are unhidden by default
   */
  @Input() public set expandByDefaultWhenLessThan(value: number) {
    this._expandByDefaultWhenLessThan = value;
  }
  /** when this value is set, if the initial amount of relationships is 
   * less than this number than all items are unhidden by default
   */
  public get expandByDefaultWhenLessThan(): number {
    return this._expandByDefaultWhenLessThan;
  }
  /** @internal */
  private _ignoreFilters: boolean;
  /** if this value is set then we ignore all entity filtering regardless 
   * of whether or not the entity meets the condition
   */
  @Input() public set ignoreFilters(value: boolean) {
    this._ignoreFilters = value;
  }
  /** if this value is set then we ignore all entity filtering regardless 
   * of whether or not the entity meets the condition
   */
  public get ignoreFilters(): boolean {
    return this._ignoreFilters;
  }

  /** maximum zoom amount @internal */
  private _scaleMax = 3;
  /** maximum zoom amount allowed */
  @Input() public set maxZoom(value: number) {
    if(value > 0 && value < 10) {
      this._scaleMax = value;
    } else {
      console.warn('graph zoom cannot be less than 1 or greater than 10');
    }
  }

  /** minimum zoom amount @internal*/
  private _scaleMin = .25;
  /** maximum zoom amount allowed */
  @Input() public set minZoom(value: number) {
    if(value > 0) {
      this._scaleMin = value;
    } else {
      console.warn('graph minumum zoom cannot be less than 1');
    }
  }

  /**
   * return the raw data node in the payload
   */
  static readonly WITH_RAW: boolean = true;
  /**
   * do not return the raw data node in the payload
   */
  static readonly WITHOUT_RAW: boolean = false;

  /**
   * nulls out the browser right click menu
   * @param event
   */
  public onRightClick(event: any) {
    return false;
  }

  /**
   * emitted when the user right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user dbl-clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityDblClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user clicks a relationship link.
   * @returns object with various entity and ui properties.
   */
  @Output() relationshipClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user dbl-clicks a relationship link label.
   * @returns object with various entity and ui properties.
   */
  @Output() relationshipDblClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user right-clicks a relationship link.
   * @returns object with various entity and ui properties.
   */
  @Output() relationshipContextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the user expands or collapses a entity nodes related nodes.
   */
  @Output() onShowRelatedEntities: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the user expands or collapses a entity nodes related nodes.
   */
  @Output() onHideRelatedEntities: EventEmitter<any> = new EventEmitter<any>();

  /** @internal */
  @Input() public captureMouseWheel: boolean = false;

  /**
   * apply filters that match any specified criteria, hide all other nodes.
   * only settable through "filter" setter
   */
  private _includesFn: SzGraphNodeFilterPair | undefined;

  /**
   * filtering to apply to graph response collection.
   * only settable through "filter" setter
   */
  private _filterFn: SzGraphNodeFilterPair[] | undefined;

  /**
   * apply effect to nodes and link nodes that match any members that match
   * any of the "selectorFn" properties in fnPair.
   * @param fnPair
   */
  private _applyIncludesFn(fnPair: SzGraphNodeFilterPair) {
    const _excludedIds: number[] = [];
    const _includedIds: number[] = [];

    if(this._ignoreFilters && this.node && this.node.each) {
      // if "ignore filters" is set we just include everything
      this.node.each((element, ind) => {
        _includedIds.push( element.entityId );
      });
    } else if (fnPair && fnPair.selectorFn) {
      if( this.node && this.node.each) {
        // D3
        
        this.node.each((element, ind) => {
          let nodeMatches = fnPair.selectorFn(element);
          if(nodeMatches) {
            _includedIds.push( element.entityId );
            element.inMatchKeysFilter = true; // set prop for persistence
          } else {
            _excludedIds.push( element.entityId );
            element.inMatchKeysFilter = false; // set prop for persistence
          }
        });
      }
    }
    if(_includedIds && _includedIds.length > 0) {
      if(this.node && this.node.filter) {
        let _filteredNodes = this.node.filter((nodeData) => {
          return _includedIds.includes(nodeData.entityId);
        });
        let _unfilteredNodes = this.node.filter( (nodeData) => {
          return _excludedIds.indexOf( nodeData.entityId ) < 0;
        });
        // hide all
        this.node.style("display", 'none');
        // show included
        _filteredNodes.style("display", 'block');

        if(this.link) {
          // hide any related "link" nodes using "_excludedIds" members
          // generated from filtering function
          const _linksToShow = this.link.filter( (lNode) => {
            let _includedInGraph = (_includedIds.indexOf( lNode.sourceEntityId ) >= 0 && _includedIds.indexOf( lNode.targetEntityId ) >= 0);
            lNode.inMatchKeysFilter = _includedInGraph; // set prop for persistence
            return _includedInGraph;
          });
          if(_linksToShow && _linksToShow.style) {
            try {
              this.link.style("display", 'none'); // hide all by default
              _linksToShow.style('display', 'block'); // unhide for visible relationships
            } catch(err) {}
          }
        }
        if(this.linkLabel && this.linkLabel.filter) {
          let _includedLinkLabels = this.linkLabel.filter( (lNode) => {
            let _includedInGraph = _includedIds.indexOf( lNode.sourceEntityId ) >= 0 && _includedIds.indexOf( lNode.targetEntityId ) >= 0;
            lNode.inMatchKeysFilter = _includedInGraph; // set prop for persistence
            return _includedInGraph;
          });
          // hide all
          this.linkLabel.style("display", 'none');
          // show included
          _includedLinkLabels.style("display", 'block');
        }
      }
    } else {
      // maybe none ???
    }
    //console.log('_applyIncludesFn: ', _includedIds, _excludedIds);
  }

  /**
   * apply effect to nodes and link nodes that match any members that match
   * any of the "selectorFn" properties in fnPairArray
   * @param fnPairArray
   */
  private _applyFilterFn(fnPairArray: SzGraphNodeFilterPair[]) {
    const _excludedIds: number[] = [];
    if (fnPairArray && fnPairArray.length >= 0) {
      if( this.node && this.node.filter) {
        // --- start D3 filter
        fnPairArray.forEach( (pairFn) => {
          if(this.node && !this._ignoreFilters) {
            const _filtered = this.node.filter( pairFn.selectorFn );
            // create array of filtered entityIds to compare source/target links to
            _filtered.each( (fNode) => {
              //console.log('what the? ', fNode);
              _excludedIds.push( fNode.entityId );
            });
            if ( _filtered && pairFn && pairFn.modifierFn && pairFn.modifierFn.call) {
              // first change opacity on ALL items
              _filtered.style('display', 'none');
              // now apply special filter highlighter
              pairFn.modifierFn(_filtered);
              const _nodePaths = _filtered.select('path');
              if ( _nodePaths ) {
                pairFn.modifierFn(_nodePaths);
              }
            } else if (_filtered && pairFn && !pairFn.modifierFn) {
              _filtered.style('display', 'none');
            }
          }
        });

        // hide any related "link" nodes using "_excludedIds" members
        // generated from filtering function
        if(_excludedIds && this.link && this.link.filter ) {
          const _linksToHide = this.link.filter( (lNode) => {
            return (_excludedIds.indexOf( lNode.sourceEntityId ) >= 0 || _excludedIds.indexOf( lNode.targetEntityId ) >= 0);
          });
          if(_linksToHide && _linksToHide.style) {
            try {
              _linksToHide.style('display', 'none');
            } catch(err) {}
          }
        }
        // hide any related match keys
        // console.warn('filter match keys? ', _excludedIds);
        if(_excludedIds && this.link && this.linkLabel && this.linkLabel.filter ) {
          const _linksToHide = this.linkLabel.filter( (lNode) => {
            return (_excludedIds.indexOf( lNode.sourceEntityId ) >= 0 || _excludedIds.indexOf( lNode.targetEntityId ) >= 0);
          });
          if(_linksToHide && _linksToHide.style) {
            try {
              _linksToHide.style('display', 'none');
            } catch(err) {}
          }
        }

        // unfilter nodes not in filtered results
        if(this.node && this.node.filter) {
          let _unfilteredNodes = this.node.filter( (nodeData) => {
            return _excludedIds.indexOf( nodeData.entityId ) < 0;
          });
          _unfilteredNodes.style("display", 'block');
        }
        if(this.link && this.link.filter) {
          let _unfilteredLinks = this.link.filter( (lNode) => {
            return _excludedIds.indexOf( lNode.sourceEntityId ) < 0 && _excludedIds.indexOf( lNode.targetEntityId ) < 0;
          });
          _unfilteredLinks.style("display", 'block');
        }
        if(this.linkLabel && this.linkLabel.filter) {
          let _unfilteredLinkLabels = this.linkLabel.filter( (lNode) => {
            return _excludedIds.indexOf( lNode.sourceEntityId ) < 0;
          });
          _unfilteredLinkLabels.style("display", 'block');
        }

        // --- end D3 filter
        //console.log('_applyFilterFn: ', _excludedIds);
      }
    }

  }
  /**
   * apply effect or styles to nodes that match any of the "selectorFn" functions in fnPairArray
   * @param fnPairArray
   */
  private _applyModifierFn(fnPairArray: SzGraphNodeFilterPair[] | undefined) {

    if (fnPairArray && fnPairArray.length >= 0) {
      if(this.chart && this.chart.each) {
        /* @deprecated
        // Keylines
        const _nodes = [];
        // first convert chart nodes in to an array
        this.chart.each({ type: 'node' }, (node) => {
          _nodes.push(node);
        });
        // now filter array by selectorFns
        fnPairArray.forEach( (pairFn) => {
          const _filtered = _nodes.filter( pairFn.selectorFn );
          if(_filtered && pairFn && pairFn.modifierFn && pairFn.modifierFn.call) {
            pairFn.modifierFn(_filtered, this.chart);
          }
        });*/
      } else if( this.node && this.node.filter) {
        // D3
        fnPairArray.forEach( (pairFn) => {
          if(this.node) {
            const _filtered = this.node.filter( pairFn.selectorFn );
            if(_filtered && pairFn && pairFn.modifierFn && pairFn.modifierFn.call) {
              pairFn.modifierFn(_filtered);
              const _nodePaths = _filtered.select('path');
              if ( _nodePaths ) {
                pairFn.modifierFn(_nodePaths);
              }
            }
          }
        });
      }
    }
  }
  /**
   * add or modify data to nodes that match any of the "selectorFn" functions in fnPairArray
   * @param fnPairArray
   */
  private _applyDataFn(fnPairArray: SzGraphNodeFilterPair[]) {
    if (fnPairArray && fnPairArray.length >= 0) {
      if(this.chart && this.chart.each) {
        // TODO: implement in KL way
      } else if( this.node && this.node.filter) {
        fnPairArray.forEach( (pairFn) => {
          if(this.node) {
            const _filtered = this.node.filter( pairFn.selectorFn );
            if(_filtered && pairFn && pairFn.modifierFn && pairFn.modifierFn.call) {
              _filtered.datum( pairFn.modifierFn );
              //pairFn.modifierFn(_filtered);
            }
          }
        });
      }
    }
  }
  /**
   * set the filters to apply to the display of nodes in graph. The default is to hide any
   * nodes that return true when the selectorFn is called on the node.
   */
  @Input() public set filter(fn: SzGraphNodeFilterPair[] | SzGraphNodeFilterPair | undefined) {
    if((fn as SzGraphNodeFilterPair) && (fn as SzGraphNodeFilterPair).selectorFn) {
      // is single pair, save as single item array
      fn = [ (fn as SzGraphNodeFilterPair) ];
    }
    const oldValueAsJSON = JSON.stringify(this._filterFn);
    this._filterFn = fn as SzGraphNodeFilterPair[];
    if(oldValueAsJSON != JSON.stringify(this._filterFn)) {
      if(this._expandByDefaultWhenLessThan !== undefined && this._ignoreFilters) {
        // reset the "_ignoreFilters" parameter because it was initially set by
        // the "_expandByDefaultWhenLessThan" condition being met
        this._ignoreFilters = false;
      }
      //console.warn('SzRelationshipNetworkComponent.filter = ', JSON.stringify(this._filterFn));
      this._applyFilterFn(this._filterFn);
    }
  }
  /**
   * get the filters that are being applied to nodes.
   */
  public get filter(): SzGraphNodeFilterPair[] | SzGraphNodeFilterPair | undefined{
    return this._filterFn;
  }
  /**
   * set the includes filter to apply to the display of nodes in graph. The default is to hide any
   * nodes that do not return at least one true for the selectorFn called on the nodes in the graph. Similar to 
   * filter, but arg is a single SzGraphNodeFilterPair instead of array and is inclusionary instead of exclusionary.
   */
  @Input() public set includes(fn: SzGraphNodeFilterPair | undefined) {
    const oldValueAsJSON = JSON.stringify(this._includesFn);
    this._includesFn = fn as SzGraphNodeFilterPair;
    if(oldValueAsJSON != JSON.stringify(this._includesFn)) {
      if(this._expandByDefaultWhenLessThan !== undefined && this._ignoreFilters) {
        // reset the "_ignoreFilters" parameter because it was initially set by
        // the "_expandByDefaultWhenLessThan" condition being met
        this._ignoreFilters = false;
      }
      //console.warn('SzRelationshipNetworkComponent.includes = ', JSON.stringify(this._includesFn));
      this._applyIncludesFn(this._includesFn);
    }
  }
  /**
   * apply the filters pairs set with "includes =" or pass a set of filter pairs in and run the functions
   * on the graph data nodes. 
   */
  public applyIncludeFilters(fn: SzGraphNodeFilterPair | undefined) {
    if(fn) {
      this._includesFn = fn as SzGraphNodeFilterPair;
    }
    this._applyIncludesFn(this._includesFn);
  }
  /**
   * get the includes filters that are being applied to nodes.
   */
  public get includes(): SzGraphNodeFilterPair | undefined {
    return this._includesFn;
  }
  /** only settable through "highlight" setter */
  private _highlightFn: SzGraphNodeFilterPair[] | undefined;
  /**
   * set a style or effect to apply to the display of nodes in graph that match any
   * of the criteria set by "".
   * @example
   * SzRelationshipNetworkComponent.highlight = {selectorFn: (node) => { return node.dataSources.indexOf('MY DATASOURCE') > -1; }, modifierFn: (nodeList) => { nodeList.style('fill','orange'); }}
   */
  @Input() public set highlight(fn: SzGraphNodeFilterPair[] | SzGraphNodeFilterPair) {
    if((fn as SzGraphNodeFilterPair) && (fn as SzGraphNodeFilterPair).selectorFn) {
      // is single pair, save as single item array
      fn = [ (fn as SzGraphNodeFilterPair) ];
    }
    const oldValueAsJSON = JSON.stringify(this._highlightFn);
    this._highlightFn = fn as SzGraphNodeFilterPair[];
    if(oldValueAsJSON != JSON.stringify(this._highlightFn)) {
      this._applyModifierFn(this._highlightFn);
    }
  }
  /** only settable through "modify" setter */
  private _modifyFn: SzGraphNodeFilterPair[] | undefined;
  /**
   * set or update a property on nodes in graph that match any
   * of the criteria set by "".
   * @example
   * SzRelationshipNetworkComponent.modify = {selectorFn: (node) => { return node.dataSources.indexOf('MY DATASOURCE') > -1; }, modifierFn: (data) => { data.newProperty = true; return data; } }
   */
  @Input() public set modify(fn: SzGraphNodeFilterPair[] | SzGraphNodeFilterPair) {
    if((fn as SzGraphNodeFilterPair) && (fn as SzGraphNodeFilterPair).selectorFn) {
      // is single pair, save as single item array
      fn = [ (fn as SzGraphNodeFilterPair) ];
    }
    const oldValueAsJSON = JSON.stringify(this._modifyFn);
    this._modifyFn = fn as SzGraphNodeFilterPair[];
    if(oldValueAsJSON != JSON.stringify(this._modifyFn)) {
      this._applyDataFn(this._modifyFn);
    }
  }

  /**  the node or main selection */
  public get chartNodes() {
    return this.node;
  }
  /** the data for the nodes in this.chartNodes */
  public get chartData() {
    if(this.node && this.node.data) {
      return this.node.data();
    } else {
      return undefined;
    }
  }

  /** the current zoom amount
   * @internal*/
  private _scaleRaw: number = 1;
  /** the current zoom level of the graph */
  public get zoom(): number {
    let retVal = this._scaleRaw; 
    return retVal;
  }
  
  /** scalePerc is zoom amount on a 1-100 scale
   * calcs assume 1 == 75% so that should be default
  * @internal*/
  private _scalePerc: number = 75;
  /** the current amount the graph is scaled to. 1 - 100 value. */
  public get scale(): number {
    let retVal = this._scalePerc; 
    return retVal;
  }

/*
  not fully implemented so commented out for now

  @Input() public set scale(value: number) {
    this._scalePerc = value;
    // convert perc value above 50 to zoom value
    let units = (this._scaleMax - 1) / 50;
    let zoomValue = ((value - 50) * units) + 1; 
    if(value < 50) {
      // divide by 1 for zoom-out
      let l1units = (1 - this._scaleMin) / 50;
      // inputValue between 1-50
      zoomValue = l1units * value;
    }
    if(this._zoomTransform.k < zoomValue ) {
      //let translation = d3.zoomIdentity.translate(this._zoomTransform.x, this._zoomTransform.y).scale(8 - zoomValue).translate(-22,-13);
      let translation = d3.zoomIdentity.translate(this._zoomTransform.x, this._zoomTransform.y).scale(9 + zoomValue);
      console.log('zooming in', translation, this._zoomTransform);
    } else {
      console.log('zooming out');
    }
    this._zoomTransform.k = zoomValue;
    console.log('set scale('+ zoomValue +')', this._zoomTransform);
    //this.svgZoom.call(this._zoom.scaleTo, zoomValue);
    this._zoom.scaleTo(this.svg, zoomValue);

    //this.svgZoom.attr('transform', this._zoomTransform);
  }*/

  /**
   * If the node for an entity has related entities that aren't already iin the graph
   * @param entityId The numeric entity ID
   */
  public canExpandNode(entityId: SzEntityIdentifier): boolean {
    return false;
  }
  /**
   * Add to the chart entities immediately related to the specified entity
   * @internal
   * @param entityId The numeric entity ID
   */
  private _expandNode(d: any) {
    let relatedNodes              = this.getRelatedNodesByIdQuery(d.relatedEntities, this.node, true).filter(_rn =>  _rn.entityId !== d.entityId)
    // lets grab all visible first
    let allVisibleEntities = this.node.filter((_d) => {
      return !_d.isHidden;
    }).data().map((_rn) => {
      return _rn.entityId;
    });
    let hasCollapsedRelationships = relatedNodes.filter((_d) => {
      return _d.isHidden;
    }).size() > 0;
    d.hasCollapsedRelationships = hasCollapsedRelationships;
    if(d.hasCollapsedRelationships) {
      // we are going to flip it so that they're visible
      // store state so we can hide them later
      this.node.each((_d) => {
        d.nodesVisibleBeforeExpand = allVisibleEntities;
      });
    }
    let relatedCurrentlyHidden  = d.hasCollapsedRelationships;

    if(d.hasCollapsedRelationships) {
      // we're expanding
      relatedNodes
      .each((_d) => {
        _d.isHidden = false;
      });
      this._expandNode(d);
    }
    // we only want links to just read off of 
    // whatever the visibility is of the nodes (K.I.S.S.)
    let hiddenEntities   = [];
    this.node.each((_rn) => {
      if(_rn.isHidden) {
        hiddenEntities.push(parseInt(_rn.entityId));
      }
    });

    // for each related node make sure the node has the 
    // ".sz-graph-icon-edge-glyph-collapsed" class otherwise there will be no toggle bubble

    // lines and line labels all use the same 
    // data store, so setting "isHidden" from one 
    // will set it on the other as well
    this.link.each((_ln) => {
      let shouldBeHidden = (hiddenEntities.includes(_ln.targetEntityId) || hiddenEntities.includes(_ln.sourceEntityId));
      _ln.isHidden = shouldBeHidden;
    });

    let hiddenNodes                 = this.getHiddenNodeIds(this.node);
    this.node.each(this.updateHasCollapsedRelationships.bind(this, this.node))
    .attr('class', this.getEntityNodeClass);

    // update counts
    this.updateHiddenRelationshipCounts(this.node);

    // now do links
    this.link
    .each(this.updateIsHiddenForLinks.bind(this, hiddenNodes))
    .attr('class', this.getEntityLinkClass);
    // and labels
    if(this.linkLabel && this.linkLabel.attr) {
      this.linkLabel.attr('class', this.getEntityLinkLabelClass);
    }
    // if there are any special node modifier functions run them
    if( this._highlightFn || this._includesFn || this._filterFn || this._modifyFn) {
      // run a fn against the node list
      if ((this._filterFn && this._filterFn.length > 0) || (this._includesFn && this._includesFn.selectorArgs)) {
        this._applyFilterFn(this._filterFn);
        this._applyIncludesFn(this._includesFn);
      } else if(this._modifyFn && this._modifyFn.length > 0) {
        this._applyModifierFn(this._modifyFn);
      } else if (this._highlightFn && this._highlightFn.length > 0) {
        this._applyModifierFn(this._filterFn);
      }
    }
  }

  /**
   * Add to the chart entities immediately related to the specified entity
   * @param entityId The numeric entity ID
   */
  public expandNode(entityId: SzEntityIdentifier) {
    if(!entityId){
      return;
    }

    let _node = this.getNodeByIdQuery(entityId);
    if(_node && _node.size && _node.size() > 0) {
      _node.each((d) => {
        this._expandNode(d);
      });
    }
  }
  /** 
   * Remove any directly related entity nodes from the node specified
   * If they are themselves not related to another entity on the 
   * canvas directly.
   */
  public collapseNode(entityId: SzEntityIdentifier) { 
    if(!entityId){
      return;
    }

    let _node = this.getNodeByIdQuery(entityId);

    if(_node && _node.size && _node.size() > 0) {
      _node.each((d) => {
        this._removeNode(d, false, true);
      });
    }
  }

  /**
   * If the node for an entity can be removed from the graph
   * (e.g. the node that the graph is centered on cannot be removed)
   *
   * @param entityId The entityId of the node that might be removed
   */
  public canRemoveNode(entityId: SzEntityIdentifier): boolean {
    if(!entityId) { return false; }
    let nodeR = this.getNodeByIdQuery(entityId);
    let retVal = true;
    nodeR.each((d) => {
      if(d.isCoreNode || d.isPrimaryEntity) {
        retVal == false;
      }
    });
    return retVal;
  }
  /** 
   * gets the d3 data associated with nodes
   * @internal
   * @param nodeIds array of entityIds
  */
  private getDataForNodes(nodeIds) {
    let retValue = this.node.filter((_n) => {
      return nodeIds.includes(_n.entityId);
    }).data();
    return retValue;
  }
  /**
   * recursively traverse related entities until the end at a
   * primary or core node.
   * 
   */
  private getRelatedPaths(d): Array<any> {
    let retVal = [];
    let debugStr = '';
    let maxDepth = 20;
    let recTravRelated = (entityIds, idsAlreadyTraversed, depth) => {
      let debugPrefix = '';
      for(let i=0; i < depth; i++) { debugPrefix = debugPrefix +'\t';}

      // we only want data for nodes we havent already traversed
      // this is so we dont PING-PONG between two related nodes
      let retData = this.getDataForNodes(entityIds).filter((rn) => {
        return !idsAlreadyTraversed.includes(rn.entityId);
      })
      // add current related to already traversed list
      idsAlreadyTraversed = idsAlreadyTraversed.concat(retData.map((rn) => { return rn.entityId; }));
      // are any of these related nodes the core node
      // if so stop traversal
      let isAnyCoreNode = retData.some((rn) => { 
        return (rn.isPrimaryEntity || rn.isCoreNode); 
      })
      //console.log(debugPrefix+`[${entityIds.join(',')}]: has core?`, isAnyCoreNode);
      //console.log(debugPrefix+'already traversed:', idsAlreadyTraversed);
      //console.log(debugPrefix+`data: `, retData);
      if(depth >= maxDepth || isAnyCoreNode) {
        retData = retData.map((rnd) => {
          return rnd && rnd.entityId;
        });
        if(isAnyCoreNode) { retData.unshift(true); }
        return retData;
      }
      // if first level of depth
      // else if we have no corenode
      let retValue = retData.map((rn) => {
        return [rn.entityId].concat(recTravRelated(rn.relatedEntities,  idsAlreadyTraversed, depth+1).flat());
      });
      return retValue;
      //return isAnyCoreNode ? retData : recTravRelated( retData.map((rn) => { return rn.entityId; }), idsAlreadyTraversed, depth+1 );
    }

    retVal = recTravRelated(d.relatedEntities, [], 1);
    return retVal;
  }

  /** get an array of arrays, each item representing all the nodes
   * along a given path that can be traced back to a core/primary node
   */
  private getRelatedPathsThatConnectToSource(d) {
    let retVal = []
    let relPaths = this.getRelatedPaths(d);

    /** I have no idea how this is doing the RIGHT thing
     * but it is. I need to go back overrr this?? maybe? 
     */
    return relPaths.filter((pathArrOrValue) => {
      return pathArrOrValue && pathArrOrValue === true;
      //return pathArrOrValue && pathArrOrValue === true || (pathArrOrValue && pathArrOrValue.includes ? pathArrOrValue.includes(true) : false);
      //return pathArr && pathArr.includes ? pathArr.includes(true) : false;
    });
    //.map((pathArr) => {
      // strip out "true"
    //  return pathArr && pathArr.filter && pathArr.filter((_pathNode)=> { return _pathNode !== true; })
    //});
  }

  /**
   * Remove a node
   * Any nodes that are no longer connected to any anchor nodes are removed in a cascade.
   * 
   * @internal
   * @param removeSource remove the source node from canvas. defaults to false
   * @param removeDependents will remove all related nodes not connected to another node that is connected to 
   * a source/primary node.
   */
  private _removeNode(d: any, removeSource: boolean = false, removeDependents?: boolean) {
    let relatedNodes              = this.getRelatedNodesByIdQuery(d.relatedEntities, this.node, true)
    .filter(_rn =>  _rn.entityId !== d.entityId && !_rn.isPrimaryEntity && !_rn.isRelatedToPrimaryEntity)

    //let relatedNodesInPathToSource    = this.getRelatedPathsThatConnectToSource(d).flat();
    let relatedNodesInPathToSource    = this.getRelatedPathsThatConnectToSource(d);
    let relatedNodesThatCanBeRemoved  = relatedNodes.filter((_rn) => {
      return !relatedNodesInPathToSource.includes(_rn.entityId);
    });
    //console.log('related nodes that can be removed: ',relatedNodesThatCanBeRemoved, relatedNodesInPathToSource);

    if(relatedNodesThatCanBeRemoved.size() === 0 || removeSource) {
      // if there are no related nodes that can be hidden
      // just hide the node itself
      d.isHidden = true;
    }
    if(removeDependents) {
      relatedNodesThatCanBeRemoved.each((_d) => {
        _d.isHidden = true;
      });
    }

    // we only want links to just read off of 
    // whatever the visibility is of the nodes (K.I.S.S.)
    let hiddenEntities   = [];
    this.node.each((_rn) => {
      if(_rn.isHidden) {
        hiddenEntities.push(parseInt(_rn.entityId));
      }
    });

    // for each related node make sure the node has the 
    // ".sz-graph-icon-edge-glyph-collapsed" class otherwise there will be no toggle bubble

    // lines and line labels all use the same 
    // data store, so setting "isHidden" from one 
    // will set it on the other as well
    this.link.each((_ln) => {
      let shouldBeHidden = (hiddenEntities.includes(_ln.targetEntityId) || hiddenEntities.includes(_ln.sourceEntityId));
      _ln.isHidden = shouldBeHidden;
    });

    let hiddenNodes                 = this.getHiddenNodeIds(this.node);
    this.node.each(this.updateHasCollapsedRelationships.bind(this, this.node))
    .attr('class', this.getEntityNodeClass);

    // update counts
    this.updateHiddenRelationshipCounts(this.node);

    // now do links
    this.link
    .each(this.updateIsHiddenForLinks.bind(this, hiddenNodes))
    .attr('class', this.getEntityLinkClass);
    // and labels
    if(this.linkLabel && this.linkLabel.attr) {
      this.linkLabel.attr('class', this.getEntityLinkLabelClass);
    }
  }

  /**
   * Remove a single node. does not remove connected dependents. *
   * @param entityId The ID of the node being removed
   */
  public removeNode(entityId: SzEntityIdentifier) {
    if(!entityId) { return; }
    let nodeR = this.getNodeByIdQuery(entityId);
    if(nodeR && nodeR.size && nodeR.size() > 0) {
      nodeR.each((d) => {
        this._removeNode(d, true);
      })
    }
  }

  /** main D3 selection entity nodes */
  node: d3.Selection<SVGElement, any, any, any> | undefined;
  /** text names that appear under entity nodes */
  nodeLabel: d3.Selection<any, any, any, any> | undefined;
  /** main D3 selection for relationship lines */
  link: d3.Selection<SVGPathElement, any, any, any> | undefined;
  /** D3 selection for text labels on relationship lines */
  linkLabel: d3.Selection<SVGTextElement, any, any, any> | undefined;
  /** d3 force plugin ref */
  forceSimulation: Simulation<NodeInfo, LinkInfo> | undefined;
  linkedByNodeIndexMap;

  /** D3 zoom plugin set in constructor
   * @internal*/
  private _zoom: d3.ZoomBehavior<Element, unknown> | undefined;

  constructor(
    private graphService: EntityGraphService,
    private searchService: SzSearchService,
  ) {
    this.linkedByNodeIndexMap = {};
    /** set up eventing proxies */
    this.requestStarted.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onRequestStarted.emit(value) });
    this.requestComplete.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onRequestCompleted.emit(value) });
    this.renderStarted.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onRenderStarted.emit(value) });
    this.renderComplete.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onRenderCompleted.emit(value) });
    this.dataRequested.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onDataRequested.emit(value) });
    this.dataLoaded.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onDataLoaded.emit(value) });
    this.noResults.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((value) => { this.onNoResults.emit(value) });
  }

  /** since the user can set zoom to false and then "true" we need a way to 
   * optionally enable zoom.
   */
  private initializeZoom() {
    if(!this._zoom) {
      // set up pan/zoom
      this._zoom = d3.zoom()
      .scaleExtent([this._scaleMin, this._scaleMax])
      .on('zoom', this._onZoomed.bind(this));

      // proxy publish zoom changes
      this.onZoom.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(e => this.scaleChanged.emit(this._scalePerc));

      // add Pan and Zoom
      if(this.svg && this.svg.call && this.svgZoom && this._zoom) {
        this.svg
        .call(this._zoom);
      }
    }
    this.center();
  }

  /** make network request and populate svg */
  ngAfterViewInit() {
    // get dom element reference to svg tag
    // console.warn('SzRelationshipNetworkComponent.ngAfterViewInit: what kind of element is svgComponent? ', this.svgComponent);
    if(this.svgComponent) this.svgElement = (this.svgComponent.nativeElement as SVGSVGElement);
    if(this.svgZoomComponent) this.svgZoomElement = (this.svgZoomComponent.nativeElement as SVGGElement);
    this.toolTipTemplate = this.tooltipEntTemplate;

    if (this._entityIds === undefined || this._entityIds.length === 0) {
      console.warn("SzRelationshipNetworkComponent.ngAfterViewInit: No EntityIDs passed in to " + this);
      return;
    }

    if(this._entityIds) {
      let _maxEntities  = this._unlimitedMaxEntities ? 40000 : this._maxEntities;
      let _maxBuildOut  = this._unlimitedMaxScope ? 10 : this._buildOut;

      this.getNetwork(this._entityIds, this._maxDegrees, _maxBuildOut, _maxEntities).pipe(
        takeUntil(this.unsubscribe$),
        first(),
        map( this.asGraphInputs.bind(this) ),
        tap( (gdata: SzNetworkGraphInputs) => {
          //console.warn('SzRelationshipNetworkGraph: g1 = ', gdata);
          if(gdata && gdata.data && gdata.data.entities && gdata.data.entities.length == 0) {
            this._requestNoResults.next(true);
          }
          let totalEntities = 0;
          if(gdata && gdata.data) {
            let entitiesById = new Set();
            (gdata.data as SzEntityNetworkData).entities.forEach((_rEntData: SzEntityData) => {
              // for each entity 
              entitiesById.add(_rEntData.resolvedEntity.entityId);
              //entitiesById[_rEntData.resolvedEntity.entityId] = 1;
              if(_rEntData && _rEntData.relatedEntities && _rEntData.relatedEntities.forEach) {
                _rEntData.relatedEntities.forEach((_rEntRel) => {
                  entitiesById.add(_rEntRel.entityId);
                });
              }
            });
            totalEntities = entitiesById.size;
            this.onTotalRelationshipsCountUpdated.emit(totalEntities);
          }
          if(this._expandByDefaultWhenLessThan > 0 && totalEntities > 0 && totalEntities <= this._expandByDefaultWhenLessThan) {
            this._ignoreFilters = true;
          }
          this._dataLoaded.next(gdata);
          this._requestComplete.next(true);
        })
      ).subscribe( this.render.bind(this) );
    }
    /** set up pan and zoom if enabled */
    if(this._zoomEnabled) {
      this.initializeZoom();
    }
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * make graph network request using input parameters
   */
  private getNetwork(entityIds: SzEntityIdentifier[], maxDegrees: number, buildOut: number, maxEntities: number) {
    let _lastPrimaryRequestParameters = {
      entityIds: entityIds,
      maxDegrees: maxDegrees,
      buildOut: buildOut,
      maxEntities: maxEntities
    }
    let _parametersChanged = false;
    let _noLastRequestParameters = this._lastPrimaryRequestParameters ? false : true;
    if(
      this._lastPrimaryRequestParameters && (
      this._lastPrimaryRequestParameters.entityIds !== _lastPrimaryRequestParameters.entityIds ||
      this._lastPrimaryRequestParameters.maxDegrees !== _lastPrimaryRequestParameters.maxDegrees || 
      this._lastPrimaryRequestParameters.buildOut !== _lastPrimaryRequestParameters.buildOut || 
      this._lastPrimaryRequestParameters.maxEntities !== _lastPrimaryRequestParameters.maxEntities
    )) {
      _parametersChanged = true;
    }

    let _hasEntityIds = ((entityIds && entityIds.length > 0 && _parametersChanged) || 
    (entityIds && entityIds.length > 0 && _noLastRequestParameters));

    /*console.log(`getNetwork(${entityIds},${maxDegrees},${buildOut},${maxEntities} | ${this.maxEntities}) | ${this._unlimitedMaxEntities}`, 
    _parametersChanged, _hasEntityIds, entityIds, entityIds.length,
    (entityIds && entityIds.length > 0 && _parametersChanged),
    (entityIds && entityIds.length > 0 && _noLastRequestParameters));*/

    this._lastPrimaryRequestParameters = _lastPrimaryRequestParameters;
    if(
      entityIds && entityIds.length > 0 && _parametersChanged || 
      entityIds && entityIds.length > 0 && _noLastRequestParameters) 
    {
      if(console.time){
        try {
          console.time('graph data')
        }catch(err){}
      }
      this._requestStarted.next(true);
      this._dataRequested.next(true);
      return this.graphService.findEntityNetwork(
        entityIds,
        undefined,
        maxDegrees,
        buildOut,
        maxEntities,
        SzDetailLevel.SUMMARY,
        SzFeatureMode.NONE,
        false,
        false,
        false, 
        SzRelationshipNetworkComponent.WITHOUT_RAW).pipe(
          tap(() => {
            if(console.time){
              try {
                console.timeEnd('graph data')
              }catch(err){}
            }
          })
        ) ;
    } else if(!(entityIds && entityIds.length > 0) || !entityIds) {
      throw new Error('entity ids are required to make "findEntityNetwork" call.');
    } else {
      console.log('getNetwork() no refresh');
      throw new Error('parameters have not changed');
    }
  }

  private getNextLayerForEntities(_entityIds: SzEntityIdentifier[], relationSource?: SzEntityIdentifier) {
    //console.log("getNextLayerForEntities: ",_entityIds);
    if(_entityIds && _entityIds.push && relationSource){
      _entityIds.push(relationSource);
    }
    if(console.time){
      try {
        console.time('graph expand')
      }catch(err){}
    }
    return this.graphService.findEntityNetwork(
      _entityIds,
      undefined,
      1,
      0,
      100,
      SzDetailLevel.SUMMARY,
      SzFeatureMode.NONE,
      false,
      false,
      false,
      SzRelationshipNetworkComponent.WITHOUT_RAW).pipe(
        tap(() => {
          if(console.time){
            try {
              console.timeEnd('graph expand')
            }catch(err){}
          }
        })
      );
  }

  /** zoom in to the graph relative to current position */
  public zoomIn() {
    if(this._zoom && this._zoom.scaleBy) {
      this._zoom.scaleBy(this.svg.transition().duration(750), 2);
    }
  }
  /** zoom out of the graph relative to current position */
  public zoomOut() {
    if(this._zoom && this._zoom.scaleBy) {
      this._zoom.scaleBy(this.svg.transition().duration(750), 1 / 2);
    }
  }

  /** main render lifecycle method */
  public render(gdata: SzNetworkGraphInputs) {
    if(console.time){
      try {
        console.time('graph render')
      }catch(err){}
    }
    this._renderStarted.next(true);
    //console.log('@senzing/sdk-components-ng/sz-relationship-network.render(): ', gdata, this._filterFn);
    this.loadedData = gdata;
    this.addSvg(gdata);
    // publish out event
    this._renderComplete.next(true);
    // if we have filters apply them
    if( this._filterFn && this._filterFn.length > 0) {
      this._applyFilterFn(this._filterFn);
    }
    // if we have modifiers apply them
    if( this._modifyFn && this._modifyFn.length > 0) {
      this._applyDataFn(this._modifyFn);
    }
    // if we have highlighters apply them
    if( this._highlightFn && this._highlightFn.length > 0) {
      this._applyModifierFn(this._highlightFn);
    }
    // if we have "includes" selectors apply them
    if( this._includesFn && this._includesFn.selectorFn) {
      this._applyIncludesFn(this._includesFn);
    }
    // add Pan and Zoom
    if(this.svg && this.svg.call && this.svgZoom && this._zoom) {
      this.svg
      .call(this._zoom);
    }
  }

  /** re-render if already loaded */
  public reload(entityIds?: SzEntityIdentifier | SzEntityIdentifier[]): void {
    if(entityIds && entityIds !== undefined) {
      this.entityIds = entityIds;
    }
    
    if(this.svgZoom && this.svgZoom.selectAll) {
      this.svgZoom.selectAll('*').remove();
    }

    if(this._entityIds) {
      this._requestStarted.next(true);
      this._dataRequested.next(true);
      let _maxEntities      = this._unlimitedMaxEntities ? 40000 : this._maxEntities;
      let _maxEntitiesLimit = this._unlimitedMaxEntities ? (this._maxEntitiesPreflightLimit !== undefined ? this._maxEntitiesPreflightLimit : 40000) : this.maxEntities;
      //console.warn('@senzing/sdk-components-ng/sz-relationship-network.reload(): ', this._entityIds, _maxEntitiesLimit, this._unlimitedMaxEntities);

      this.getNetwork(this._entityIds, this._maxDegrees, this._buildOut, _maxEntities).pipe(
        takeUntil(this.unsubscribe$),
        first(),
        map( this.asGraphInputs.bind(this) ),
        tap( (gdata: SzNetworkGraphInputs) => {
          //console.log('SzRelationshipNetworkGraph: g1 = ', gdata);
          if(gdata && gdata.data && gdata.data.entities && gdata.data.entities.length == 0) {
            this._requestNoResults.next(true);
          }
          // send requestComplete
          this._requestComplete.next(true);
          this._dataLoaded.next(gdata);
        })
      ).subscribe( this.render.bind(this) );
    }
  }
  /** take the result from getNetwork and transpose to SzNetworkGraphInputs class  */
  asGraphInputs(graphResponse: SzEntityNetworkResponse) : SzNetworkGraphInputs {
    const _showLinkLabels = this.showLinkLabels;
    return new class implements SzNetworkGraphInputs {
      data = graphResponse.data; // SzEntityNetworkData
      showLinkLabels = _showLinkLabels;
    };
  }

  private _tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

  public center() {
    if(this.svgZoom) {
      let dims    = this.svgElement.getBoundingClientRect();
      let width   = dims.width;
      let height  = dims.height;
      let centerX = width / 2;
      let centerY = height / 2;
      this.svgZoom.attr("transform",`translate(${centerX},${centerY})`);
      let _t      = d3.zoomIdentity.translate(centerX, centerY);
      this.svg.call(this._zoom.transform, _t);
      //console.log('center: ', dims, _trans, _t);
    }
  }

  public getBoundingBoxForCanvas(){
    let positionMax = [0,0,1000,1000];
    this.node.each((_node) => {

    })
    console.log('getBoundingBoxForCanvas: ', this.graphData, positionMax);
  }

  /** render svg elements from graph data */
  addSvg(gdata: SzNetworkGraphInputs, parentSelection = d3.select("body")) {
    if(!this.svgElement) {
      console.warn('PANIC AT THE DISCO!! no svg element found!!!', this.svgElement );
      return;
    }
    let graph = this.addLinksToNodeData( this.asGraph( gdata ) );
    this._tooltip = parentSelection
      .append("div")
      .attr("class", "sz-graph-tooltip")
      .style("opacity", 0);

    // Add the SVG to the HTML body
    this.svg      = d3.select( this.svgElement );
    this.svgZoom  = d3.select( this.svgZoomElement );
    var hiddenNodes; // this has to be a var outside of fn's so they can hoist value

    //console.log('@senzing/sdk-components-ng:sz-relationship-network.addSvg', gdata, graph);

    // ------------------------------------- start utility functions -------------------------------------
    let getNodeVisibilityClass = (_d) => {
      return _d.isHidden ? ['sz-node-state-hidden'] : []
    }
    let setNodePositionsAsCircle = (circleDiameter, nodes, anchorX = 0, anchorY = 0) => {
      // invisible circle for placing nodes
      var _circle = this.svgZoom.append("path")
      .attr("d", describeArc(anchorX, anchorY, circleDiameter, .1, 360))
      .style("fill", "#f5f5f5")
      .style("opacity","0.5")
      .style("display","none");

      if(nodes && nodes.size) {
        let numberOfNodes = nodes.size();
      
        nodes.each((_n, _j) => {
          let positionOnCircumference: SVGPoint = circleCoord(_n, _circle, _j, numberOfNodes, circleDiameter);
          _n.position = positionOnCircumference;
          _n.x       = _n.position.x;
          _n.y       = _n.position.y;
        });
      }
      // now cleanup by removing old circle glyph (used for path arc calc)
      if(_circle && _circle.remove) _circle.remove()
    }
    let applyPositionToNodes = (_nodes) => {
      if(_nodes) {
        _nodes
        .attr('x', (_d) => { return _d.x; })
        .attr('y', (_d) => { return _d.y; })
        .attr('transform', (_d) => {
          return `translate(${_d.x ? _d.x : 0},${_d.y ?  _d.y : 0})`;
        });
      }
    }
    let updateLinksForNodes = (_nodes) => {
      let _entityIds  = _nodes.data().map((_d) => { return _d.entityId; });
      let lnk         = this.link.filter(
        (l) => { 
          return _entityIds.indexOf(l.sourceEntityId) > -1 || _entityIds.indexOf(l.targetEntityId);
        });
      
      lnk.attr('d', this.onLinkEntityPositionChange.bind(this));
    }
    let attachEventListenersToNodes   = (_nodes, _tooltip, _labels?, _scope?: any) => {
      _scope  = _scope ? _scope : this;
      // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
      if(_nodes && _nodes.on) {
        _nodes.on('mouseover.tooltip', function (d,j) {
          _tooltip.transition()
            .duration(300)
            .style("opacity", .8);
          _tooltip.html(SzRelationshipNetworkComponent.nodeTooltipText(d))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 10) + "px");
        })
        /*.on('mouseover.fade', this.fade(0.1).bind(_scope))*/
        .on("mouseout.tooltip", function () {
          _tooltip.transition()
            .duration(100)
            .style("opacity", 0);
        })
        /*.on('mouseout.fade', this.fade(1).bind(_scope))*/
        .on("mousemove", function () {
          _tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('click', this.onNodeClick.bind(_scope))
        .on('dblclick', this.onNodeDblClick.bind(_scope))
        .on('contextmenu', this.onNodeContextClick.bind(_scope));

        // drag n drop
        this.node
          .call(d3.drag()             // TODO Update dragging code to use v5 conventions for event listening
            //.on("start", this.onNodeDragStarted.bind(_scope))
            .on("drag", this.onNodeDragged.bind(_scope)));
            //.on("end", this.onNodeDragEnded.bind(_scope)));
      }
      let _nodesWithCollapsibleRelationships = _nodes.filter(d => !d.allRelatedEntitiesOnDeck || d.hasCollapsibleRelationships || (d.hasRelatedEdges && d.numberRelated > 1));
      // bind click evt to expand bubble
      _nodesWithCollapsibleRelationships
      .select(".sz-graph-icon-edge-toggle")
      .on("click", onExpandCollapseClick.bind(this))
      // bind click evt to "+" and "-" glyphs
      _nodes      //.filter(d => !d.allRelatedEntitiesOnDeck || d.hasCollapsedRelationships)
      .select(".sz-graph-icon-edge-glyph")
      .on("click", onExpandCollapseClick.bind(this));

      //sz-graph-icon-edge-glyph sz-graph-icon-edge-glyph-collapsed

      // allow user to toggle ellipsis
      if(_labels && _labels.on) {
        _labels.on('click', this.onLabelClick.bind(_scope));
        _labels.on('mouseover', this.onLabelMouseOver.bind(_scope));
        _labels.on('mouseout', this.onLabelMouseOut.bind(_scope));
      }
    }
    let stopEventListenersForNodes    = (_nodes, _labels?) => {
      if(_nodes && _nodes.on) {
        _nodes.on('mouseover.tooltip', null)
        .on('mouseover.fade', null)
        .on("mouseout.tooltip", null)
        .on('mouseout.fade', null)
        .on("mousemove", null)
        .on('click', null)
        .on('dblclick', null)
        .on('contextmenu', null);
        // drag n drop
        _nodes.on("start", null)
        .on("drag", null)
        .on("end", null);
      }
      if(_labels && _labels.on) {
        _labels.on('click', null);
        _labels.on('mouseover', null);
        _labels.on('mouseout', null);
      }
    }
    let attachEventListenersToLinks = (_links, _labels, _tooltip, _scope?: any) => {
      _scope  = _scope ? _scope : this;
      if(_links && _links.on) {
        //_links.on('mouseover.fade', this.linkFade(0.1).bind(_scope))
        _links.on('mouseover.tooltip', function (d) {
          _tooltip.transition()
            .duration(300)
            .style("opacity", .8);
          _tooltip.html(SzRelationshipNetworkComponent.linkTooltipText(d))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 10) + "px");
        })
        .on("mouseout.tooltip", function () {
          _tooltip.transition()
            .duration(100)
            .style("opacity", 0);
        })
        /*.on('mouseout.fade', this.linkFade(1).bind(_scope))*/
        .on("mousemove", function () {
          _tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('contextmenu', this.onLinkContextClick.bind(this))
        .on('click', this.onLinkClick.bind(this))
        .on('dblclick', this.onLinkDblClick.bind(this));
      }
      if(_labels && _labels.on) {
        _labels
        .on('mouseover.tooltip', function (d) {
          _tooltip.transition()
            .duration(300)
            .style("opacity", .8);
          _tooltip.html(SzRelationshipNetworkComponent.linkTooltipText(d))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 10) + "px");
        })
        .on("mouseout.tooltip", function () {
          _tooltip.transition()
            .duration(100)
            .style("opacity", 0);
        })
        .on('contextmenu', this.onLinkContextClick.bind(this))
        .on('click', this.onLinkClick.bind(this))
        .on('dblclick', this.onLinkDblClick.bind(this));
      }
    }
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    }
    // draws a path in a circle to be used for laying out items
    // in a circle along a path
    function describeArc(x, y, radius, startAngle, endAngle){
        var start = polarToCartesian(x, y, radius, endAngle);
        var end = polarToCartesian(x, y, radius, startAngle);
    
        var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    
        var d = [
            "M", start.x, start.y, 
            "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
            "L", x,y,
            "L", start.x, start.y
        ].join(" ");
    
        return d;       
    }
    // evenly space nodes along arc
    var circleCoord = function(node, circle, index, num_nodes, circleDiameter?: number): SVGPoint {
      // we take alittle bit off the end otherwise itll count the last part of the path
      // which goes from the center to the outer circumference of the circle
      var circumference = circle.node().getTotalLength() - (circleDiameter ? circleDiameter * 2 : 0); 
      var pointAtLength = function(l){return circle.node().getPointAtLength(l)};
      var sectionLength = (circumference)/num_nodes;
      var position = sectionLength*index+sectionLength/2;
      return pointAtLength(circumference-position)
    }
    let getRingSchemaForNodes = (_nodes: d3.Selection<SVGElement, any, any, any>, minimumRingDiameter = 200, spacing = 100, averageItemWidth?: number): Array<{index: number, diameter: number, itemCount?: number, nodes: d3.Selection<SVGElement, any, any, any>}> => {
      //let minCircleDiameter = 200;
      let ringSpacing       = spacing ? spacing : 100;
      let avgItemWidth      = (100 / 2);
      let circlesToDraw     = [];
      let lastPluckedIndex  = 0;
      let ringCalcComplete  = false;
      let ringIndex         = 1;

      while(!ringCalcComplete) {
        // for each circle start with the base diameter
        // and add +2 entityGlyph widths/heights to diameter
        let _circDiameter       = minimumRingDiameter + (((ringSpacing*2) * ringIndex));
        let _circCircumference  = Math.PI * _circDiameter;
        // now create a selection that has just the nodes that 
        // should be drawn on the circles path
        let _itemsThatWillFitOnPath = Math.floor(_circCircumference / avgItemWidth);
        let _nodesToPosition = _nodes
        .filter((_n, _j) => {
          return _j >= lastPluckedIndex && _j < (lastPluckedIndex + _itemsThatWillFitOnPath);
        });
        // update last plucked index so we get correct sizes
        lastPluckedIndex    = lastPluckedIndex + _nodesToPosition.size();
        // now add an entry to circles to draw
        circlesToDraw.push({index: ringIndex, diameter: _circDiameter, itemCount: _itemsThatWillFitOnPath, nodes: _nodesToPosition});
        ringCalcComplete = _nodes
        .filter((_n, _j) => {
          return _j >= lastPluckedIndex;
        }).size() <= 0;
        if(circlesToDraw.length > 20) { 
          ringCalcComplete = true; // estop
        }
        ringIndex = ringIndex+1;
      }
      return circlesToDraw
    }
    // takes a collection of entities and lays them out in increasing diameter along rings around an X and Y origin.
    let drawNodesInRings = (_nodes: d3.Selection<SVGElement, any, any, any>, minimumRingSize?: number, x?: number, y?: number): Array<{index: number, diameter: number, itemCount?: number, nodes: d3.Selection<SVGElement, any, any, any>}> => {
      let optimalRingMinimumDiameter = minimumRingSize ? minimumRingSize : undefined;
      if(!optimalRingMinimumDiameter) {
        // auto-set the optimal starting ring diameter
        // if no value passed to fn
        let numberOfItems = _nodes && _nodes.size ? _nodes.size() : -1;
        if(numberOfItems > 500) {
          optimalRingMinimumDiameter = 600;
        } else if(numberOfItems > 100) {
          optimalRingMinimumDiameter = 400;
        } else if(numberOfItems > 50) {
          optimalRingMinimumDiameter = 200;
        } else {
          optimalRingMinimumDiameter = 100;
        }
      }
      let circlesToDraw = getRingSchemaForNodes(_nodes, optimalRingMinimumDiameter);
      // for each circle set X,Y for items that belong to that ring
      circlesToDraw.forEach((circleDef: {index: number, diameter: number, itemCount?: number, nodes: d3.Selection<SVGElement, any, any, any>}) => {
        let _randomColor  = Math.floor(Math.random()*16777215).toString(16);
        /*let _circle       = this.svgZoom.append("path")
        .attr("d", describeArc(0, 0, circleDef.diameter, .1, 360))
        .style("fill", "#"+ _randomColor)
        .style("opacity","0.5")
        .lower();*/
        //.style("display","none");
        setNodePositionsAsCircle(circleDef.diameter, circleDef.nodes, x, y);
      });
      applyPositionToNodes(_nodes);
      //console.log('Ring Calculation: ', circlesToDraw, optimalRingMinimumDiameter, _nodes.size());
      return circlesToDraw;
    }
    // -------------------------------------- end utility functions --------------------------------------

    let getMatchKeyLabel = (_linkData) => {
      let retValue = _linkData.matchKey + '['+ _linkData.matchKeyTokens +']';
      if(_linkData.matchKeyTokens && _linkData.matchKeyTokens.length > 0) {
        // tokenize list
        retValue = _linkData.matchKeyTokens.map((_v) => { return (_v && _v.replace) ? _v.replace(/_/g,' '): _v;}).join(', ');
      }
      return retValue;
    }

    let drawLinks = (_linkData) => {
      // Add link groups (line + label)
      if(!this.linkGroup) {
        this.linkGroup = this.svgZoom.selectAll('.sz-graph-link')
        .data(_linkData)
      } else {
        this.linkGroup = this.linkGroup.data(_linkData)
      }

      // clear out any existing links
      if( this.link ) {
        this.link.remove();
      }

      // Add the lines
      let _links      = this.linkGroup.join('path')
        //.attr('class', (d: any) => d.isCoreLink ? 'sz-graph-core-link' : 'sz-graph-link')
        .attr('class', this.getEntityLinkClass.bind(this))
        .attr('dy', 0)
        .attr('dx', 0)
        .attr('id', (d: any) => d.id); // This lets SVG know which label goes with which line

      // clear out any existing links
      if( this.linkLabel ) {
        this.linkLabel.remove();
      }
      // Add link labels
      let _linkLabels = this.linkGroup.join('g')
      .attr('class', 'sz-graph-link-label')
      .attr('y', 0)
      .attr('x', 0)
      .each(function(d, i) {
        let mkVertInc = 0;        
        let mkNodes = d3.select(this).selectAll('g.sz-graph-link-label')
        .data(d.matchKeyTokensFlat)
        .enter();

        let _newLabels = mkNodes.append('svg:text')
        .attr('text-anchor', 'middle')
        .attr('class', 'sz-graph-link-label-text');

        let _newLabelsText = _newLabels.append('textPath')
          .attr('class', (_d: any) => _d.isCoreLink ? 'sz-graph-core-link-text' : 'sz-graph-link-text')
          .attr('startOffset', '50%')
          .attr('xlink:href', (_d: any) => '#' + d.id) // This lets SVG know which label goes with which line
          .text((mkToken) => {
            return mkToken as string;
          });

        // take a sample bounding box
        // so we can read the height of the text nodes
        let _linkLabelTextSize    = 10;
        let _linkLabelLineHeight  = 15;
        let _linkLabelBBoxAry: any[] = [];
        if(_newLabelsText) {
          _newLabelsText.each(function (d, i) {
            _linkLabelBBoxAry[i] = this.getBBox();
          });
          if(_linkLabelBBoxAry && _linkLabelBBoxAry[ 0 ] && _linkLabelBBoxAry[ 0 ].height > 5 && _linkLabelBBoxAry[ 0 ].height < 20) {
            _linkLabelTextSize    =  Math.ceil(_linkLabelBBoxAry[ 0 ].height);
            _linkLabelLineHeight  = _linkLabelTextSize + 5;
          }
        }
        // now that we have the line height
        // place the link labels vertically on the line
        _newLabels.attr('dy', function(mkNode, mki){
            let retVal = d.matchKeyTokensFlat.length <= 1 ? 
            ((_linkLabelTextSize-1) / 2) : 
            (mki * _linkLabelLineHeight) - 
            parseInt( 
              d.matchKeyTokensFlat.length <= 1 ? 
                (_linkLabelTextSize / 2)  : 
                (
                  (d.matchKeyTokensFlat.length*_linkLabelLineHeight / 2) - _linkLabelLineHeight
                ) as any 
            );
            return retVal;
          })
          .attr('dx', 0)
      })

      return {
        link: _links,
        label: _linkLabels,
        group: this.linkGroup
      }
    }

    let drawNodes = (_nodeData) => {
      if(!this.nodeGroup) {
        this.nodeGroup = this.svgZoom.selectAll('.sz-graph-node')
        .data(_nodeData)
      } else {
        this.nodeGroup = this.nodeGroup.data(_nodeData)
      }
      let _newLabels;
      let _nodes      = this.nodeGroup.join(
        enter => {
          let _existingNodes = [];
          if(this.node && this.node) {
            this.node.remove();
          }
          //console.log('added new node: ', enter.data());
          let _newNodes = enter.append('g')
          .attr('x', d => {
            return d && d.x  && typeof d.x === 'number'  ? d.x : 0;
          })
          .attr('y', d => {
            return d && d.y  && typeof d.y === 'number' ? d.y : 0;
          })
          .attr('transform',(_d)=> { return `translate(${_d.x ? _d.x : 0},${_d.y ? _d.y : 0})`})
          .attr('class', (_d) => {
            return ['sz-graph-node'].concat(getNodeVisibilityClass(_d)).join(' ');
          });


          // --- add text labels
            _newLabels = _newNodes.append("svg:text")
            .attr("text-anchor", "middle")
            .attr("dy", ".25em")
            .attr("y", 25)
            .attr("class", (d) => {
              let retVal = ["sz-graph-label"];
              if(d && d.name && d.name.length > (this._labelMaxLength + 3)) {
                retVal.push('truncated');
              }
              return retVal.join(' ');
            })
            .text(d => {
              return d && d.name && d.name.length > (this._labelMaxLength + 3) ? d.name.substring(0, this._labelMaxLength).trim() + "..." : d.name;
            });
            let _nodeLabelBBoxAry: any[] = [];
            if(_newLabels) {
              _newLabels.each(function (d, i) {
                _nodeLabelBBoxAry[i] = this.getBBox();
              });
            }
            // update entities with collapsed relationship information
            _newNodes.each(this.updateHasCollapsedRelationships.bind(this, _newNodes))
                  
            // update initial visibility state
            _newNodes.attr('class', this.getEntityNodeClass);
            
            // Adds a background underneath the node labels.  This label is mostly opaque so that the label is still legible in
            // busy areas of a network.
            _newNodes.insert('svg:rect', 'text')
            .attr('x', (d, i) => _nodeLabelBBoxAry[i].x - (this._labelPadding / 2))
            .attr('y', (d, i) => _nodeLabelBBoxAry[i].y - (this._labelPadding / 2))
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('width', (d, i) => _nodeLabelBBoxAry[i].width + this._labelPadding)
            .attr('height', (d, i) => _nodeLabelBBoxAry[i].height + this._labelPadding)
            .attr('class', "sz-graph-bbox");

          // --- render person nodes

            // Add an SVG circle for the person's face.  This hides the links so they're not visible through the face.
            _newNodes.filter(d => SzRelationshipNetworkComponent.ICONS[d.iconType])
            .append('circle')
            .attr('class', function(d) {
              return ['sz-graph-icon-enclosure'].concat(d.relationTypeClasses).join(' ');
            })
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 15);

            let businessNodes = _newNodes.filter(d => d.iconType === "business");
            let personNodes   = _newNodes.filter(d => d.iconType !== "business")

            // Add an SVG icon for the person.
            personNodes
            .append('path')
            .attr('class', function(d) {
              let _classes = ['sz-graph-node-icon'].concat(d.relationTypeClasses);
              if(d.isPrimaryEntity) {
                _classes.push('sz-graph-primary-node')
              }
              return _classes.join(' ');
            })
            .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
            .attr("d", d => SzRelationshipNetworkComponent.ICONS[d.iconType] ?
                            SzRelationshipNetworkComponent.ICONS[d.iconType]["shape"] :
                            SzRelationshipNetworkComponent.ICONS["default"]["shape"])
            .attr("transform", "translate(-20,-20) scale(.080)");
          
          // --- render business nodes

            // add svg mask for business so you cant click through the surface
            // two rectangles that fill in the building path
            businessNodes
              .append('rect')
              .attr('x', 2.03)
              .attr('y', 3.048)
              .attr('width', 9.898)
              .attr('height', 17.939)
              .attr('class', 'sz-graph-business-icon-enclosure')
              .attr("transform", "translate(-20,-20) scale(1.4)");
            businessNodes
              .append('rect')
              .attr('x', 11.966)
              .attr('y', 7.068)
              .attr('width', 9.974)
              .attr('height', 13.918)
              .attr('class', 'sz-graph-business-icon-enclosure')
              .attr("transform", "translate(-20,-20) scale(1.4)");
            businessNodes
              .append('circle')
              .attr("cx", 0)
              .attr("cy", 0)
              .attr("r", 15)
              .style('fill','none')
              .style('stroke', '#474747')
              .style('stroke-width', '2px')
              .attr("transform", "translate(0,0) scale(1.2)");
            // Add svg icon for business (corps are not people)
            businessNodes
            .append('path')
            .attr('class', function(d) {
              return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ');
            })
            .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
            .attr("d", d => SzRelationshipNetworkComponent.ICONS[d.iconType] ?
                            SzRelationshipNetworkComponent.ICONS[d.iconType]["shape"] :
                            SzRelationshipNetworkComponent.ICONS["default"]["shape"])
            .attr("transform", "translate(-20,-20) scale(1.4)")
            .style('stroke', '#fff')
            .style('stroke-width', '.3px')

            // Add icons
            businessNodes
            .attr("xlink:href", d => {
              const nodeType = d.isQueriedNode ? 'queried' : d.isCoreNode ? 'core' : 'buildout';
              return "../img/icons8-building-50-" + nodeType + ".png";
            })
            .attr("x", -20)
            .attr("y", -20)
            .attr("height", 50)
            .attr("width", 50)
            .attr('class', this.getEntityNodeClass);

          // --- add expand/collapse glyph
            // update entities with collapsed relationship information
            _newNodes.each(this.updateHasCollapsedRelationships.bind(this, _newNodes))
            // update initial visibility state
            _newNodes.attr('class', this.getEntityNodeClass);
            
            let _nodesWithCollapsibleRelationships = _newNodes.filter(d => !d.allRelatedEntitiesOnDeck || d.hasCollapsibleRelationships || (d.hasRelatedEdges && d.numberRelated > 1));
            if(_nodesWithCollapsibleRelationships) {
              // add bubble
              _nodesWithCollapsibleRelationships
                .append('circle')
                .attr("cx", 12)
                .attr("cy", -10)
                .attr("r", d => {
                  let retVal = 6;
                  if (d && d.numberRelated && d.numberRelated > 99 && d.numberRelated >= 1000){
                    retVal = 8;
                  }
                  return retVal;
                })
                //.style('fill','#3385d1')
                //.style('stroke', '#474747')
                //.style('stroke-width', '2px')
                .attr('class', function(d) {
                  let collapsedIconClass  = 'sz-graph-icon-expand';
                  let expandedIconClass   = 'sz-graph-icon-collapse';
                  return ['sz-graph-icon-edge-toggle'].concat(d.allRelatedEntitiesOnDeck && d.numberRelatedHidden == 0 ? [collapsedIconClass] : [expandedIconClass]).join(' ');
                })
              // add plus/count glyph
              _nodesWithCollapsibleRelationships
                .append("svg:text")
                .attr("text-anchor", "middle")
                .attr("dy", d => {
                  return (d && d.numberRelatedHidden && d.numberRelatedHidden > 99) ? '.1rem' : '.14rem';
                })
                .attr("x", 12)
                .attr("y", -10)
                .attr("font-weight", "bold")
                .attr("font-size", d => {
                  return (d && d.numberRelatedHidden && d.numberRelatedHidden > 99) ? '.35rem' : '.45rem';
                })
                .attr("class","sz-graph-icon-edge-glyph sz-graph-icon-edge-glyph-collapsed")
                .text(d => {
                  let retVal = (d && d.numberRelatedHidden) ? d.numberRelatedHidden : '0';
                  if (d && d.numberRelatedHidden && d.numberRelatedHidden > 99 && d.numberRelatedHidden >= 1000) {
                    retVal = (Math.round((d.numberRelatedHidden / 1000) * 10) / 10)+'K';
                  }
                  return retVal;
                })
              // add minus glyph
              _nodesWithCollapsibleRelationships
                .append('path')
                .attr("x", 12)
                .attr("y", -10)
                .attr("height", 24)
                .attr("width", 24)
                .style('fill', '#fff')
                .attr("d","M0 10h24v4h-24z")
                .attr("class","sz-graph-icon-edge-glyph sz-graph-icon-edge-glyph-expanded")
                .attr("transform", "translate(8.5,-13.75) scale(.3)");
            }
            let loadingGlyph = _newNodes
            .append('g')
              .attr('class','loading-glyph')
              .attr('display','none')
              .attr('fill-rule', 'evenodd')
              .attr('stroke-width','2')
              .attr('stroke','#242424')

            let loadingCirc1 = loadingGlyph
            .append('circle')
              .attr('class','loading-circ1')
              .attr('fill','transparent')
              .attr('cx',0)
              .attr('cy',0)
              .attr('r', 1);
            loadingCirc1.append('animate')
                .attr('attributeName','r')
                .attr('begin','0s')
                .attr('dur','1.8s')
                .attr('values','15; 25')
                .attr('calcMode','spline')
                .attr('keyTimes','0; 1')
                .attr('keySplines','0.165, 0.84, 0.44, 1')
                .attr('repeatCount','indefinite');
            loadingCirc1.append('animate')
                .attr('attributeName','stroke-opacity')
                .attr('begin','0s')
                .attr('dur','1.8s')
                .attr('values','1; 0')
                .attr('calcMode','spline')
                .attr('keyTimes','0; 1')
                .attr('keySplines','0.3, 0.61, 0.355, 1')
                .attr('repeatCount','indefinite');

            let loadingCirc2 = loadingGlyph
                .append('circle')
                  .attr('class','loading-circ2')
                  .attr('fill','transparent')
                  .attr('cx',0)
                  .attr('cy',0)
                  .attr('r', '1');
            loadingCirc2.append('animate')
                  .attr('attributeName','r')
                  .attr('begin','-0.9s')
                  .attr('dur','1.8s')
                  .attr('values','20; 30')
                  .attr('calcMode','spline')
                  .attr('keyTimes','0; 1')
                  .attr('keySplines','0.165, 0.84, 0.44, 1')
                  .attr('repeatCount','indefinite');
            loadingCirc2.append('animate')
                  .attr('attributeName','stroke-opacity')
                  .attr('begin','-0.9s')
                  .attr('dur','1.8s')
                  .attr('values','1; 0')
                  .attr('calcMode','spline')
                  .attr('keyTimes','0; 1')
                  .attr('keySplines','0.3, 0.61, 0.355, 1')
                  .attr('repeatCount','indefinite');
          return _newNodes
        },
        /*update => {},
        exit => {}*/
      )
      .attr('class', (_d) => {
        return ['sz-graph-node'].concat(getNodeVisibilityClass(_d)).join(' ');
      })

      // update entities with collapsed relationship information
      _nodes.each(this.updateHasCollapsedRelationships.bind(this, _nodes))
      this.updateHiddenRelationshipCounts(_nodes);
      
      // update initial visibility state
      _nodes.attr('class', this.getEntityNodeClass);

      return {
        node: _nodes,
        group: this.nodeGroup,
        labels: _newLabels
      }
    }

    let randomIntBetweenRange = (min, max) => { 
      // min and max included 
      return Math.floor(Math.random() * (max - min + 1) + min)
    }

    let onExpandCollapseClick     = (d) => {
      // this handler always superceeds any click events etc
      // so we stop propagation
      d3.event.stopPropagation();

      if(!d.allRelatedEntitiesOnDeck) {
        // get all related entities
        d.loadingRelatedToDeck = true;
        this.getNodeByIdQuery(d.entityId).attr('class', this.getEntityNodeClass);
        this.getNextLayerForEntities(d.relatedEntities, d.entityId).pipe(
          take(1),
          map(this.asGraph.bind(this)),
          map(this.addExistingNodeData.bind(this)),
          map(this.addLinksToNodeData.bind(this))
        ).subscribe((result: any) => {
          
          // filter out already onDeck items
          let _onDeckEntities = (this.node && this.node.data) ? 
            this.node.data().map((_odEnt) => { return _odEnt.entityId; }) : [];
          graph               = result;
        
          // draw the links on canvas first so they are behind the nodes
          let _drawLnks   = drawLinks(result.links);

          //this.linkGroup  = _drawLnks.group;
          this.link       = _drawLnks.link;
          this.linkLabel  = _drawLnks.label;

          // draw the new nodes on canvas
          let _drawEnt    = drawNodes(result.nodes);
          this.nodeGroup  = _drawEnt.group;
          this.node       = _drawEnt.node;
          this.nodeLabel  = _drawEnt.labels;

          // register any new links
          this.link.data().filter((_nl) => {
            return (typeof _nl.source === 'number' || typeof _nl.target === 'number')
          }).forEach( this.registerLink.bind(this) );

          // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
          attachEventListenersToNodes(this.node, this._tooltip, this.nodeLabel, this);
          // Make the tooltip visible when mousing over links.  Fade out distant nodes
          attachEventListenersToLinks(this.link, this.linkLabel, this._tooltip, this);

          // just the nodes that were added
          let newNodes = this.node.filter((_d) => {
            let hasSetPosition = (_d.x || _d.y || _d.x === 0 || _d.y === 0) ;
            return (d.relatedEntities.indexOf(_d.entityId) >= 0) && !hasSetPosition;
          });
          
          //console.log('getNextLayerForEntity: links', this.linkedByNodeIndexMap, this.link.data());
          //console.log('getNextLayerForEntity: nodes', result.nodes, d.relatedEntities, newNodes.data());

          // set x/y positions of new nodes close to origin
          drawNodesInRings(newNodes, undefined, d.x, d.y)
          // redraw any existing or new link relationships
          updateLinksForNodes(newNodes);

          this.onDataUpdated.emit(this.asEntityNetworkData());
          this.expandCollapseToggle(d);
          d.loadingRelatedToDeck = false;
          this.getNodeByIdQuery(d.entityId).attr('class', this.getEntityNodeClass);

          return;
        });
      } else {
        this.expandCollapseToggle(d);
      }
    }

    // draw initial links
    let _drawLnk    = drawLinks(graph.links);
    this.linkGroup  = _drawLnk.group;
    this.link       = _drawLnk.link;
    this.linkLabel  = _drawLnk.label;

    // call drawNodes
    let _drawOp     = drawNodes(graph.nodes)
    this.nodeGroup  = _drawOp.group;
    this.node       = _drawOp.node;
    this.nodeLabel  = _drawOp.labels;
    //this.nodeLabel  = _drawOp.label;

    if(this.node) {
      // update entities with collapsed relationship information
      this.node.each(this.updateHasCollapsedRelationships.bind(this, this.node))
      this.updateHiddenRelationshipCounts(this.node);
      
      // update initial visibility state
      this.node.attr('class', this.getEntityNodeClass);

      // on first draw we position the nodes so
      // that the user can see all of them
      let nodesToPosition = this.node.filter((_d) => {
        return !_d.isPrimaryEntity && !_d.isCoreNode;
      })
      let coreNodes = this.node.filter((_d) => {
        return _d.isPrimaryEntity || _d.isCoreNode;
      })
      // give the initial ring diameter a bit extra if there's a lot of items
      let nodesCircleSchema = drawNodesInRings(nodesToPosition);
      // make sure core nodes are positioned correctly
      let coreClusterSpacing      = 200; 
      let ringsSortedByDiameter   = nodesCircleSchema.sort((csA, csB) => {
        return csB.diameter - csA.diameter;
      });
      let inintialClusterOffset   = ringsSortedByDiameter && ringsSortedByDiameter.length > 0 ? ringsSortedByDiameter[0].diameter : 400;
      coreNodes
      .sort((_cnA, _cnB) => d3.descending(_cnA.numberRelated, _cnB.numberRelated))
      .each((_n, _j) => {
        _n.x       = _n.x ? _n.x : 0;
        _n.y       = _n.y ? _n.y : 0;
        let anyOtherNodeInSamePosition = coreNodes.data().some((_cd) => {
          return _cd.x == _n.x || _cd.y == _n.y;
        })
        if(anyOtherNodeInSamePosition && _j > 0) {
          // reposition node so it's somewhere else
          _n.x = inintialClusterOffset + (_j * randomIntBetweenRange(coreClusterSpacing, coreClusterSpacing+300));
          _n.y = (!(_j === 0 || _j % 2 === 0)) ? (0 - randomIntBetweenRange(50, 300)) : (0 + randomIntBetweenRange(150, 300));
        }
      });
      // position non-primary nodes around focused interests
      applyPositionToNodes(coreNodes);
      // update initial relationship link lines
      updateLinksForNodes(this.node);

      //console.log('coreNodes: ', coreNodes.data(), nodesCircleSchema, ringsSortedByDiameter);
      //console.log('total width of nodes: ', widthOfNodes, circleDiameter);
      //console.log('nodes: ', this.node.data());

      this.center();
    }

    if(this.link) {
      this.link.each(this.updateIsHiddenForLinks.bind(this, hiddenNodes));
      this.link.attr('class', this.getEntityLinkClass);
      if(this.linkLabel) {
        this.linkLabel.attr('class', this.getEntityLinkLabelClass);
      }
    }

    // if there are any special node modifier functions run them
    if( this._highlightFn || this._filterFn || this._modifyFn) {
      // run a fn against the node list
      if (this._filterFn && this._filterFn.length > 0) {
        this._applyFilterFn(this._filterFn);
      } else if(this._modifyFn && this._modifyFn.length > 0) {
        this._applyModifierFn(this._modifyFn);
      } else if (this._highlightFn && this._highlightFn.length > 0) {
        this._applyModifierFn(this._filterFn);
      }
    }

    // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
    attachEventListenersToNodes(this.node, this._tooltip, this.nodeLabel, this);
    // Make the tooltip visible when mousing over links.  Fade out distant nodes
    attachEventListenersToLinks(this.link, this.linkLabel, this._tooltip, this);

    // publish out event
    this._rendered = true;
    if(console.time){
      try {
        console.timeEnd('graph render')
      }catch(err){}
    }
  }
  /** 
   * update the relationship count bubble inside a entity node 
   * with the value from numberRelatedHidden
   */
  private updateHiddenRelationshipCounts(_nodes) {
    //console.log('updateHiddenRelationshipCounts: ', _nodes);
    if(_nodes && _nodes.selectAll) {
      let _glyphNodes = _nodes.selectAll('.sz-graph-icon-edge-glyph-collapsed');
      if(_glyphNodes && _glyphNodes.size() > 0) {
        // update text value
        _glyphNodes.text(d => {
          let retVal = (d && d.numberRelatedHidden) ? d.numberRelatedHidden : '0';
          if (d && d.numberRelatedHidden && d.numberRelatedHidden > 99 && d.numberRelatedHidden >= 1000) {
            retVal = (Math.round((d.numberRelatedHidden / 1000) * 10) / 10)+'K';
          }
          return retVal;
        })
      }
      //console.log('updateHiddenRelationshipCounts: ', _glyphNodes);
    }
  }
  /** 
   * ensure that a link node(line) is not visible if one 
   * of the connected nodes is not visible
   */
  private updateIsHiddenForLinks(hiddenNodes, _ln) {
    // we only want links to just read off of 
    // whatever the visibility is of the nodes (K.I.S.S.)
    if(!_ln){
      //console.warn(`updateIsHiddenForLinks: `,_ln, hiddenNodes);
      return;
    }
    hiddenNodes         = !hiddenNodes ? this.getHiddenNodeIds(this.node) : hiddenNodes;

    let shouldBeHidden  = (hiddenNodes && hiddenNodes.includes && hiddenNodes.includes(_ln.sourceEntityId) || hiddenNodes && hiddenNodes.includes && hiddenNodes.includes(_ln.targetEntityId));
    _ln.isHidden        = shouldBeHidden;
    if(!hiddenNodes) {
        //console.warn(`updateIsHiddenForLinks: checking if line between ${_ln.sourceEntityId} and ${_ln.targetEntityId} should be hidden: `, shouldBeHidden, hiddenNodes);
    }
    //console.log('checking if line between '+ _ln.sourceEntityId +' and '+ _ln.targetEntityId +' should be hidden: '+ shouldBeHidden, hiddenNodes.includes(_ln.sourceEntityId), hiddenNodes.includes(_ln.targetEntityId), hiddenNodes);
  }
  /**
   * get the css classes as a space separate string 
   * to apply to an entity link node(line) 
   */
  private getEntityLinkClass(_ln) {
    let _visibilityClass      = _ln.isHidden ? ['sz-node-state-hidden']  : [];
    let _classes              = [].
                                concat(_visibilityClass);
    //if(_ln.isCoreLink) {
    //  _classes.push('sz-graph-core-link')
    //} else {
      _classes.push('sz-graph-link');
    //}
    return _classes.join(' ');
  }
  /**
   * get the css classes as a space separate string 
   * to apply to an entity node 
   */
  private getEntityNodeClass(_d) {
    let _visibilityClass        = _d.isHidden ?                   ['sz-node-state-hidden']  : [];
    let _collapsedNodesClass    = (_d.numberRelatedHidden > 0 || !_d.allRelatedEntitiesOnDeck) ?  ['has-collapsed-edges']   : [];
    let _classes                = [].
                                  concat(_d.relationTypeClasses).
                                  concat(_collapsedNodesClass).
                                  concat(_visibilityClass);
    if(_d.isQueriedNode) {
      _classes.push('sz-graph-queried-node');
    } else if(_d.isCoreNode) {
      _classes.push('sz-graph-core-node')
    } else {
      _classes.push('sz-graph-node')
    }
    if(_d.isPrimaryEntity) {
      _classes.push('sz-graph-primary-node')
    }
    if(!_d.hasCollapsedRelationships && _d.numberRelated > 1) {
      _classes.push('sz-graph-all-related-visible');
    }
    if(_d.loadingRelatedToDeck) {
      _classes.push('sz-graph-node-loading');
    }
    return _classes.join(' ');
  }

  /** returns a D3.Selection of the node that matches the entity id provided */
  private getNodeByIdQuery(_entityId) {
    return this.getNodesByIdQuery([_entityId]);
  }
  /** returns a D3.Selection of nodes that match the entity ids provided */
  private getNodesByIdQuery(entityIds: SzEntityIdentifier[]) {
    if(this.node && this.node.select){
      let retVal = this.node.filter(_d => entityIds.indexOf(_d.entityId) > -1);
      return retVal;
    }
    return undefined;
  }

  /** returns a D3.Selection of nodes that match the entity ids provided */
  private getRelatedNodesByIdQuery  = (relatedEntityIds, nodes, includePrimaryEntities?: boolean) => {
    return nodes.filter((d) => {
      if(!includePrimaryEntities) {
        return relatedEntityIds && relatedEntityIds.indexOf && relatedEntityIds.indexOf(d.entityId) >= 0 && !(d.isPrimaryEntity);
      }
      return relatedEntityIds && relatedEntityIds.indexOf && relatedEntityIds.indexOf(d.entityId) >= 0;
    })
  }
  /** 
   * return an array of entity ids for nodes 
   * that exist on canvas but are not currently visible
   */
  private getHiddenNodeIds(_nodeData) {
    let _retVal = [];
    if(_nodeData && _nodeData.data){
      let _ndata  = _nodeData.data();
      let _hdata  = _ndata ? _nodeData.data().filter((_nd) => { return _nd.isHidden; }) : [];
      _retVal     = _hdata.map((_entData) => { return _entData.entityId })
    }
    return _retVal;
  }
  /** 
   * get the css classes as a space separate string 
   * to apply to an entity link label node 
   */
  private getEntityLinkLabelClass (_ln) {
    let _visibilityClass      = _ln.isHidden ? ['sz-node-state-hidden']  : [];
    let _classes              = ['sz-graph-link-label'].
                                concat(_visibilityClass);
    return _classes.join(' ');
  }
  /** toggle a nodes directly attached related nodes */
  private expandCollapseToggle(d) {
    let relatedNodes              = this.getRelatedNodesByIdQuery(d.relatedEntities, this.node, true).filter(_rn =>  _rn.entityId !== d.entityId);
    let hasCollapsedRelationships = relatedNodes.filter((_d) => {
      return _d.isHidden;
    }).size() > 0;
    d.hasCollapsedRelationships = hasCollapsedRelationships;
    //console.log('visible nodes: ', allVisibleEntities.join(', '), d.nodesVisibleBeforeExpand);
    //console.log('Node has collapsed relationships? ', d.hasCollapsedRelationships, d.numberRelatedHidden);
    if(d.hasCollapsedRelationships) {
      // we're expanding
      this._expandNode(d);
    } else {
      this._removeNode(d, false, true);
    }
  }

  updateHasCollapsedRelationships(nodeCollection, d) {
    let allEntitiesOnDeck           = nodeCollection.data().map((_entity) => {
      return _entity.entityId;
    });
    let allHiddenEntitiesOnDeck     = nodeCollection.filter((_entity) => { return _entity.isHidden; })
    .data().map((_entity) => {
      return _entity.entityId;
    });
    let relatedEntities             = d.relatedEntities;
    // make sure to remove possible self-reference
    if(relatedEntities && relatedEntities.indexOf && relatedEntities.indexOf(d.entityId) > -1) {
      relatedEntities.splice(relatedEntities.indexOf(d.entityId), 1);
    }
    let allRelatedNodes             = this.getRelatedNodesByIdQuery(relatedEntities, nodeCollection, true);
    let relatedHidden               = !relatedEntities ? [] : relatedEntities.filter((_reId) => {
      if(allHiddenEntitiesOnDeck.includes(_reId) || !allEntitiesOnDeck.includes(_reId)) {
        // has related entity on deck but it's hidden
        // or the entity is not on deck
        return true;
      }
      return false;
    });

    let nonRemovableNodes           = nodeCollection.data().filter((_nd) => {
      return (_nd.isPrimaryEntity);
    }).map((_nrn) => { return _nrn.entityId; });
    let collapsibleNodes            = (d.relatedEntities && d.relatedEntities.filter) ? d.relatedEntities.filter((_d) => {
      return !nonRemovableNodes.includes(_d.entityId);
    }) : [];
    /** 
     * TODO: I dunno why but nodes that were previously edge nodes
     * become core nodes on expansion so the bubble dissapears
     * I just need to fix this issue then code cleanup
     */
    let hasCollapsibleRelationships = collapsibleNodes.length > 0 && !(d.isCoreNode || d.isPrimaryEntity);


    d.numberRelated               = relatedEntities ? (relatedEntities.length as number) : 0;
    d.numberRelatedOnDeck         = (allRelatedNodes.size() as number);
    d.numberRelatedHidden         = (relatedHidden.length as number);
    d.allRelatedEntitiesOnDeck    = (d.numberRelatedOnDeck == d.numberRelated);
    d.hasCollapsedRelationships   = relatedHidden.length > 0 || !d.allRelatedEntitiesOnDeck;
    d.hasCollapsibleRelationships = hasCollapsibleRelationships;
    d.collapsibleNodes            = collapsibleNodes.join(', ');
    d.nonRemovableNodes           = nonRemovableNodes;
  }

  private registerLink(d: LinkInfo) {
    const source : NodeInfo = <NodeInfo> d.source;
    const target : NodeInfo = <NodeInfo> d.target;
    this.linkedByNodeIndexMap[`${source.index},${target.index}`] = 1;
    return this.linkedByNodeIndexMap[`${source.index},${target.index}`];
  }

  static linkTooltipText(d: any) {
    return "<strong>From</strong>: " + d.sourceEntityId +
      "<br/><strong>To</strong>: " + d.targetEntityId +
      "<br/><strong>Match Level</strong>: " + d.matchLevel +
      "<br/><strong>Match Key</strong>: " + d.matchKey;
  }

  static nodeTooltipText(d: any) {
    let retVal = "<strong>Entity ID</strong>: " + d.entityId +
      "<br/><strong>Name</strong>: " + d.name;
    if(d.address && d.address !== null) {
      retVal += "<br/><strong>Address</strong>: " + d.address;
    }
    if(d.phone && d.phone !== null) {
      retVal += "<br/><strong>Phone</strong>: " + d.phone;
    }
    /*
    if(d.relationshipMatchKeys) {
      retVal += "<br/><strong>match key</strong>: <br/>";
      retVal += `<li>${d.relationshipMatchKeys}</li>`;
    }
    if(d.relationshipMatchKeyTokens && d.relationshipMatchKeyTokens.forEach) {
      retVal += "<br/><strong>match keys</strong>: <br/>";
      retVal += "<ul>";
      d.relationshipMatchKeyTokens.forEach((mkt) =>{
        retVal += `<li>${mkt}</li>`;
      });
      retVal += "</ul>";
    }
    if(d.coreRelationshipMatchKeyTokens && d.coreRelationshipMatchKeyTokens.forEach && d.coreRelationshipMatchKeyTokens.length > 0) {
      retVal += "<br/><strong>core match keys</strong>: <br/>";
      retVal += "<ul>";
      d.coreRelationshipMatchKeyTokens.forEach((mkt) =>{
        retVal += `<li>${mkt}</li>`;
      });
      retVal += "</ul>";
    }*/
    //console.log('tt match key categories by entity id: ', d.matchKeyCategoriesByEntityId[d.entityId], d.coreRelationshipMatchKeyTokens[ d.entityId ]);
    
    //retVal += "<br/><strong>areAllRelatedEntitiesOnDeck(1)</strong>: "+ d.allRelatedEntitiesOnDeck;
    //retVal += "<br/><strong>numberRelated</strong>: "+ d.numberRelated;
    //retVal += "<br/><strong>numberRelatedOnDeck</strong>: "+ d.numberRelatedOnDeck;
    //retVal += "<br/><strong>numberRelatedHidden</strong>: "+ d.numberRelatedHidden;
    //retVal += "<br/><strong>isPrimaryEntity</strong>: "+ d.isPrimaryEntity;
    //retVal += "<br/><strong>isHidden</strong>: "+ d.isHidden;
    //retVal += "<br/><strong>nonRemovableNodes</strong>: "+ d.nonRemovableNodes;
    //retVal += "<br/><strong>collapsibleNodes</strong>: "+ d.collapsibleNodes;
    //retVal += "<br/><strong>hasCollapsibleRelationships</strong>: "+ d.hasCollapsibleRelationships;
    //retVal += "<br/><strong>hasCollapsedRelationships</strong>: "+ d.hasCollapsedRelationships;
    //retVal += "<br/><strong>relatedToPrimaryEntityDirectly</strong>: "+ d.relatedToPrimaryEntityDirectly;
    /*
    if(d.relatedEntities && d.relatedEntities !== null && d.relatedEntities.join) {
      retVal += "<br/><strong>Related</strong>: " + d.relatedEntities.join(', ');
    }*/
    return retVal;
  }

  isConnected(a, b) {
    return this.linkedByNodeIndexMap[`${a.index},${b.index}`] ||
      this.linkedByNodeIndexMap[`${b.index},${a.index}`] ||
      a.index === b.index;
  }
  
  /**
   * handler for when a relationship link label is clicked.
   * proxies to synthetic event "relationshipClick"
   * @param event
   */
  onLinkClick(event: any) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.relationshipClick.emit(event);
  }
  /**
   * handler for when a relationship link label is double clicked.
   * proxies to synthetic event "relationshipDblClick"
   * @param event
   */
  onLinkDblClick(event: any) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.relationshipDblClick.emit(event);
    return false;
  }
  /**
   * handler for when a relationship link label is right clicked.
   * proxies to synthetic event "relationshipContextMenuClick"
   * @param event
   */
  onLinkContextClick(event: any, x?: number, y?: number) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.relationshipContextMenuClick.emit(event);
    return false;
  }

  /**
   * handler for when a entity node is clicked.
   * proxies to synthetic event "entityClick"
   * @param event
   */
  onNodeClick(event: any) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.entityClick.emit(event);
  }
  /**
   * handler for when a entity node is double clicked.
   * proxies to synthetic event "entityDblClick"
   * @param event
   */
  onNodeDblClick(event: any) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.entityDblClick.emit(event);
    return false;
  }
  /**
   * handler for when a entity node is right clicked.
   * proxies to synthetic event "contextMenuClick"
   * @param event
   */
  onNodeContextClick(event: any, x?: number, y?: number) {
    if(event && d3.event && d3.event.pageX && d3.event.pageY) {
      event.eventPageX = (d3.event.pageX);
      event.eventPageY = (d3.event.pageY);
    }
    this.contextMenuClick.emit(event);
    return false;
  }
  /**
   * handler for when a entity nodes text label is clicked.
   * default behavior is to expand the text label if it has been
   * truncated, and truncate it if it is over 15 chars long.
   */
  onLabelClick(_d) {
    if(_d) {
      let textNode = this.node.selectAll('text.sz-graph-label')
      .filter((_t: any) => {
        return _t && _t.entityId && _t.entityId === _d.entityId;
      });

      if(textNode.size && textNode.size() >= 1) {
        // found a matching text node
        if(_d.ellipsisExpanded) {
          // collapse ellipsis
          textNode
          .text((_t: any) => {
            return _t && _t.name && _t.name.length > (this._labelMaxLength + 3) ? _t.name.substring(0, this._labelMaxLength).trim() + "..." : _t.name;
          });
        } else {
          // expand ellipsis
          textNode
          .text((_t: any) => {
            return _t.name;
          });
        }
      }
      _d.ellipsisExpanded = !_d.ellipsisExpanded;
    }
  }
  /**
   * handler for when a entity nodes text label is hovered over.
   * default behavior is to expand the text label if it has been
   * truncated.
   */
   onLabelMouseOver(_d) {
    if(_d) {
      let textNode = this.node.selectAll('text.sz-graph-label')
      .filter((_t: any) => {
        return _t && _t.entityId && _t.entityId === _d.entityId;
      });

      if(textNode.size && textNode.size() >= 1) {
        // expand ellipsis
        textNode
        .text((_t: any) => {
          return _t.name;
        });
      }
    }
  }
  /**
   * handler for when a entity nodes text label is hovered over.
   * default behavior is to truncate the text label if it has been
   * truncated and not set to expanded through a click toggle.
   */
   onLabelMouseOut(_d) {
    if(_d) {
      let textNode = this.node.selectAll('text.sz-graph-label')
      .filter((_t: any) => {
        return _t && _t.entityId && _t.entityId === _d.entityId && !_d.ellipsisExpanded;
      });

      if(textNode.size && textNode.size() >= 1) {
        // collapse ellipsis
        textNode
        .text((_t: any) => {
          return _t && _t.name && _t.name.length > (this._labelMaxLength + 3) ? _t.name.substring(0, this._labelMaxLength).trim() + "..." : _t.name;
        });
      }
    }
  }

  //private _zoomTransform = {k: 1, x: 0, y: 0}
  private _onZoomed() {
    let e = d3.event.transform;
    let scale = e.k;

    if(e && this.svgZoom && this.svgZoom.attr) {
      this.svgZoom.attr('transform', e);
    }
    //console.log('_onZoomed: ', e);
    let scaleChanged = this._scaleRaw !== scale;
    this._scaleRaw = scale;
    if(scaleChanged) {
      if(scale < 1){
        let units = (1 - this._scaleMin) / 75;
        let value = Math.floor(((((scale - this._scaleMin) * units) * 1000) * 10) );
        //console.log('scalePerc = '+ value, (((scale - this._scaleMin) * units) * 10000));
        this._scalePerc = value;
      } else {
        let units = (this._scaleMax - 1) / 25;
        let value = Math.round((((scale * units) * 100)) + 75.1);
        //console.log('scalePerc = '+ value, ((scale * units) * 100)+ 75.1);
        this._scalePerc = value;
      }

      this._onZoom.next(this._scalePerc);
    }
  }

  /**
   * function that is executed on node hover
   * @param opacity
   */
  /*fade(opacity: any) {
    const isConnectedLocal = this.isConnected.bind(this);
    return (d: any) => {
      if(this.node){ 
        this.node.transition().duration(100).style('opacity', function (o) {
          const thisOpacity = isConnectedLocal(d, o) ? 1 : opacity;
          //this.setAttribute('fill-opacity', thisOpacity);
          return thisOpacity;
        });
      }
      if(this.link) {
        this.link.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      }      
      if (this.showLinkLabels && this.linkLabel) {
        this.linkLabel.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      }
    };
  }*/
  /**
   * Fade Rules for hovering over links
   * As currently implemented, any nodes that are connected to both source and target are not faded out.
   */
  /*linkFade(opacity: any) {
    const isConnectedLocal = this.isConnected.bind(this);
    return (d: any) => {
      if(this.node){
        this.node.transition().duration(100).style('opacity', function (o) {
          const thisOpacity = isConnectedLocal(d.source, o) &&
                              isConnectedLocal(d.target, o) ? 1 : opacity;
          //this.setAttribute('fill-opacity', thisOpacity);
          return thisOpacity;
        });
      }
      if(this.link) {
        this.link.transition().duration(100).style('opacity', o => (o.source === d.source && o.target === d.target ? 1 : opacity));
      }
      if (this.showLinkLabels && this.linkLabel) {
        this.linkLabel.transition().duration(100).style('opacity', opacity);
      }
    };
  }*/

  /**
   * Generate SVG commands for a straight line between two nodes, always left-to-right.
   */
  static linkSvg(leftNode: any, rightNode: any) {
    return 'M' + leftNode.x + ',' + leftNode.y + 'L' + rightNode.x + ',' + rightNode.y;
  }

  linkSvgByEntityId(leftNodeEntityId: number, rightNodeEntityId: number) {
    let _leftNode, _rightNode;
    let _ctm = this.svgZoomElement.getCTM();

    this.node.each((_d) => {
      if(_d.entityId === leftNodeEntityId) {
        _leftNode = _d;
      }
      if(_d.entityId === rightNodeEntityId) {
        _rightNode = _d;
      }
    });
    return 'M' + (
      _leftNode ?  (_leftNode.x) : 0) + ',' + (
      _leftNode ?  (_leftNode.y) : 0) + 'L' + (
      _rightNode ? (_rightNode.x) : 0) + ',' + (
      _rightNode ? (_rightNode.y) : 0);
  }

  /** when an entity nodes position changes
   * we need to update the x and y of the link
   * line so that it stays connected
   */
  private onLinkEntityPositionChange(linkNode) {
    // get source and target x position 
    // so were always left to right
    let linkedNodes   = this.getNodesByIdQuery([linkNode.sourceEntityId,linkNode.targetEntityId]);
    let _linkTargets  = {source: linkNode.source, target: linkNode.target }
    let _sourceNode = linkedNodes.filter((_ln) => { return _ln.entityId === linkNode.sourceEntityId});
    let _targetNode = linkedNodes.filter((_ln) => { return _ln.entityId === linkNode.targetEntityId});
    if(_sourceNode && _sourceNode.data) {
      if(_sourceNode.size() > 0) {
        _linkTargets.source = _sourceNode.data()[0];
      }
    }
    if(_targetNode && _targetNode.data) {
      if(_targetNode.size() > 0) {
        _linkTargets.target = _targetNode.data()[0];
      }
    }
    return (_linkTargets.source.x < _linkTargets.target.x) ?
    this.linkSvgByEntityId(linkNode.sourceEntityId, linkNode.targetEntityId) :
    this.linkSvgByEntityId(linkNode.targetEntityId, linkNode.sourceEntityId)
  }

  private onNodeDragged(d) {
    d.x = d3.event.x;
    d.y = d3.event.y;
    
    this.node.filter((_d) => {
      return _d.entityId === d.entityId;
    })
    .attr('x', d.x)
    .attr('y', d.y)
    .attr('transform',`translate(${d.x},${d.y})`)

    let lnk = this.link.filter(
      (l) => { 
        //console.log(`lnk filter: `, l.sourceEntityId, d.entityId);
        return l.sourceEntityId === d.entityId || l.targetEntityId === d.entityId; 
      });
    
    lnk.attr('d', this.onLinkEntityPositionChange.bind(this));
  }

  /**
   * Allows the simulation to 'cool' to the point that nodes stop moving.
   * The simulation does not stop while alphaTarget (default 0, set at 0.3 by dragstarted) > alphaMin (default 0.001)
   */
  private onNodeDragEnded() {
    if (!d3.event.active && this.forceSimulation) this.forceSimulation.alphaTarget(0);
    if (this._fixDraggedNodes) {
      // nodes once dragged stay where you put them
      // elegant compromise
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    } else {
      // nodes snap back in to place
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }
  }

  //////////////////
  // DATA MAPPING //
  //////////////////

  private mergeGData(targetData: any, srcData: any) {
    const srcEntityPaths  = srcData ? srcData.entityPaths : undefined;
    const srcEntitiesData = srcData.nodes;
   
    let entitiesInTarget  = targetData.nodes.map((entNode) => {
      return entNode.entityId;
    })
    let linksInTarget     = targetData.links.map((entNode) => {
      return entNode.entityId;
    })

    let nodesToConcat = srcData.nodes.filter((entNode) => {
      return !entitiesInTarget.includes(entNode.entityId)
    })
    let linksToConcat = srcData.links.filter((entNode) => {
      return !linksInTarget.includes(entNode.entityId)
    })
    targetData.nodes = targetData.nodes.concat(nodesToConcat);
    targetData.links = targetData.links.concat(linksToConcat);

    return targetData;
  }

  /**
   * gets the data from the current nodes and links displayed in 
   * the graph as SzEntityNetworkData formatted data
   * @returns 
   */
  private asEntityNetworkData(): SzEntityNetworkData {
    let returnValue: {
      entities: Array<SzEntityData>
      entityPaths: Array<SzEntityPath>
    } = {
      entities: [],
      entityPaths: []
    }

    this.node.data().forEach((nodeData) => {
      let existingIndex = returnValue.entities.findIndex((entObj: SzEntityData) => {
        return entObj && entObj.resolvedEntity && entObj.resolvedEntity.entityId === nodeData.entityId;
      });
      if(existingIndex < 0) {
        returnValue.entities.push({
          resolvedEntity: nodeData.resolvedEntityData,
          relatedEntities: nodeData.relatedEntitiesData
        });
      }
    })

    this.link.data().forEach((linkData) => {
      let existingIndex = returnValue.entityPaths.findIndex((linkObj: SzEntityPath) => {
        let hasSameSource = linkObj && linkObj.startEntityId && linkObj.startEntityId === linkData.sourceEntityId;
        let hasSameTarget = linkObj && linkObj.endEntityId && linkObj.endEntityId === linkData.targetEntityId;
        return hasSameSource && hasSameTarget;
      })
      if(existingIndex < 0) {
        returnValue.entityPaths.push({
          startEntityId: linkData.sourceEntityId,
          endEntityId: linkData.targetEntityId
        });
      }
    });
    return returnValue
  }

  /**
   * primary data model shaper.
   */
  private asGraph(inputs: SzNetworkGraphInputs) : {nodes: any[] } {
    const showLinkLabels = inputs.showLinkLabels;
    const data = (inputs && inputs.data) ? inputs && inputs.data : undefined;
    // if (data && data.data) data = data.data;

    const entityPaths = data ? data.entityPaths : undefined;
    const entitiesData = data ? data.entities : undefined;
    const entityIndex = [];
    const nodes = [];
    const links = [];
    const linkIndex = [];
    const queriedEntityIds = [];
    const primaryEntityIds = this._entityIds ? this._entityIds : [];
    const coreEntityIds = [];
    const coreLinkIds = [];
    const primaryEntities = this._entityIds && this._entityIds.map ? this._entityIds.map( (_val) => {
      return parseInt(_val)
    }) : [];
    const relatedMatchKeysByEntityId: {[key: number]: string[]} = {};
    const matchKeyCategoriesByEntityId: {[key: number]: string[]} = {};
    const matchKeyCoreCategoriesByEntityId: {[key: number]: string[]} = {};

    // grab the directly related to core node entity Ids first
    let   relatedToPrimaryEntities = [];
    entitiesData.forEach(entNode => {
      let _isCore = primaryEntities.indexOf( entNode.resolvedEntity.entityId ) > -1;
      // grab the directly related entity Ids off this entity
      if(_isCore && entNode.relatedEntities && entNode.relatedEntities.length > 0) {
        relatedToPrimaryEntities = relatedToPrimaryEntities.concat( entNode.relatedEntities.map((relEnt) => { return relEnt.entityId; }) );
      }
    });
    //console.log('SzRelationshipNetworkGraph.asGraph: ', inputs, data, entitiesData, entityPaths, primaryEntityIds);

    // Identify queried nodes and the nodes and links that connect them.
    entityPaths.forEach( (entPath) => {
      if (!queriedEntityIds.includes(entPath.startEntityId)) {
        queriedEntityIds.push(entPath.startEntityId);
      }
      if (!queriedEntityIds.includes(entPath.endEntityId)) {
        queriedEntityIds.push(entPath.endEntityId);
      }

      const pathIds = entPath.entityIds;
      pathIds.forEach( (pEntId) => {
        if (!coreEntityIds.includes(pEntId)) {
          coreEntityIds.push(pEntId);
        }
      });
      pathIds.forEach( (pEntId, pEntInd) => {
        const linkArr = [pathIds[pEntInd], pathIds[pEntInd + 1]].sort();
        const linkKey = {firstId: linkArr[0], secondId: linkArr[1]};
        if (!SzRelationshipNetworkComponent.hasKey(coreLinkIds, linkKey)) {
          coreLinkIds.push(linkKey);
        }
      });
    });
    // we have to aggregate match keys first so we have them all on next pass
    entitiesData.forEach(entNode => {
      let _resolvedEntId = entNode.resolvedEntity.entityId;
      if(entNode.relatedEntities && entNode.relatedEntities.forEach){
        entNode.relatedEntities.forEach((_relatedEnt: SzRelatedEntity) => {
          let _relatedEntId = _relatedEnt.entityId;
          let _relatedMatchCategory = SzRelationshipNetworkComponent.tokenizeMatchKey(_relatedEnt.matchKey);
          let _relatedEntityIsPrimary = primaryEntities.indexOf(_relatedEntId) > -1 || primaryEntities.indexOf(_resolvedEntId) > -1;
          if(_relatedEntityIsPrimary) {
            // this is a core relationship
            if(!matchKeyCoreCategoriesByEntityId[ _relatedEntId ] || matchKeyCoreCategoriesByEntityId[ _relatedEntId ] === undefined) {
              matchKeyCoreCategoriesByEntityId[ _relatedEntId ] = [];
            }
            if(matchKeyCoreCategoriesByEntityId[ _relatedEntId ] && matchKeyCoreCategoriesByEntityId[ _relatedEntId ].concat) {
              let concatVals = [];
              _relatedMatchCategory.forEach((mkArr) => {
                concatVals = concatVals.concat(mkArr);
              });

              matchKeyCoreCategoriesByEntityId[ _relatedEntId ] = matchKeyCoreCategoriesByEntityId[ _relatedEntId ].concat(concatVals);
              // de-dupe values
              matchKeyCoreCategoriesByEntityId[ _relatedEntId ] = matchKeyCoreCategoriesByEntityId[ _relatedEntId ].filter((value, index, self) => {
                return self.indexOf(value) === index;
              });
            }
          }

          if(!relatedMatchKeysByEntityId[ _relatedEntId ] || relatedMatchKeysByEntityId[ _relatedEntId ] === undefined) {
            relatedMatchKeysByEntityId[ _relatedEntId ] = [];
          }
          if(relatedMatchKeysByEntityId[ _relatedEntId ] && relatedMatchKeysByEntityId[ _relatedEntId ].indexOf && relatedMatchKeysByEntityId[ _relatedEntId ].indexOf(_relatedEnt.matchKey) < 0) {
            relatedMatchKeysByEntityId[ _relatedEntId ].push( _relatedEnt.matchKey );
          } else if(relatedMatchKeysByEntityId[ _relatedEntId ] && !relatedMatchKeysByEntityId[ _relatedEntId ].indexOf) {
            // not sure whats going on here
          }
          if(!matchKeyCategoriesByEntityId[ _relatedEntId ] || matchKeyCategoriesByEntityId[ _relatedEntId ] === undefined) {
            matchKeyCategoriesByEntityId[ _relatedEntId ] = [];
          }
          if(matchKeyCategoriesByEntityId[ _relatedEntId ] && matchKeyCategoriesByEntityId[ _relatedEntId ].concat) {
            matchKeyCategoriesByEntityId[ _relatedEntId ] = matchKeyCategoriesByEntityId[ _relatedEntId ].concat(_relatedMatchCategory[0]).concat(_relatedMatchCategory[1])
            // de-dupe values
            matchKeyCategoriesByEntityId[ _relatedEntId ] = matchKeyCategoriesByEntityId[ _relatedEntId ].filter((value, index, self) => {
              return self.indexOf(value) === index;
            });
            //relatedMatchKeysByEntityId[ _relatedEntId ].push( _relatedEnt.matchKey );
          }
        });
      }
    });

    // Add a node for each resolved entity
    entitiesData.forEach(entNode => {
      const entityId        = entNode.resolvedEntity.entityId;
      const resolvedEntity  = entNode.resolvedEntity;
      const relatedEntities = entNode.relatedEntities;
      const relatedEntRels  = entNode.relatedEntities && entNode.relatedEntities.filter ? entNode.relatedEntities.filter( (relEnt) => {
        return primaryEntities ? primaryEntities.indexOf(relEnt.entityId) >= 0 : false;
      } ) : undefined;
      let isPrimaryEntity                 = primaryEntityIds.includes( (entityId as unknown as string)+"")
      let relatedMatchKeys                = relatedMatchKeysByEntityId[ resolvedEntity.entityId ]   ? relatedMatchKeysByEntityId[ resolvedEntity.entityId ]     : [];
      let relatedMatchKeyCategories       = matchKeyCategoriesByEntityId[ resolvedEntity.entityId ] ? matchKeyCategoriesByEntityId[ resolvedEntity.entityId ]   : [];
      let coreRelatedMatchKeyCategories   = matchKeyCoreCategoriesByEntityId[ resolvedEntity.entityId ] ? matchKeyCoreCategoriesByEntityId[ resolvedEntity.entityId ]   : [];
      let relatedToPrimaryEntityDirectly  = primaryEntityIds.includes( (entityId as unknown as string)+"") ? true : false;
      let hasCollapsibleRelationships     = false;
      if(relatedEntities && !isPrimaryEntity) {
        // check that one of the relationships is to primary
        relatedEntities.forEach((_re) => {
          if(primaryEntityIds.includes( (_re.entityId as unknown as string)+"")) {
            relatedToPrimaryEntityDirectly = true;
          } else if(!queriedEntityIds.includes(_re.entityId)){
            // when entity has a related entity that is not the primary or searched for user can hide/show it
            hasCollapsibleRelationships = true;
          }
        }); 
      }

      const relColorClasses = [];
      if(relatedEntRels && relatedEntRels.length) {
        //console.log('get color classes: ', relatedEntRels);
        relatedEntRels.forEach( (relEnt) => {
          if(relEnt.relationType == 'DISCLOSED_RELATION') { relColorClasses.push('graph-node-rel-disclosed'); }
          if(relEnt.relationType == 'POSSIBLE_MATCH') { relColorClasses.push('graph-node-rel-pmatch'); }
          if(relEnt.relationType == 'POSSIBLE_RELATION') { relColorClasses.push('graph-node-rel-prel'); }
        });
      } else if ( primaryEntities.indexOf( resolvedEntity.entityId ) > -1 ) {
        relColorClasses.push('graph-node-rel-primary');
      } else {
        //console.warn('no related ent rels for #'+ resolvedEntity.entityId +'.', entNode.relatedEntities, relatedEntRels);
      }

      // entitities who use this entity as it's source

      // Create Node
      entityIndex.push(entityId);
      const features = resolvedEntity.features;
      nodes.push({
        address: resolvedEntity.addressData && resolvedEntity.addressData.length > 0 ? resolvedEntity.addressData[0] : SzRelationshipNetworkComponent.firstOrNull(features, "ADDRESS"),
        areAllRelatedEntitiesOnDeck: false,
        coreRelationshipMatchKeyTokens: coreRelatedMatchKeyCategories,
        dataSources: resolvedEntity.recordSummaries.map((ds) =>  ds.dataSource ),
        entityId: entityId,
        hasCollapsedRelationships: relatedToPrimaryEntityDirectly && (relatedEntities && relatedEntities.length > 0),
        hasCollapsibleRelationships: hasCollapsibleRelationships,
        hasRelatedEdges: (relatedEntities && relatedEntities.length > 0),
        iconType: SzRelationshipNetworkComponent.getIconType(resolvedEntity),
        isCoreNode: coreEntityIds.includes(entityId),
        isHidden: !relatedToPrimaryEntityDirectly,
        isPrimaryEntity: primaryEntityIds.includes( (entityId as unknown as string)+""),
        isRelatedToPrimaryEntity: (relatedToPrimaryEntities.indexOf( (entityId as unknown as number) ) > -1),
        isRemovable: (!coreEntityIds.includes(entityId) && !primaryEntityIds.includes( (entityId as unknown as string)+"") && !queriedEntityIds.includes(entityId)),
        isQueriedNode: queriedEntityIds.includes(entityId),
        name: resolvedEntity.entityName,
        nodesVisibleBeforeExpand: [],
        numberRelated: relatedEntities ? relatedEntities.length : 0,
        numberRelatedOnDeck: 0,
        numberRelatedHidden: relatedEntities ? relatedEntities.length : 0,
        orgName: resolvedEntity.entityName,
        phone: resolvedEntity.phoneData && resolvedEntity.phoneData.length > 0 ? resolvedEntity.phoneData[0] : SzRelationshipNetworkComponent.firstOrNull(features, "PHONE"),
        recordSummaries: resolvedEntity.recordSummaries,
        relatedEntities: relatedEntities && relatedEntities.map ? relatedEntities.map((relEnt) => { return relEnt.entityId }) : undefined,
        relatedToPrimaryEntityDirectly: relatedToPrimaryEntityDirectly,
        relationshipMatchKeys: relatedMatchKeys,
        relationTypeClasses: relColorClasses,
        relatedEntitiesData: relatedEntities,
        relatedVisibleBeforeExpand: [],
        resolvedEntityData: resolvedEntity,
        relationshipMatchKeyTokens: relatedMatchKeyCategories,
        styles: [],
        visibilityClass: undefined
      });
    });

    // GRAPH CONSTRUCTED
    return {
      nodes: nodes
    };
  }

  addExistingNodeData(newData: {nodes: any[], links?: any[]}): {nodes: any[], links?: any[]} {
    if(this.node && this.node.data) {
      let existingData = this.node.data();
      let alreadyDrawnEntityIds = existingData.map((d) => {
        return d.entityId;
      });
      let newDataMinusAnyAlreadyExisting = newData.nodes.filter((_nn) => {
        return !alreadyDrawnEntityIds.includes(_nn.entityId);
      })
      newData.nodes = existingData.concat(newDataMinusAnyAlreadyExisting);
    }
    return newData
  }

  addLinksToNodeData(data: {nodes: any[], links?: any[]}): {nodes: any[], links?: any[]} {
    const links         = [];
    const linkIndex     = [];
    const usedLinks     = [];
    const entityIndex   = [];
    const entitiesData  = data && data.nodes ? data.nodes : [];

    //console.log('addLinksToNodeData: entities: ',entitiesData);
    if(entitiesData && entitiesData.forEach) {
      const matchKeyCategoriesByEntityId: {[key: number]: string[]} = {};

      entitiesData.forEach(entityInfo => {
        const resolvedEntity  = entityInfo;
        const entityId        = resolvedEntity.entityId;
        const relatedEntities = entityInfo.relatedEntitiesData && entityInfo.relatedEntitiesData.forEach ? entityInfo.relatedEntitiesData : [];
        entityIndex.push(entityId);

        relatedEntities.forEach(relatedEntity => {
          const relatedEntityId = relatedEntity.entityId;
          const linkArr = [entityId, relatedEntityId].sort();
          const linkKey = {firstId: linkArr[0], secondId: linkArr[1]};
          let _relatedMatchCategory = SzRelationshipNetworkComponent.tokenizeMatchKey(relatedEntity.matchKey);
          // match key tokens grouped by 'DERIVED' and 'DISCLOSED'
          let relatedMatchKeyCategories                 = _relatedMatchCategory;
          // flattened array of match key tokens
          let _matchKeyTokensFlattened                  = [];
          _relatedMatchCategory.forEach((mkeyCat)=>{
            _matchKeyTokensFlattened = _matchKeyTokensFlattened.concat(mkeyCat);
          });
          _matchKeyTokensFlattened  = _matchKeyTokensFlattened.sort();
          // de-dupe values
          _matchKeyTokensFlattened  = _matchKeyTokensFlattened.filter((value, index, self) => {
            return self.indexOf(value) === index;
          });
          let _ambiPos              = _matchKeyTokensFlattened.findIndex((val) => {
            return val && val.toLowerCase ? val.toLowerCase() === 'ambiguous' : val === 'Ambiguous';
          });
          if(_ambiPos > -1) {
            // pop out and push to end
            //console.log(`${_matchKeyTokensFlattened}[${_ambiPos}] = ${ambiVal}`);
            let ambiVal       = _matchKeyTokensFlattened.splice(_ambiPos,1)
            _matchKeyTokensFlattened.push(ambiVal);
          }
          // now add match key categories by entity id
          if(!matchKeyCategoriesByEntityId[ relatedEntityId ] || matchKeyCategoriesByEntityId[ relatedEntityId ] === undefined) {
            matchKeyCategoriesByEntityId[ relatedEntityId ] = [];
          }
          if(matchKeyCategoriesByEntityId[ relatedEntityId ] && matchKeyCategoriesByEntityId[ relatedEntityId ].concat) {
            matchKeyCategoriesByEntityId[ relatedEntityId ] = matchKeyCategoriesByEntityId[ relatedEntityId ].concat(_relatedMatchCategory[0]).concat(_relatedMatchCategory[1])
            
          }
          // de-dupe values
          matchKeyCategoriesByEntityId[ relatedEntityId ] = matchKeyCategoriesByEntityId[ relatedEntityId ].filter((value, index, self) => {
            return self.indexOf(value) === index;
          });

          if (!SzRelationshipNetworkComponent.hasKey(linkIndex, linkKey) && entityIndex.indexOf(relatedEntityId) !== -1) {
            linkIndex.push(linkKey);
            links.push({
              source: entityIndex.indexOf(entityId),
              target: entityIndex.indexOf(relatedEntityId),
              sourceEntityId: entityId,
              targetEntityId: relatedEntityId,
              matchLevel: relatedEntity.matchLevel,
              matchKey: relatedEntity.matchKey,
              matchKeyTokens: relatedMatchKeyCategories,
              matchKeyTokensFlat: _matchKeyTokensFlattened,
              relatedMatchKeyCategories: _relatedMatchCategory,
              isHidden: false,
              isCoreLink: false,
              id: linkIndex.indexOf(linkKey)
            });
          } else {
            usedLinks.push({
              source: entityIndex.indexOf(entityId),
              target: entityIndex.indexOf(relatedEntityId),
              sourceEntityId: entityId,
              targetEntityId: relatedEntityId,
              matchLevel: relatedEntity.matchLevel,
              matchKey: relatedEntity.matchKey,
              matchKeyTokens: relatedMatchKeyCategories,
              matchKeyTokensFlat: _matchKeyTokensFlattened,
              isHidden: false,
              isCoreLink: false,
              id: linkIndex.indexOf(linkKey)
            });
          }
        });
      });
    }
    data.links = links

    return data;
  }


  static firstOrNull(features, name) {
    return features && features[name] && [name].length !== 0 ? features[name][0]["FEAT_DESC"] : null;
  }

  static hasKey(usedLinks, linkKey) {
    return usedLinks.filter(key => key.firstId === linkKey.firstId && key.secondId === linkKey.secondId).length !== 0;
  }

  static getIconType(resolvedEntity) {
    let retVal = 'default';
    if(resolvedEntity && resolvedEntity.records) {
      resolvedEntity.records.slice(0, 9).forEach(element => {
        if(element.nameOrg || (element.addressData && element.addressData.some((addr) => addr.indexOf('BUSINESS') > -1))) {
          retVal = 'business';
        } else if(element.gender && (element.gender === 'FEMALE' || element.gender === 'F') ) {
          retVal = 'userFemale';
        } else if(element.gender && (element.gender === 'MALE' || element.gender === 'M') ) {
          retVal = 'userMale';
        }
      });
    }
    return retVal;
  }

  /**
   * This uses the RAW data model. It's incompatible with the non-raw data.
   * use getIconType with non-raw data instead.
   * @param resolvedEntity
   * @internal
   * @deprecated
   */
  static getIconTypeOld(resolvedEntity) {
    // Look for type information in the first 10 records.
    const recordsArr = resolvedEntity["RECORDS"].slice(0, 9);
    for (let i = 0; i < recordsArr.length; i++) {
      const elem = recordsArr[i];
      const data = elem["JSON_DATA"];
      if (data) {
        if (data["NAME_ORG"]) {
          return 'business';
        } else if (data["GENDER"] === 'FEMALE' || data["GENDER"] === 'F') {
          return 'userFemale';
        } else if (data["GENDER"] === 'MALE' || data["GENDER"] === 'M') {
          return 'userMale';
        }
      }
    }
    return 'default';
  }
  /** get sources summary lines as string array */
  private static sourcesAsStringArray(recordSummaryArray: any[], records: any[]): string[] {
    const retValue = [];

    for (let i = 0; i < recordSummaryArray.length; i++) {
      const entry = recordSummaryArray[i];
      if (entry.recordCount > 1) {
        retValue.push(`${ entry.dataSource } (${entry.recordCount})`);
      } else {
        const recordId = SzRelationshipNetworkComponent.getRecordId(records, entry.dataSource);
        retValue.push(`${ entry.dataSource } ${recordId}`);
      }
    }
    return retValue;
  }

  private static getRecordId(records: any[], targetDataSource: any) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record.dataSource === targetDataSource) {
        let recordId: string = record.recordId;

        const recordCharLimit = Math.max(this.SOURCE_LINE_CHAR_LIMIT - targetDataSource.toString().length - 1, this.MIN_RECORD_ID_LENGTH);

        if (recordId.toString().length > recordCharLimit) {
          recordId = recordId.substring(0, recordCharLimit) + '...';
        }
        return recordId;
      }
    }
    return '';
  }

  /** get array of datasources present in network data */
  public static getDataSourcesFromEntityNetworkData(data: SzEntityNetworkData): string[] {
    const _datasources = [];
    if(data && data.entities && data.entities.map) {
      // flatten first
      const entititiesDS = data.entities.map( (entity) => {
        if(entity.resolvedEntity.recordSummaries && entity.resolvedEntity.recordSummaries.map) {
          return entity.resolvedEntity.recordSummaries.map( (_ds) => _ds.dataSource);
        }
        return entity.resolvedEntity.recordSummaries;
      });
      entititiesDS.forEach( (element: string[]) => {
        if(element && element.forEach) {
          element.forEach( (_dsString: string) => {
            if(_datasources.indexOf(_dsString) === -1) {
              _datasources.push(_dsString);
            }
          });
        }
      });
    }
    return _datasources;
  }
  /** get array of match keys present in network data */
  public static getMatchKeysFromEntityNetworkData(data: SzEntityNetworkData): string[] {
    let _matchkeys = [];
    if(data && data.entities && data.entities.map) {
      let _entityRelatedMatchKeys = data.entities.map( (entity) => {
        let retVal = [];
        if(entity && entity.relatedEntities && entity.relatedEntities.map) {
          retVal = entity.relatedEntities.map( (relatedEntity: SzRelatedEntity) => {
            return relatedEntity.matchKey;
          });
        }
        return retVal;
      })
      if(_entityRelatedMatchKeys && _entityRelatedMatchKeys.reduce) {
        _matchkeys = _entityRelatedMatchKeys.reduce((accumulator, value) => accumulator.concat(value), []);
      }
      if(_matchkeys && _matchkeys.filter) {
        _matchkeys = _matchkeys.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
      }
    }
    return _matchkeys;
  }
  /** get array of match keys present in network data */
  public static getEntityMatchKeysFromEntityNetworkData(data: SzEntityNetworkData, coreEntityIds?: SzEntityIdentifier[]): {entityId: string|number, value: string, isCoreRelationship: boolean}[] {
    let _matchkeys = [];
    let _entitiesOnDeck   = [];
    if(data && data.entities && data.entities.map) {
      // first build a array of all entity Ids present
      _entitiesOnDeck     = data.entities.map((entity: SzEntityData) => {
        return entity.resolvedEntity.entityId;
      });
      if(coreEntityIds) {
        coreEntityIds = coreEntityIds.map(parseSzIdentifier);
      }
      let _entityRelatedMatchKeys = data.entities.map( (entity) => {
        let retVal = [];
        if(entity && entity.relatedEntities && entity.relatedEntities.map) {
          retVal = entity.relatedEntities.map( (relatedEntity: SzRelatedEntity) => {
            let isCoreRelationship = coreEntityIds && coreEntityIds.indexOf ? coreEntityIds.indexOf( entity.resolvedEntity.entityId ) > -1 : false;
            return { entityId: relatedEntity.entityId, value: relatedEntity.matchKey, isCoreRelationship: isCoreRelationship, coreEntities: coreEntityIds, relSource: entity.resolvedEntity.entityId};
          });
        }
        return retVal;
      })
      if(_entityRelatedMatchKeys && _entityRelatedMatchKeys.reduce) {
        _matchkeys = _entityRelatedMatchKeys.reduce((accumulator, value) => accumulator.concat(value), []);
      }
      if(_matchkeys && _matchkeys.filter) {
        // de-dupe
        _matchkeys = _matchkeys.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
        // only show match keys that have at least one glyph on deck
        _matchkeys = _matchkeys.filter((value, index, self) => {
          return _entitiesOnDeck.indexOf(value.entityId as number) > -1;
        });
      }
    }
    return _matchkeys;
  }
  public static getMatchKeysFromEntityData(data: SzEntityData[], coreEntityIds?: SzEntityIdentifier[]): {entityId: string|number, value: string, isCoreRelationship: boolean}[] {
    let _matchkeys = [];
    let _entitiesOnDeck   = [];
    if(data && data.map) {
      // first build a array of all entity Ids present
      _entitiesOnDeck     = data.map((entity: SzEntityData) => {
        return entity.resolvedEntity.entityId;
      });
      if(coreEntityIds) {
        coreEntityIds = coreEntityIds.map(parseSzIdentifier);
      }
      let _entityRelatedMatchKeys = data.map( (entity) => {
        let retVal = [];
        if(entity && entity.relatedEntities && entity.relatedEntities.map) {
          retVal = entity.relatedEntities.map( (relatedEntity: SzRelatedEntity) => {
            let isCoreRelationship = coreEntityIds && coreEntityIds.indexOf ? coreEntityIds.indexOf( entity.resolvedEntity.entityId ) > -1 : false;
            return { entityId: relatedEntity.entityId, value: relatedEntity.matchKey, isCoreRelationship: isCoreRelationship, coreEntities: coreEntityIds, relSource: entity.resolvedEntity.entityId};
          });
        }
        return retVal;
      })
      if(_entityRelatedMatchKeys && _entityRelatedMatchKeys.reduce) {
        _matchkeys = _entityRelatedMatchKeys.reduce((accumulator, value) => accumulator.concat(value), []);
      }
      if(_matchkeys && _matchkeys.filter) {
        // de-dupe
        _matchkeys = _matchkeys.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
        // only show match keys that have at least one glyph on deck
        _matchkeys = _matchkeys.filter((value, index, self) => {
          return _entitiesOnDeck.indexOf(value.entityId as number) > -1;
        });
      }
    }
    return _matchkeys;
  }
  /** 
   * takes a complex match key like "NAME+ADDRESS-DOB (Ambiguous)" and turns it in to 
   * an array of positive tokens like ["NAME","ADDRESS","Ambiguous"]. 
   * keys categorized as "disclosed" type(s) are return value position[0]. 
   * keys categorized as "derived" type(s) are return value position[1]. 
   */
  public static tokenizeMatchKey(matchKey: string) {
    let disclosedKeys = [];
    let derived_keys  = [];
    let _keyReg       = /(\+|\-)/;
    let _keyList      = matchKey && matchKey.split ? matchKey.split(_keyReg) : []
    //console.log('----- categorizeMatchKey: '+matchKey+'------', _keyList);

    _keyList.forEach((keyStr, _ind: number) => {
      if(['+'].includes(keyStr)) {
        // get next value in sequence
        keyStr  = _keyList[(_ind+1)];
        if(keyStr.indexOf('(') <= 0) {
          // derived
          derived_keys.push(keyStr);
        } else {
          // disclosed
          let leftSide        = keyStr.indexOf('(') > 0 && keyStr.toLowerCase().indexOf('ambiguous') > 0 ? keyStr.substring(0, keyStr.indexOf('(')) : undefined;
          let subKeys         = keyStr.substring(keyStr.indexOf('(')+1, keyStr.indexOf(')')).split(',');
          if(leftSide !== undefined) {
            derived_keys.push(leftSide);
          }
          // left side of colon is from this entity's point of view
          // but if blank, must use right side as both sides not required
          subKeys.forEach((dKey) => {
            if(dKey && dKey.indexOf(':') > -1){
              // has ':' point of direction type key
              let _dKeyMulti  = dKey.split(':');
              if(_dKeyMulti.length >= 1 && _dKeyMulti[0] && _dKeyMulti[0] !== '') {
                // we just want the left-hand side value
                _dKeyMulti = [_dKeyMulti[0]];
              } else if(_dKeyMulti[1]) {
                // if first value blank we want to take the second value
                _dKeyMulti = [_dKeyMulti[1]];
              }
              //console.log(`found ":" in ${dKey}`, _dKeyMulti);
              //strip out any empty values
              //.filter((dKeyValue: string) => {
              //  return dKeyValue && dKeyValue !== null && dKeyValue !== '';
              //})
              // strip out any duplicates
              //.filter((value, index, self) => {
              //  return self.indexOf(value) === index;
              //});
              disclosedKeys = disclosedKeys.concat(_dKeyMulti);
            } else {
              disclosedKeys.push(dKey);
            }
          });
        }
      }
    });

    return [disclosedKeys, derived_keys]
  }
  /**
   * Takes the data from a graph request and scans all entities found for relationship match keys.
   * match keys found are broken in to constituant tokens and classified as either 
   * "DISCLOSED" or "DERIVED" types. The members of the return value for "DERIVED" or "DISCLOSED" are
   * arrays of the entity ids found in the data that have that match key token present.
   */
  public static getMatchKeyTokensFromEntityData(data: SzEntityNetworkData, focalEntityIds?: SzEntityIdentifier[]) {
    let retValue: undefined | SzEntityNetworkMatchKeyTokens = {
      DISCLOSED: {},
      DERIVED: {}
    }
    // if we have focal entity id's add new "CORE" node to return value
    if(focalEntityIds) {
      retValue.CORE = {
        DISCLOSED: {},
        DERIVED: {}
      }
    }
    let relatedMatchKeys = SzRelationshipNetworkComponent.getEntityMatchKeysFromEntityNetworkData(data, focalEntityIds);
    let categorizedMatchKeys: {entityId: string | number, disclosed: string[], derived: string[], isCoreRelationship: boolean}[]  = relatedMatchKeys
    .map((matchKeyResult) => {
      let entityMatchKeys = SzRelationshipNetworkComponent.tokenizeMatchKey(matchKeyResult.value);
      return {entityId: matchKeyResult.entityId, disclosed: entityMatchKeys[0], derived: entityMatchKeys[1], isCoreRelationship: matchKeyResult.isCoreRelationship }
    });

    categorizedMatchKeys.forEach((entityMatchKeysResult) => {
      entityMatchKeysResult.disclosed.forEach((entityDisclosedMatchKey) => {
        // if core link and we're returning that option add to core derived
        if(retValue && retValue.CORE && entityMatchKeysResult.isCoreRelationship) {
          if(!retValue.CORE.DISCLOSED[entityDisclosedMatchKey]) { retValue.CORE.DISCLOSED[entityDisclosedMatchKey] = []; }
          if(retValue.CORE.DISCLOSED[entityDisclosedMatchKey].indexOf(entityMatchKeysResult.entityId) <= -1){ 
            retValue.CORE.DISCLOSED[entityDisclosedMatchKey].push(entityMatchKeysResult.entityId);
          }
        }
        // if there is no current key in disclosed create it
        if(!retValue.DISCLOSED[entityDisclosedMatchKey]) { retValue.DISCLOSED[entityDisclosedMatchKey] = []; }
        // if match key doesnt already have entityId add it
        if(retValue.DISCLOSED[entityDisclosedMatchKey].indexOf(entityMatchKeysResult.entityId) <= -1){ 
          retValue.DISCLOSED[entityDisclosedMatchKey].push(entityMatchKeysResult.entityId);
        }
      });
      entityMatchKeysResult.derived.forEach((entityDerivedMatchKey) => {
        // if core link and we're returning that option add to core derived
        if(retValue && retValue.CORE && entityMatchKeysResult.isCoreRelationship) {
          if(!retValue.CORE.DERIVED[entityDerivedMatchKey]) { retValue.CORE.DERIVED[entityDerivedMatchKey] = []; }
          if(retValue.CORE.DERIVED[entityDerivedMatchKey].indexOf(entityMatchKeysResult.entityId) <= -1){ 
            retValue.CORE.DERIVED[entityDerivedMatchKey].push(entityMatchKeysResult.entityId);
          }
        }
        // if there is no current key in derived create it
        if(!retValue.DERIVED[entityDerivedMatchKey]) { retValue.DERIVED[entityDerivedMatchKey] = []; }
        // if match key doesnt already have entityId add it
        if(retValue.DERIVED[entityDerivedMatchKey].indexOf(entityMatchKeysResult.entityId) <= -1){ 
          retValue.DERIVED[entityDerivedMatchKey].push(entityMatchKeysResult.entityId);
        }
      });
    });
    return retValue;
  }
  private getMatchKeyTokensFromEntityPreflightData(derdah: SzEntityData[], focalEntityIds?: SzEntityIdentifier[]) {
    let retValue: undefined | SzEntityNetworkMatchKeyTokens = {
      DISCLOSED: {},
      DERIVED: {}
    }
    // if we have focal entity id's add new "CORE" node to return value
    if(focalEntityIds) {
      retValue.CORE = {
        DISCLOSED: {},
        DERIVED: {}
      }
    }
    let relatedMatchKeys = SzRelationshipNetworkComponent.getMatchKeysFromEntityData(derdah, focalEntityIds);
    let categorizedMatchKeys: {entityId: string | number, disclosed: string[], derived: string[], isCoreRelationship: boolean}[]  = relatedMatchKeys
    .map((matchKeyResult) => {
      let entityMatchKeys = SzRelationshipNetworkComponent.tokenizeMatchKey(matchKeyResult.value);
      return {entityId: matchKeyResult.entityId, disclosed: entityMatchKeys[0], derived: entityMatchKeys[1], isCoreRelationship: matchKeyResult.isCoreRelationship }
    });
    console.log('getMatchKeyTokensFromEntityPreflightData: ', relatedMatchKeys, categorizedMatchKeys);
  }
}