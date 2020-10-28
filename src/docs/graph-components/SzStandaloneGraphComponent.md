# SzStandaloneGraphComponent

The `SzStandaloneGraphComponent` creates a graphical representation of an entity and it's relationships to other entities and includes optional filtering and parameter control tray.

![screen shot of SzRelationshipNetworkComponent](../../images/ss-graph-large.png)
<br/><br/><br/><br/>

## Properties and Methods

see the component `sdk-graph-components` documentation for the full list of component methods and properties: <a href="http://certified.senzing.com/sdk-components-ng/components/SzStandaloneGraphComponent.html">http://certified.senzing.com/sdk-components-ng/components/SzStandaloneGraphComponent.html</a>

## Examples

#### Angular

```html
  <sz-standalone-graph
    filterWidth="320"
    [graphIds]="graphIds"
    [showPopOutIcon]="false"
    [showMatchKeyControl]="false"
    [showFiltersControl]="false"
    [filterControlPosition]="'top-right'"
    (entityClick)="onGraphEntityClick($event)"
    [showMatchKeys]="true"
    ></sz-standalone-graph>
```

#### Web Component

```html
  <sz-wc-standalone-graph
    filter-width="320"
    graph-ids="1,1001,1002"
    show-pop-out-icon="false"
    show-match-key-control="false"
    show-filters-control="false"
    filter-control-position="top-right"
    show-match-keys="true"></sz-wc-standalone-graph>
```

# Differences between Web Components and Angular Implementations

If using the `sdk-components-ng` package the tag is called `sz-standalone-graph`.
If using the `sdk-components-web` package the tag is called `sz-wc-standalone-graph`.

The other main difference between the two implementations is that if using angular the attributes are [Camel Case](https://en.wikipedia.org/wiki/Camel_case), and if using web components the attributes are kabob case. See [https://en.wikipedia.org/wiki/Letter_case#Special_case_styles](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles)

<br/><br/><br/><br/>