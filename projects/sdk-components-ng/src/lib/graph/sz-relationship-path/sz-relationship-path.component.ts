import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Simulation } from 'd3-force';
import { Graph, LinkInfo, NodeInfo } from '../sz-relationship-network/graph-types';
import { EntityGraphService } from '@senzing/rest-api-client-ng';
import { map } from 'rxjs/operators';
import * as d3 from 'd3';

@Component({
  selector: 'sz-relationship-path',
  templateUrl: './sz-relationship-path.component.html',
  styleUrls: ['./sz-relationship-path.component.scss']
})
export class SzRelationshipPathComponent implements OnInit {

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
      shape: "M687.543 299.886c7.314-21.943 14.629-43.886 14.629-65.829 0-102.4-87.771-190.171-197.486-190.171s-204.8 87.771-204.8 190.171c0 21.943 7.314 43.886 14.629 65.829-14.629 14.629-21.943 36.571-14.629 65.829 0 21.943 14.629 43.886 29.257 58.514 21.943 117.029 95.086 190.171 182.857 190.171s153.6-73.143 182.857-190.171c0-14.629 14.629-36.571 14.629-58.514 7.314-29.257 0-51.2-21.943-65.829zM687.543 365.714c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314-14.629 102.4-80.457 175.543-153.6 175.543s-138.971-73.143-160.914-175.543c0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-29.257-14.629-43.886 0-29.257 7.314-43.886 14.629-51.2 0 0 7.314-7.314 7.314-7.314 7.314 29.257 14.629 51.2 14.629 36.571 0-29.257-7.314-87.771-7.314-117.029 29.257-21.943 80.457-51.2 124.343-51.2 0 0 0 0 0 0 43.886 0 58.514 14.629 73.143 36.571 14.629 29.257 36.571 51.2 109.714 51.2 0 0 0 0 7.314 0-7.314 29.257-7.314 58.514-7.314 80.457 0 14.629 7.314-7.314 14.629-36.571 0 0 0 0 7.314 7.314 0 7.314 14.629 21.943 7.314 51.2zM680.229 592.457c-29.257 65.829-95.086 117.029-175.543 117.029s-146.286-51.2-175.543-124.343c-146.286 36.571-256 153.6-256 292.571v95.086h877.714v-95.086c0-138.971-117.029-256-270.629-285.257z",
      // The space enclosed by the face of the male icon
      enclosed: "M687.543 365.714c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314-14.629 102.4-80.457 175.543-153.6 175.543s-138.971-73.143-160.914-175.543c0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-29.257-14.629-43.886 0-29.257 7.314-43.886 14.629-51.2 0 0 7.314-7.314 7.314-7.314 7.314 29.257 14.629 51.2 14.629 36.571 0-29.257-7.314-87.771-7.314-117.029 29.257-21.943 80.457-51.2 124.343-51.2 0 0 0 0 0 0 43.886 0 58.514 14.629 73.143 36.571 14.629 29.257 36.571 51.2 109.714 51.2 0 0 0 0 7.314 0-7.314 29.257-7.314 58.514-7.314 80.457 0 14.629 7.314-7.314 14.629-36.571 0 0 0 0 7.314 7.314 0 7.314 14.629 21.943 7.314 51.2zM680.229 592.457c-29.257 65.829-95.086 117.029-175.543 117.029s-146.286-51.2-175.543-124.343c-146.286 36.571-256 153.6-256 292.571v95.086h877.714v-95.086c0-138.971-117.029-256-270.629-285.257z"
    },
    // TODO introduce a gender-neutral person icon for when we can tell a node is a person but the gender isn't specified.
    default: {
      // A Question Mark
      shape: "M343.771 124.343c43.886-29.257 102.4-43.886 175.543-43.886 87.771 0 160.914 21.943 226.743 65.829 58.514 43.886 87.771 109.714 87.771 190.171 0 51.2-14.629 95.086-36.571 131.657-14.629 21.943-43.886 51.2-87.771 80.457l-51.2 36.571c-21.943 14.629-36.571 36.571-43.886 58.514 0 14.629-7.314 36.571-7.314 73.143h-160.914c0-65.829 7.314-117.029 21.943-138.971 7.314-29.257 36.571-58.514 80.457-87.771l36.571-36.571c14.629-7.314 29.257-21.943 36.571-36.571 14.629-21.943 21.943-43.886 21.943-73.143s-7.314-58.514-29.257-80.457c-14.629-21.943-43.886-36.571-87.771-36.571s-80.457 14.629-95.086 43.886c-21.943 29.257-36.571 65.829-36.571 95.086h-168.229c0-109.714 43.886-190.171 117.029-241.371zM446.171 797.257h175.543v175.543h-175.543v-175.543z",
    }
  };

  @ViewChild('graphEle') svgComponent;
  public svgElement: SVGSVGElement;

  private _svgWidth: number;
  @Input() public set svgWidth(value: number) { this._svgWidth = +value; }
  public get svgWidth(): number { return this._svgWidth; }

  private _svgHeight: number;
  @Input() public set svgHeight(value: number) { this._svgHeight = +value; }
  public get svgHeight(): number { return this._svgHeight; }


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
  @Input() public set from(value: string) { this._from = value; }
  public get from(): string { return this._from; }

  private _to: string;
  @Input() public set to(value: string) { this._to = value; }
  public get to(): string { return this._to; }

  private _maxDegrees: number;
  @Input() set maxDegrees(value: string) { this._maxDegrees = +value; }

  static readonly WITH_RAW: boolean = true;

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
    console.log("Constructing Relationship Path");
    this.linkedByNodeIndexMap = {};
  }

  ngOnInit() {
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
  }


  private getPath() {
    return this.graphService.findPathByEntityID(
      { id: this._from },
      { id: this._to },
      this._maxDegrees,
      this._excludeIds,
      true,
      undefined,
      SzRelationshipPathComponent.WITH_RAW );
  }

  addSvg(graph: Graph, parentSelection = d3.select("body")) {
    console.log("Okay, let's do this!", graph);
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
    this.node = svg.selectAll('.sz-graph-node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'sz-graph-node');

    // Add an SVG icon for the person's face.  This hides the links so they're not visible through the face.
    this.node.filter(d => d.iconType !== "business" && SzRelationshipPathComponent.ICONS[d.iconType])
      .append('path')
      .attr('class', 'sz-graph-icon-enclosure')
      .attr('d', d => SzRelationshipPathComponent.ICONS[d.iconType]["enclosed"])
      .attr("transform", "translate(-25,-28) scale(0.05)");

    // Add an SVG icon for the person.
    this.node.filter(d => d.iconType !== "business")
      .append('path')
      .attr('class', 'sz-graph-node-icon')
      .attr('fill', "#000000")
      .attr("d", d => SzRelationshipPathComponent.ICONS[d.iconType] ?
        SzRelationshipPathComponent.ICONS[d.iconType]["shape"] :
        SzRelationshipPathComponent.ICONS["default"]["shape"])
      .attr("transform", "translate(-25,-28) scale(0.05)");

    // Add .png icons for businesses
    // TODO replace .png business icon with SVG
    this.node.filter(d => d.iconType === "business")
      .append('image')
      .attr("xlink:href", "../img/icons8-building-50-queried.png")
      .attr("x", -25)
      .attr("y", -25)
      .attr("height", 50)
      .attr("width", 50)
      .attr('class', 'sz-graph-icon sz-graph-queried-node');

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
    this.forceSimulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink().links(graph.links).distance(this._svgWidth / 8)) // links pull nodes together
      .force('charge', d3.forceManyBody().strength(-100)) // nodes repel each other
      .force('center', d3.forceCenter(this._svgWidth / 2, this._svgHeight / 2)) // Make all nodes start near the center of the SVG
      .force('x', d3.forceX(this._svgWidth / 2).strength(0.01)) // x and y continually pull all nodes toward a point.  If the
      .force('y', d3.forceY(this._svgHeight / 2).strength(0.01)) //  graph has multiple networks, this keeps them on screen
      .on('tick', this.tick.bind(this));

    // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
    this.node.on('mouseover.tooltip', function (d) {
      tooltip.transition()
        .duration(300)
        .style("opacity", .8);
      tooltip.html(SzRelationshipPathComponent.nodeTooltipText(d))
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
        tooltip.html(SzRelationshipPathComponent.linkTooltipText(d))
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

    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
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
  private static getIconType(resolvedEntity) {
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
