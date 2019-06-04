import { Component, Input, HostBinding, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { Graph, NodeInfo, LinkInfo } from './graph-types';
import { Simulation } from 'd3-force';
import { EntityGraphService, SzEntityNetworkResponse, SzEntityNetworkData } from '@senzing/rest-api-client-ng';
import { map, tap } from 'rxjs/operators';

/**
 * Provides a SVG of a relationship network diagram via D3.
 * @export
 */
@Component({
  selector: 'sz-relationship-network',
  templateUrl: './sz-relationship-network.component.html',
  styleUrls: ['./sz-relationship-network.component.scss']
})
export class SzRelationshipNetworkComponent implements OnInit, AfterViewInit {

  static readonly ICONS = {
    business: null, // TODO replace the business .png with SVG
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

  @ViewChild('graphEle') svgComponent;
  public svgElement: SVGSVGElement;

  private _showLinkLabels: any = false;
  @Input() public set showLinkLabels(value: boolean) {this._showLinkLabels = value; }
  public get showLinkLabels(): boolean { return this._showLinkLabels; }


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
  @Input() public set svgViewBox(value: string){ this._svgViewBox = value; }
  /**
   * gets the viewBox attribute on the svg element.
   */
  public get svgViewBox(){ return this._svgViewBox; }

  /**
   * the preserveAspectRatio attribute on the svg element.
   * @interal
   */
  private _preserveAspectRatio: string = "xMidYMid meet";
   /**
   * sets the preserveAspectRatio attribute on the svg element.
   * used to set aspect ratio, centering etc for dynamic scaling.
   */
  @Input() public set svgPreserveAspectRatio(value: string){ this._preserveAspectRatio = value; }
  /**
   * gets the preserveAspectRatio attribute on the svg element.
   */
  public get svgPreserveAspectRatio(){ return this._preserveAspectRatio; }

  /** @internal */
  private _entityIds: string[];

  /**
   * Set the entityIds of the src entities to do discovery search around.
   */
  @Input() set entityIds(value: string | number | number[]) {
    if(value && typeof value === 'string'){
      if(value && value.indexOf(',')) {
        // string array
        const sArr = value.split(',');
        this._entityIds = sArr;
      } else {
        // single string
        this._entityIds = [value];
      }
    } else if(value && typeof value === 'number'){
      // single number
      this._entityIds = [ value.toString() ];
    } else if(value){
      // the only other thing it could be is number[]
      this._entityIds = value.toString().split(',');
    }
  }

  /**
   * amount of degrees of separation to populate the graph with
   */
  private _maxDegrees: number;
  @Input() set maxDegrees(value: string) { this._maxDegrees = +value; }

  private _buildOut: number;
  @Input() set buildOut(value: string) { this._buildOut = +value; }

  /**
   * maxiumum entities to display
   */
  private _maxEntities: number;
  @Input() set maxEntities(value: string) { this._maxEntities = +value; }

  /**
   * the space between nodes
   */
  private _linkGravity = 8;
  @Input() public set linkGravity(value: number){ this._linkGravity = value; }

  /**
   * name label padding
   */
  private _labelPadding = 8;
  @Input() public set labelPadding(value: number){ this._labelPadding = value; }

  /**
   * return the raw data node in the payload
   */
  static readonly WITH_RAW: boolean = true;

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
    // get dom element reference to svg tag
    this.svgElement = (this.svgComponent.nativeElement as SVGSVGElement);

    if (this._entityIds === undefined || this._entityIds.length === 0) {
      console.log("No EntityIDs passed in to " + this);
      return;
    }
  }

  /** make network request and populate svg */
  ngAfterViewInit() {
    this.getNetwork().pipe(
      map(this.asGraph.bind(this)),
      tap( (gdata: Graph) => { console.log('SzRelationshipNetworkGraph: g1 = ', gdata); })
    ).subscribe( this.addSvg.bind(this) );
  }

  /**
   * make graph network request using input parameters
   */
  private getNetwork() {
    return this.graphService.findNetworkByEntityID(
      this._entityIds,
      this._maxDegrees,
      this._buildOut,
      this._maxEntities,
      SzRelationshipNetworkComponent.WITH_RAW );
  }

  /** render svg elements from graph data */
  addSvg(graph: Graph, parentSelection = d3.select("body")) {
    const tooltip = parentSelection
      .append("div")
      .attr("class", "sz-graph-tooltip")
      .style("opacity", 0);

    // Add the SVG to the HTML body
    const svg = d3.select( this.svgElement );

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
    const linkGroup = svg.selectAll('.sz-graph-link')
      .data(graph.links)
      .enter();

    // Add the lines, except we're not defining how they're drawn here.  That happens in tick()
    this.link = linkGroup.append('path')
      .attr('class', d => d.isCoreLink ? 'sz-graph-core-ink' : 'sz-graph-link')
      .attr('id', d => d.id); // This lets SVG know which label goes with which line

    // Add link labels
    if (this.showLinkLabels) {
      // TODO Append link labels after initialization on showLinkLabels change.
      this.linkLabel = linkGroup.append('svg:text')
        .attr('text-anchor', 'middle')
        .attr('class', 'sz-graph-link-label')
        .attr('dy', -3)
        .append('textPath')
        .attr('class', d => d.isCoreLink ? 'sz-graph-core-link-text' : 'sz-graph-link-text')
        .attr('startOffset', '50%')
        .attr('xlink:href', d => '#' + d.id) // This lets SVG know which label goes with which line
        .text(d => d.matchKey);
    }

    // Add Nodes.  Adding the nodes after the links is important, because svg doesn't have a z axis.  Later elements are
    //   drawn on top of earlier elements.
    this.node = svg.selectAll('.sz-graph-node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'sz-graph-node');

    // Add node labels
    this.nodeLabel = this.node.append("svg:text")
    .attr("text-anchor", "middle")
    .attr("dy", ".25em")
    .attr("y", 25)
    .attr("class", "sz-graph-label")
    .text(d => {
      return d && d.name && d.name.length > 18 ? d.name.substring(0, 15).trim() + "..." : d.name;
    });

    // Adds a background underneath the node labels.  This label is mostly opaque so that the label is still legible in
    //   busy areas of a network.
    const nodeLabelBBoxAry = [];
    this.nodeLabel.each(function (d, i) {
      nodeLabelBBoxAry[i] = this.getBBox();
      });

    // Text background
    this.node.insert('svg:rect', 'text')
      .attr('x', (d, i) => nodeLabelBBoxAry[i].x - (this._labelPadding / 2))
      .attr('y', (d, i) => nodeLabelBBoxAry[i].y - (this._labelPadding / 2))
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', (d, i) => nodeLabelBBoxAry[i].width + this._labelPadding)
      .attr('height', (d, i) => nodeLabelBBoxAry[i].height + this._labelPadding)
      .attr('class', "sz-graph-bbox");

    // Add an SVG circle for the person's face.  This hides the links so they're not visible through the face.
    this.node.filter(d => d.iconType !== "business" && SzRelationshipNetworkComponent.ICONS[d.iconType])
      //.append('path')
      .append('circle')
      .attr('class', function(d){
        return ['sz-graph-icon-enclosure'].concat(d.relationTypeClasses).join(' ')
      })
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 15);

      //.attr('d', d => SzRelationshipNetworkComponent.ICONS[d.iconType]["enclosed"])
      //.attr("transform", "translate(-20,-20) scale(.080)");

    // Add an SVG icon for the person.
    this.node.filter(d => d.iconType !== "business")
      .append('path')
      .attr('class', function(d){
        return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ')
      })
      .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
      .attr("d", d => SzRelationshipNetworkComponent.ICONS[d.iconType] ?
                      SzRelationshipNetworkComponent.ICONS[d.iconType]["shape"] :
                      SzRelationshipNetworkComponent.ICONS["default"]["shape"])
      .attr("transform", "translate(-20,-20) scale(.080)");

    // Add .png icons for businesses
    // TODO replace .png business icon with SVG
    this.node.filter(d => d.iconType === "business")
      .append('image')
      .attr("xlink:href", d => {
        const nodeType = d.isQueriedNode ? 'queried' : d.isCoreNode ? 'core' : 'buildout';
        return "../img/icons8-building-50-" + nodeType + ".png";
      })
      .attr("x", -20)
      .attr("y", -20)
      .attr("height", 50)
      .attr("width", 50)
      .attr('class', "sz-graph-icon " + (d => d.isQueriedNode ? 'sz-graph-queried-node' : d.isCoreNode ? 'sz-graph-core-node' : 'sz-graph-node'));

    // Define the simulation with nodes, forces, and event listeners.
    this.forceSimulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink().links(graph.links).distance(this._statWidth / this._linkGravity)) // links pull nodes together
      .force('charge', d3.forceManyBody().strength(-600)) // nodes repel each other
      .force('center', d3.forceCenter(this._statWidth / 2, this._statHeight / 2)) // Make all nodes start near the center of the SVG
      //.force('x', d3.forceX(this._statWidth / 2).strength(0.01)) // x and y continually pull all nodes toward a point.  If the
      //.force('y', d3.forceY(this._statHeight / 2).strength(0.01)) //  graph has multiple networks, this keeps them on screen
      .on('tick', this.tick.bind(this));

    // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
    this.node.on('mouseover.tooltip', function (d) {
      tooltip.transition()
        .duration(300)
        .style("opacity", .8);
      tooltip.html(SzRelationshipNetworkComponent.nodeTooltipText(d))
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY + 10) + "px");
    })
      .on('mouseover.fade', this.fade(0.1).bind(this))
      .on("mouseout.tooltip", function () {
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      })
      .on('mouseout.fade', this.fade(1).bind(this))
      .on("mousemove", function () {
        tooltip.style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 10) + "px");
      });

    // Make the tooltip visible when mousing over links.  Fade out distant nodes
    this.link.on('mouseover.fade', this.linkFade(0.1).bind(this))
      .on('mouseover.tooltip', function (d) {
        tooltip.transition()
          .duration(300)
          .style("opacity", .8);
        tooltip.html(SzRelationshipNetworkComponent.linkTooltipText(d))
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 10) + "px");
      })
      .on("mouseout.tooltip", function () {
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      })
      .on('mouseout.fade', this.linkFade(1).bind(this))
      .on("mousemove", function () {
        tooltip.style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 10) + "px");
      });

    graph.links.forEach( this.registerLink.bind(this) );
  }

  private registerLink(d: LinkInfo) {
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

  /**
   * function that is executed on node hover
   * @param opacity
   */
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
        this.linkLabel.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      }
    };
  }
/**
 * Fade Rules for hovering over links
 * As currently implemented, any nodes that are connected to both source and target are not faded out.
 */
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
      SzRelationshipNetworkComponent.linkSvg(d.source, d.target) :
      SzRelationshipNetworkComponent.linkSvg(d.target, d.source));

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
  dragstarted() {
    if (!d3.event.active) this.forceSimulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  /**
   * Update the position of the dragged node while dragging.
   */
  dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  /**
   * Allows the simulation to 'cool' to the point that nodes stop moving.
   *   The simulation does not stop while alphaTarget (default 0, set at 0.3 by dragstarted) > alphaMin (default 0.001)
   */
  dragended() {
    if (!d3.event.active) this.forceSimulation.alphaTarget(0);
    // commented out to prevent "bounce-back"
    // dunno if its right but it works
    //d3.event.subject.fx = null;
    //d3.event.subject.fy = null;
  }


  //////////////////
  // DATA MAPPING //
  //////////////////

  /**
   * primary data model shaper.
   * @param data
   */
  asGraph(resp: SzEntityNetworkResponse) : Graph {
    // @todo change from "any" to SzEntityNetworkResponse once it's fixed in the rest-api-client-ng package
    let data: any;
    if (resp && resp.data) data = resp.data;
    const entityPaths = data.entityPaths;
    const entitiesData = data.entities;
    const entityIndex = [];
    const nodes = [];
    const links = [];
    const linkIndex = [];
    const queriedEntityIds = [];
    const coreEntityIds = [];
    const coreLinkIds = [];
    const primaryEntities = this._entityIds.map( parseInt );

    // Identify queried nodes and the nodes and links that connect them.
    entityPaths.forEach( (entPath, ind) => {
      if (!queriedEntityIds.includes(entPath.startEntityId)){
        queriedEntityIds.push(entPath.startEntityId);
      }
      if (!queriedEntityIds.includes(entPath.endEntityId)) {
        queriedEntityIds.push(entPath.endEntityId);
      }

      const pathIds = entPath.entityIds;
      const nodeCount = pathIds.length;
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

    // Add a node for each resolved entity
    entitiesData.forEach(entNode => {
      const resolvedEntity  = entNode.resolvedEntity;
      const relatedEntRels  = entNode.relatedEntities.filter( (relEnt)=>{
        return primaryEntities ? primaryEntities.indexOf(relEnt.entityId) >= 0 : false;
      } );

      //console.log('SzRelationshipNetworkGraph.asGraph: ',
      //relatedEntRels, entNode.relatedEntities);

      const relColorClasses = [];
      if(relatedEntRels && relatedEntRels.length) {
        //console.log('get color classes: ', relatedEntRels);
        relatedEntRels.forEach( (relEnt) => {
          if(relEnt.relationType == 'DISCLOSED_RELATION'){ relColorClasses.push('graph-node-rel-disclosed'); }
          if(relEnt.relationType == 'POSSIBLE_MATCH'){ relColorClasses.push('graph-node-rel-pmatch'); }
          if(relEnt.relationType == 'POSSIBLE_RELATION'){ relColorClasses.push('graph-node-rel-prel'); }
        })
      } else if ( primaryEntities.indexOf( resolvedEntity.entityId ) > -1 ) {
        relColorClasses.push('graph-node-rel-primary');
      } else {
        //console.warn('no related ent rels for #'+ resolvedEntity.entityId +'.', entNode.relatedEntities, relatedEntRels);
      }

      const entityId = resolvedEntity.entityId;
      // Create Node
      entityIndex.push(entityId);
      const features = resolvedEntity.features;
      nodes.push({
        isQueriedNode: queriedEntityIds.includes(entityId),
        isCoreNode: coreEntityIds.includes(entityId),
        iconType: SzRelationshipNetworkComponent.getIconType(resolvedEntity),
        entityId: entityId,
        orgName: resolvedEntity.entityName,
        relationTypeClasses: relColorClasses,
        name: resolvedEntity.entityName,
        address: resolvedEntity.addressData && resolvedEntity.addressData.length > 0 ? resolvedEntity.addressData[0] : SzRelationshipNetworkComponent.firstOrNull(features, "ADDRESS"),
        phone: resolvedEntity.phoneData && resolvedEntity.phoneData.length > 0 ? resolvedEntity.phoneData[0] : SzRelationshipNetworkComponent.firstOrNull(features, "PHONE")
      });
    });

    // Add links between resolved entities.
    entitiesData.forEach(entityInfo => {
      const entityId = entityInfo.resolvedEntity.entityId;
      const relatedEntities = entityInfo.relatedEntities;
      relatedEntities.forEach(relatedEntity => {

        const relatedEntityId = relatedEntity.entityId;
        const linkArr = [entityId, relatedEntityId].sort();
        const linkKey = {firstId: linkArr[0], secondId: linkArr[1]};
        // Only add links between resolved entities
        // TODO Add links to related entities not in resolved entities to show where the network can be expanded.
        if (!SzRelationshipNetworkComponent.hasKey(linkIndex, linkKey) && entityIndex.indexOf(relatedEntityId) !== -1) {
          linkIndex.push(linkKey);
          links.push({
            source: entityIndex.indexOf(entityId),
            target: entityIndex.indexOf(relatedEntityId),
            matchLevel: relatedEntity.matchLevel,
            matchKey: relatedEntity.matchKey,
            isCoreLink: SzRelationshipNetworkComponent.hasKey(coreLinkIds, linkKey),
            id: linkIndex.indexOf(linkKey)
          });
        }
      });
    });

    /*console.log('SzRelationshipNetworkGraph.entitiesData: ', {
      nodes: nodes,
      links: links
    });*/

    // GRAPH CONSTRUCTED
    return {
      nodes: nodes,
      links: links
    };
  }

  static firstOrNull(features, name) {
    return features && features[name] && [name].length !== 0 ? features[name][0]["FEAT_DESC"] : null;
  }

  static hasKey(usedLinks, linkKey) {
    return usedLinks.filter(key => key.firstId === linkKey.firstId && key.secondId === linkKey.secondId).length !== 0;
  }

  static getIconType(resolvedEntity) {
    let retVal = 'default';
    if(resolvedEntity && resolvedEntity.records){
      //console.log('getIconType2: ', resolvedEntity);
      resolvedEntity.records.slice(0,9).forEach(element => {
        if(element.nameOrg) {
          retVal = 'business'
        } else if(element.gender && (element.gender === 'FEMALE' || element.gender === 'F') ){
          retVal = 'userFemale'
        } else if(element.gender && (element.gender === 'MALE' || element.gender === 'M') ){
          retVal = 'userMale'
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
}
