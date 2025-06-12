<!--<div>
    <iframe width="100%" height="100%" src="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html" title="SzRelationshipNetworkComponent"></iframe>
</div>-->
<!--<div style="margin: 0 auto; width:100%; min-height: 100vh;">
    <object type="text/html" data="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipNetworkComponent.html"
            style="width:100%; height:100%; margin:1%;">
    </object>
</div>-->

# SzRelationshipPathComponent

The `SzRelationshipPathComponent` creates a graphical representation of the relationships _between_ entities. It illustrates how one known entity connects to another known entity.

![screen shot of SzRelationshipPathComponent](../../images/ss-sz-relationship-path.png)

## Properties and Methods

see `sdk-graph-components` documentation for the full list of component methods and properties: <a href="http://certified.senzing.com/sdk-graph-components/components/SzRelationshipPathComponent.html" target="_szdocs_graph">http://certified.senzing.com/sdk-graph-components/components/SzRelationshipPathComponent.html</a>

## Examples

#### Angular

```html
<sz-relationship-path from="" to=""></sz-relationship-path>
```

#### Web Component

```html
<sz-wc-relationship-path from="" to=""></sz-wc-relationship-path>
```

# Differences between Web Components and Angular Implementations

The `SzRelationshipNetworkComponent` is not native to the _SDK Components_ package, but is re-exported and included for convenience. The `sdk-components-ng` and `sdk-components-web` npm packages both re-export the graph components network relationship component. Due to tag namespace collision issues all web components are prefixed with `sz-wc`.

If using the `sdk-components-ng` package the tag is called `sz-relationship-network`.
If using the `sdk-components-web` package the tag is prefixed with `sz-wc-relationship-network`.
