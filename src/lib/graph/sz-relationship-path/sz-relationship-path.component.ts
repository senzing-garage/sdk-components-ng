import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnInit, ViewChild } from '@angular/core';
import { Simulation } from 'd3-force';
import { Graph, LinkInfo, NodeInfo } from '../sz-relationship-network/graph-types';
import { EntityGraphService, SzDetailLevel } from '@senzing/rest-api-client-ng';
import { map } from 'rxjs/operators';
import * as d3 from 'd3';
import { Subject } from 'rxjs';

@Component({
  selector: 'sz-relationship-path',
  templateUrl: './sz-relationship-path.component.html',
  styleUrls: ['./sz-relationship-path.component.scss']
})
export class SzRelationshipPathComponent implements OnInit, AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

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

  /** svg element */
  @ViewChild('graphEle', {static: false}) svgComponent: ElementRef;
  public svgElement: SVGElement;

  // assigned during render phase to D3 selector groups
  private svg: any;
  private linkGroup: any;

  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statWidth: number = 800;
  /**
   * sets the width of the component
   */
  @HostBinding('style.width.px')@Input() svgWidth;

  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statHeight: number = 400;
  /**
   * sets the height attribute of the svg.
   * @deprecated svg is always 100% of parent dom elements height
   */
  @HostBinding('style.height.px')@Input() svgHeight: string;

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

  /**
   * the space between nodes
   */
  private _linkGravity = 8;
  @Input() public set linkGravity(value: number) { this._linkGravity = value; }


  private _port: number;
  @Input() set port(value: string) { this._port = +value; }

  private _excludeIds: string[];
  @Input() set excludeIds(value: string) {
    console.log("Finding commas");
    if(value && value.indexOf(',')) {
      this._excludeIds = value.split(',');
      console.log("Split done");
    } else {
      this._excludeIds = [value];
      console.log("No split done");
    }
  }

  private _from: string;
  @Input() public set from(value: string) { 
    this._from = value;
  }
  public get from(): string { return this._from; }

  private _to: string;
  @Input() public set to(value: string) { 
    this._to = value; 
  }
  public get to(): string { return this._to; }

  private _maxDegrees: number;
  @Input() set maxDegrees(value: string) { this._maxDegrees = +value; }

  static readonly WITH_RAW: boolean = true;
  static readonly WITHOUT_RAW: boolean = true;

  private _showLinkLabels: any = false;
  @Input() public set showLinkLabels(value: boolean) { this._showLinkLabels = value; }
  public get showLinkLabels(): boolean { return this._showLinkLabels; }



  node;
  nodeLabel;
  link;
  linkLabel;
  forceSimulation: Simulation<NodeInfo, LinkInfo>;
  linkedByNodeIndexMap;


  constructor(
    private graphService: EntityGraphService,
  ) {
    this.linkedByNodeIndexMap = {};
  }

  ngOnInit() {
    // !!!! logic moved to ngAfterViewInit
    // !!!! as of NG10 ViewChild(Ref) is no longer available at 
    // !!!! time of view init
    /*
    // get dom element reference to svg tag
    this.svgElement = (this.svgComponent.nativeElement as SVGSVGElement);

    if (this.from === undefined || this.from.length === 0 ||
        this.to === undefined || this.to.length === 0) {
      console.log("No EntityIDs passed in to " + this);
      return;
    }
    console.log("Making calls!");
    this.getPath().pipe(
      map(SzRelationshipPathComponent.asGraph),
    ).subscribe( this.addSvg.bind(this) );
    */
  }

  ngAfterViewInit() {
    // get dom element reference to svg tag
    // console.warn('SzRelationshipPathComponent.ngAfterViewInit: what kind of element is svgComponent? ', this.svgComponent);
    this.svgElement = (this.svgComponent.nativeElement as SVGSVGElement);

    if (this.from === undefined || this.from.length === 0 ||
        this.to === undefined || this.to.length === 0) {
      console.warn("SzRelationshipPathComponent.ngAfterViewInit: No EntityIDs passed in to " + this);
      return;
    }
    // console.log("Making calls!");
    this.getPath().pipe(
      map(SzRelationshipPathComponent.asGraph),
    ).subscribe( this.addSvg.bind(this) );
  }


  private getPath() {
    return this.graphService.findEntityPath(
      this._from,
      this._to,
      this._maxDegrees,
      this._excludeIds,
      undefined,
      true,
      undefined,
      SzDetailLevel.MINIMAL,
      undefined,
      undefined,
      undefined,
      undefined,
      SzRelationshipPathComponent.WITHOUT_RAW );
  }

  addSvg(graph: Graph, parentSelection = d3.select("body")) {
    console.log("Okay, let's do this!", graph);
    const tooltip = parentSelection
      .append("div")
      .attr("class", "sz-graph-tooltip")
      .style("opacity", 0);


    // Add the SVG to the HTML body
    this.svg = d3.select( this.svgElement );

    /*
 * If you're unfamiliar with selectors acting like a join (starting in d3.v4), here's where things may be confusing.
 *   selectAll(...)                   selects all elements in the DOM (that match the selector's value).
 *   selectAll(...).data(...)         selects the intersection of items both in the DOM and in data.
 *   selectAll(...).data(...).enter() selects new items that are in data but not yet in the DOM.  Usually followed by append(...).
 *   selectAll(...).data(...).exit()  selects old items that are in the DOM but no longer in data.  Usually followed by remove().
 *
 * A lot of D3 examples are v3, where selectAll(...).data(...) selected existing items AND new items.  In v4+ if you
 *   want to select both new and existing elements, you call existingItems.merge(newItems).  I don't do that in this
 *   code, but there's an excellent example at https://bl.ocks.org/mbostock/3808218.
 */

    // Add link groups (line + label)
    const linkGroup = this.svg.selectAll('.sz-graph-link')
      .data(graph.links)
      .enter();

    // Add the lines, except we're not defining how they're drawn here.  That happens in tick()
    this.link = linkGroup.append('path')
      .attr('class', 'sz-graph-core-link')
      .attr('id', d => d.id); // This lets SVG know which label goes with which line

    // Add link labels
    if (this.showLinkLabels) {
      // TODO Append link labels after initialization on showLinkLabels change.
      this.linkLabel = linkGroup.append('svg:text')
        .attr('text-anchor', 'middle')
        .attr('class', 'sz-graph-link-label')
        .attr('dy', -3)
        .append('textPath')
        .attr('class', 'sz-graph-core-link-text')
        .attr('startOffset', '50%')
        .attr('xlink:href', d => '#' + d.id) // This lets SVG know which label goes with which line
        .text(d => d.matchKey);
    }

    // Add Nodes.  Adding the nodes after the links is important, because svg doesn't have a z axis.  Later elements are
    //   drawn on top of earlier elements.
    this.node = this.svg.selectAll('.sz-graph-node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'sz-graph-node');
    /*
    // Add an SVG icon for the person's face.  This hides the links so they're not visible through the face.
    this.node.filter(d => d.iconType !== "business" && SzRelationshipPathComponent.ICONS[d.iconType])
      .append('path')
      .attr('class', 'sz-graph-icon-enclosure')
      .attr('d', d => SzRelationshipPathComponent.ICONS[d.iconType]["enclosed"])
      .attr("transform", "translate(-25,-28) scale(0.05)");*/

    // Add an SVG circle for the person's face.  This hides the links so they're not visible through the face.
    this.node.filter(d => d.iconType !== "business" && SzRelationshipPathComponent.ICONS[d.iconType])
      //.append('path')
      .append('circle')
      .attr('class', function(d) {
        return ['sz-graph-icon-enclosure'].concat(d.relationTypeClasses).join(' ');
      })
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 15);

    //.attr('d', d => SzRelationshipNetworkComponent.ICONS[d.iconType]["enclosed"])
    //.attr("transform", "translate(-20,-20) scale(.080)");

    // Add an SVG icon for the person.
    this.node.filter(d => d.iconType !== "business")
      .append('path')
      .attr('class', function(d) {
        return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ');
      })
      .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
      .attr("d", d => SzRelationshipPathComponent.ICONS[d.iconType] ?
                      SzRelationshipPathComponent.ICONS[d.iconType]["shape"] :
                      SzRelationshipPathComponent.ICONS["default"]["shape"])
      .attr("transform", "translate(-20,-20) scale(.080)");

    // add svg mask for business so you cant click through the surface
    // two rectangles that fill in the building path
    this.node.filter(d => d.iconType === "business")
      .append('rect')
      .attr('x', 2.03)
      .attr('y', 3.048)
      .attr('width', 9.898)
      .attr('height', 17.939)
      .attr('class', 'sz-graph-business-icon-enclosure')
      .attr("transform", "translate(-20,-20) scale(1.4)");
    this.node.filter(d => d.iconType === "business")
      .append('rect')
      .attr('x', 11.966)
      .attr('y', 7.068)
      .attr('width', 9.974)
      .attr('height', 13.918)
      .attr('class', 'sz-graph-business-icon-enclosure')
      .attr("transform", "translate(-20,-20) scale(1.4)");

    // Add svg icon for business (corps are not people)
    this.node.filter(d => d.iconType === "business")
    .append('path')
    .attr('class', function(d) {
      return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ');
    })
    .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
    .attr("d", d => SzRelationshipPathComponent.ICONS[d.iconType] ?
                    SzRelationshipPathComponent.ICONS[d.iconType]["shape"] :
                    SzRelationshipPathComponent.ICONS["default"]["shape"])
    .attr("transform", "translate(-20,-20) scale(1.4)");

    this.node.each(d => {
      d.x = this._statWidth / 2;
      d.y = this._statHeight / 2;
    });

    // Add node labels
    this.nodeLabel = this.node.append("svg:text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("y", 33)
      .attr("class", "sz-graph-label")
      .text(d => d.name.length > 18 ? d.name.substring(0, 15).trim() + "..." : d.name);

    // Adds a background underneath the node labels.  This label is mostly opaque so that the label is still legible in
    //   busy areas of a network.
    const nodeLabelBBoxAry = [];
    this.nodeLabel.each(function (d, i) {
      nodeLabelBBoxAry[i] = this.getBBox();
    });

    // Text background
    this.node.insert('svg:rect', 'text')
      .attr('x', (d, i) => nodeLabelBBoxAry[i].x)
      .attr('y', (d, i) => nodeLabelBBoxAry[i].y)
      .attr('width', (d, i) => nodeLabelBBoxAry[i].width)
      .attr('height', (d, i) => nodeLabelBBoxAry[i].height)
      .attr('class', "sz-graph-bbox");

    // Define the simulation with nodes, forces, and event listeners.
    /*
    this.forceSimulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink().links(graph.links).distance(this._svgWidth / 8)) // links pull nodes together
      .force('charge', d3.forceManyBody().strength(-100)) // nodes repel each other
      .force('center', d3.forceCenter(this._svgWidth / 2, this._svgHeight / 2)) // Make all nodes start near the center of the SVG
      .force('x', d3.forceX(this._svgWidth / 2).strength(0.01)) // x and y continually pull all nodes toward a point.  If the
      .force('y', d3.forceY(this._svgHeight / 2).strength(0.01)) //  graph has multiple networks, this keeps them on screen
      .on('tick', this.tick.bind(this));*/
    
    this.forceSimulation = d3.forceSimulation(graph.nodes)
    .force('link', d3.forceLink().links(graph.links).distance(this._statWidth / this._linkGravity)) // links pull nodes together
    .force('charge', d3.forceManyBody().strength(-30)) // nodes repel each other
    .force('x', d3.forceX(this._statWidth / 2).strength(0.05)) // x and y continually pull all nodes toward a point.  If the
    .force('y', d3.forceY(this._statHeight / 2).strength(0.05)) //  graph has multiple networks, this keeps them on screen
    .on('tick', this.tick.bind(this));

    // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
    this.node.on('mouseover.tooltip', function (event, d) {
      tooltip.transition()
        .duration(300)
        .style("opacity", .8);
      tooltip.html(SzRelationshipPathComponent.nodeTooltipText(d))
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
      .on('mouseover.fade', this.fade(0.1).bind(this))
      .on("mouseout.tooltip", function () {
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      })
      .on('mouseout.fade', this.fade(1).bind(this))
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX) + "px")
          .style("top", (event.pageY + 10) + "px");
      });

    // Make the tooltip visible when mousing over links.  Fade out distant nodes
    this.link.on('mouseover.fade', this.linkFade(0.1).bind(this))
      .on('mouseover.tooltip', function (event, d) {
        tooltip.transition()
          .duration(300)
          .style("opacity", .8);
        tooltip.html(SzRelationshipPathComponent.linkTooltipText(d))
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout.tooltip", function () {
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      })
      .on('mouseout.fade', this.linkFade(1).bind(this))
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX) + "px")
          .style("top", (event.pageY + 10) + "px");
      });

    graph.links.forEach( this.registerLink.bind(this) );

  }

  private registerLink(d) {
    const source : NodeInfo = <NodeInfo> d.source;
    const target : NodeInfo = <NodeInfo> d.target;
    this.linkedByNodeIndexMap[`${source.index},${target.index}`] = 1;
  }

  static linkTooltipText(d) {
    return "<strong>From</strong>: " + d.source.name +
      "<br/><strong>To</strong>: " + d.target.name +
      "<br/><strong>Match Level</strong>: " + d.matchLevel +
      "<br/><strong>Match Key</strong>: " + d.matchKey;
  }

  static nodeTooltipText(d) {
    return "<strong>Entity ID</strong>: " + d.entityId +
      "<br/><strong>Name</strong>: " + d.name +
      "<br/><strong>Address</strong>: " + d.address +
      "<br/><strong>Phone</strong>: " + d.phone;
  }

  isConnected(a, b) {
    return this.linkedByNodeIndexMap[`${a.index},${b.index}`] ||
      this.linkedByNodeIndexMap[`${b.index},${a.index}`] ||
      a.index === b.index;
  }

  //Fade rules for hovering over nodes
  fade(opacity) {
    const isConnectedLocal = this.isConnected.bind(this);
    return d => {
      this.node.transition().duration(100).style('opacity', function (o) {
        const thisOpacity = isConnectedLocal(d, o) ? 1 : opacity;
        this.setAttribute('fill-opacity', thisOpacity);
        return thisOpacity;
      });

      this.link.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      if (this.showLinkLabels) {
        this.linkLabel.transition().duration(100).style('opacity', opacity);
      }
    };
  }

  // Fade Rules for hovering over links
  // As currently implemented, any nodes that are connected to both source and target are not faded out.
  linkFade(opacity) {
    const isConnectedLocal = this.isConnected.bind(this);
    return d => {
      this.node.transition().duration(100).style('opacity', function (o) {
        const thisOpacity = isConnectedLocal(d.source, o) &&
        isConnectedLocal(d.target, o) ? 1 : opacity;
        this.setAttribute('fill-opacity', thisOpacity);
        return thisOpacity;
      });

      this.link.transition().duration(100).style('opacity', o => (o.source === d.source && o.target === d.target ? 1 : opacity));
      if (this.showLinkLabels) {
        this.linkLabel.transition().duration(100).style('opacity', opacity);
      }
    };
  }

  /**
   * Update the SVG to show changes in node position caused by either the user or D3's forces
   * Not called when D3's forces reach equilibrium
   */
  tick() {
    // Update the SVG for each .node
    
    this.node.attr("transform", d => "translate(" + d.x + "," + d.y + ")")
      .call(d3.drag()             // TODO Update dragging code to use v5 conventions for event listening
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)));

    // Update link SVG
    // Draws left to right so .link-label stay right-side up
    this.link.attr('d', d => (d.source.x < d.target.x) ?
      SzRelationshipPathComponent.linkSvg(d.source, d.target) :
      SzRelationshipPathComponent.linkSvg(d.target, d.source));

    // Show or hide .link-label
    if (this.showLinkLabels) {
      d3.selectAll('.link-label').attr('opacity', 100);
    } else {
      d3.selectAll('.link-label').attr('opacity', 0);
    }
  }

  /**
   * Generate SVG commands for a straight line between two nodes, always left-to-right.
   */
  static linkSvg(leftNode, rightNode) {
    return 'M' + leftNode.x + ',' + leftNode.y + 'L' + rightNode.x + ',' + rightNode.y;
  }

  /**
   * When the user clicks and drags and node, 'Re-heat' the simulation if nodes have stopped moving.
   *   To oversimplify, alpha is the rate at which the simulation advances.
   *   alpha approaches alphaTarget at a rate of alphaDecay.
   *   The simulation stops once alpha < alphaMin.
   *   Restart sets alpha back to 1.
   */
  dragstarted(event) {
    if (!event.active) this.forceSimulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  /**
   * Update the position of the dragged node while dragging.
   */
  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  /**
   * Allows the simulation to 'cool' to the point that nodes stop moving.
   *   The simulation does not stop while alphaTarget (default 0, set at 0.3 by dragstarted) > alphaMin (default 0.001)
   */
  dragended(event) {
    if (!event.active) this.forceSimulation.alphaTarget(0);

    event.subject.fx = null;
    event.subject.fy = null;
  }

  //////////////////
  // DATA MAPPING //
  //////////////////

  static asGraph(rawTextOrJson) {
    let data = (rawTextOrJson instanceof Object) ? rawTextOrJson : JSON.parse(rawTextOrJson);

    // The input can either be the output of the engine's findPathByEntityID or findPathByRecordID methods
    //   or the response body of a call to the REST API's /entity-paths.
    if (data["rawData"]) data = data["rawData"];
    const entityPaths = data["ENTITY_PATHS"];
    const entitiesData = data["ENTITIES"];
    const entityPath = entityPaths[0];
    const entityIds = entityPath["ENTITIES"];
    const nodeCount = entityIds.length;


    const nodes = [];
    const links = [];

    if (nodeCount > 0) {
      // Add a node for each resolved entity
      for (let i = 0; i < nodeCount; i++) {
        nodes[i] = SzRelationshipPathComponent.asNode(entitiesData, entityIds, i);
      }
      for (let j = 0; j < nodeCount - 1; j++) {
        const relatedEntityInfo = SzRelationshipPathComponent.findRelatedEntityInfo(SzRelationshipPathComponent.findEntityInfo(entitiesData, entityIds[j]), entityIds[j + 1]);
        links[j] = {
          id: j,
          source: j,
          target: j + 1,
          matchLevel: relatedEntityInfo["MATCH_LEVEL"],
          matchKey: relatedEntityInfo["MATCH_KEY"]
        };
      }
    } else {
      nodes[0] = SzRelationshipPathComponent.asNode(entitiesData, [entityPath['START_ENTITY_ID']], 0);
      nodes[1] = SzRelationshipPathComponent.asNode(entitiesData, [entityPath['END_ENTITY_ID']], 0);
    }
    return {
      nodes: nodes,
      links: links
    };
  }

  private static asNode(entitiesData, entityIds, i: number) {
    const entityInfo = SzRelationshipPathComponent.findEntityInfo(entitiesData, entityIds[i]);
    const resolvedEntity = entityInfo['RESOLVED_ENTITY'];
    const features = resolvedEntity['FEATURES'];

    return {
      entityId: entityIds[i],
      id: resolvedEntity['ENTITY_ID'],
      iconType: SzRelationshipPathComponent.getIconType(resolvedEntity),
      orgName: resolvedEntity['ENTITY_NAME'],
      name: SzRelationshipPathComponent.firstOrNull(features, 'NAME'),
      address: SzRelationshipPathComponent.firstOrNull(features, 'ADDRESS'),
      phone: SzRelationshipPathComponent.firstOrNull(features, 'PHONE')
    };
  }

  private static firstOrNull(features, name: string) {
    return (features && features[name] && !features[name].isEmpty) ? features[name][0]["FEAT_DESC"] : null;
  }

  static findEntityInfo(entitiesData, entityId) {
    for (let i = 0; i < entitiesData.length; i++) {
      if (entitiesData[i]["RESOLVED_ENTITY"]["ENTITY_ID"] === entityId) return entitiesData[i];
    }
    return undefined;
  }

  private static findRelatedEntityInfo(entityData, relatedEntityId) {
    const relatedEntityData = entityData["RELATED_ENTITIES"];
    for (let i = 0; i < relatedEntityData.length; i++) {
      if (relatedEntityData[i]["ENTITY_ID"] === relatedEntityId) return relatedEntityData[i];
    }
  }

  /**
   * Determines which icon should be shown for this node.
   *
   * @param resolvedEntity The entity for the node being drawn.
   * @returns the key for the icon's SVG.
   */
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
}
