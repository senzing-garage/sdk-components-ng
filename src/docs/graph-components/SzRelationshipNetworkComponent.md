<!--<div>
    <iframe width="100%" height="100%" src="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html" title="SzRelationshipNetworkComponent"></iframe>
</div>-->
<!--<div style="margin: 0 auto; width:100%; min-height: 100vh;">
    <object type="text/html" data="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html"
            style="width:100%; height:100%; margin:1%;">
    </object>
</div>-->
# SzRelationshipNetworkComponent

The `SzRelationshipNetworkComponent` creates a graphical representation of an entity and it's relationships to other entities.

![screen shot of SzRelationshipNetworkComponent](../../images/ss-sz-relationship-network.png)

## Properties and Methods

see `sdk-graph-components` documentation for the full list of component methods and properties: <a href="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html" target="_szdocs_graph">http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html</a>

## Examples

#### Angular

```html
  <sz-relationship-network
    svgWidth=2000
    svgHeight=1000
    port=2080
    entityIds="1001"
    maxDegrees=3
    buildOut=2
    maxEntities=1000></sz-relationship-network>
```

#### Web Component

```html
  <sz-wc-relationship-network-graph
    entity-ids="1,1001,1002"
    svg-view-box="150 50 400 300"
    svg-preserve-aspect-ratio="xMinYMid meet"
    max-degrees="2"
    build-out="5"
    show-link-labels="true"
  ></sz-wc-relationship-network-graph>
```

# Differences between Web Components and Angular Implementations

The `SzRelationshipNetworkComponent` is not native to the *SDK Components* package, but is re-exported and included for convenience. The `sdk-components-ng` and `sdk-components-web` npm packages both re-export the graph components network relationship component. Due to tag namespace collision issues all web components are prefixed with `sz-wc`.

If using the `sdk-components-ng` package the tag is called `sz-relationship-network`.
If using the `sdk-components-web` package the tag is prefixed with `sz-wc-relationship-network`.