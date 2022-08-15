# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.1.1] - 2022-08-15

### Modified
- Match keys on graph entity link(s) are now in a vertically centered multi-line list.
- Bugfix for match key labels. (see #383)
- Entity detail embedded graph now defaults to collapsed nodes when relationships are `<= 10`

relevant tickets: #309 #364 #383


## [5.1.0] - 2022-07-27

- there is now a new `unlimited` ui option for maximum entities allowed.
- there is now a new `unlimited` ui option for maximum build out allowed.
- the upper limit of the maximum entities ui slider is now dynamically set from the initial query.
- match key token counts now feature condensed notation instead of ellipsis.


### Added
- the following event emitters added to `SzGraphFilterComponent`
  - `matchKeyTokenSelectionScopeChanged` when the user switches from `CORE` to `EXTRANEOUS` match key token scope
- the following getters and setters added to `SzGraphFilterComponent`
  -  `maxEntitiesLimit` the maximum value that the slider control will allow. default is 200.
  -  `unlimitedMaxEntities` ignore the `maxEntities` value and always pull up to 40000
  -  `unlimitedMaxScope` ignore the `buildOut` value and always pull up to 10
- the following getters and setters added to `SzGraphComponent`
  - `unlimitedMaxEntities`
  - `unlimitedMaxScope`
  - `maxEntitiesFilterLimit`
- the following event emitters on `SzGraphComponent`
  - `renderStarted` not sure why this didn't exist since `renderComplete` did
  - `dataLoading` for more flexible state sensing
  - `onPreflightRequestComplete` so we can get the total relationship count to populate the `maxEntitiesFilterLimit`
- the following properties/getters/setters added to `SzRelationshipNetworkComponent`
  - `noMaxEntitiesLimit` sets whether or not to ignore the value set in `maxEntities`
  - `noMaxScopeLimit` sets whether or not to ignore the value set in `buildOut`
- the following event emitters added to `SzRelationshipNetworkComponent`
  - `onTotalRelationshipsCountUpdated` is emitted with the value of how many total relationships are possible to display according to the data in the focal entities related entities.
  - `renderStarted` wasn't wired correctly. works now
  - `dataLoading` when a data request has been initiated.
  - `dataLoaded` which is like `requestComplete` but instead of a boolean it returns the data response
- the following preferences added to `SzGraphPrefs`
  - `unlimitedMaxEntities`
  - `unlimitedMaxScope`
- `getEntitiesByIds` method added to `SzSearchService` to get data for multiple entities by their id's in the form of `Observable<SzEntityData[]>`


### Modified
- Changed the behavior of `showCoreMatchKeyTokenChips` to automatically set `matchKeyTokenSelectionScope` to `CORE`.
- Changed the complete match key display to a comma deliminated list of tokens on each line for readability
- Changed the `shouldDataSourceBeDisplayed` method in `SzGraphFilterComponent` to allow for passing an empty array to `showDataSources` so we can initialize with an empty list that will prevent showing datasources before the list is ready.
- Changed the `SzStandaloneGraphComponent` component to initialize the value of `showDataSources` in the filter component to NOT initially show data sources until the data can be properly rendered. (prevents FOC, see above)
- the following getters and setters added to `SzGraphFilterComponent`
  - `maxEntities` the maximum number of entities to display on the graph
- the following changes made to `SzRelationshipNetworkComponent`
  - `dataRequested` changed to BehaviorSubject (lifecycle bugfix)
  - `requestStarted` fixed
  - `requestComplete` fixed
  - `getNetwork` signature changed to `getNetwork(entityIds: SzEntityIdentifier[], maxDegrees: number, buildOut: number, maxEntities: number)`
  - the following event emitters have been rewired so that they are just proxies of 
the observeable event streams for uniformity/reliability:
    - `onRequestStarted`
    - `onRequestCompleted`
    - `onRenderStarted`
    - `onRenderCompleted`
    - `onNoResults`
    - `onDataRequested`
    - `onDataLoaded`
    - `onDataUpdated`
    - `scaleChanged`

relevant tickets: #343 #344 #347 #348 #350 #355 #358

## [5.0.0] - 2022-07-01

This release adds new functionality around expanding and collapsing related entities in *Network Graph* related components. We've moved the `@senzing/sdk-graph-components` to the scope of this package for easier maintenance and installation(now you just need this package instead of two). We're also adding the *Why Not* component that can be embedded between two or more entities to generate a report to show why two entities/records did not resolve.

### Added
- The `SzWhyEntitiesComparisonComponent` added for doing _WHY_ comparison _between_ entities. Adds the ability to run "Why Not" Reports from within the context of the search results and graph. 
- The following input parameters added to `SzSearchResultsComponent`:
  - `showWhyComparisonButton` enables a *multi-select* button behavior for search results that when clicked allows a user to click to toggle selection of an entity in the results then click the button to show a *WHY NOT* report for differences between those two entities.
- The follwing getters and setters added to `SzEntityDetailComponent`
  - `showGraphContextMenu` enables the built-in context menu for entity nodes on the graph embedded in the entity detail component.
  - `showGraphLinkContextMenu` enables the built-in context menu for relationship lines/labels on the graph embedded in the entity detail component.
  - `graphMatchKeyTokenSelectionScope` possible values are "CORE" and "EXTRANEOUS". core sets the scope of match key token filtering to just entities directly related to the focused/primary entity of the graph. defaults to `EXTRANEOUS`.
- The following Event Emitters added to `SzEntityDetailComponent`
  - `graphRelationshipContextMenuClick` is emitted when a user right clicks on relationship lines/labels in the embedded graph component.
  - `graphRelationshipClick` is emitted when a user clicks on relationship lines/labels in the embedded graph component.
- The following properties added to `SzGraphComponent` and are inheirited by `SzStandaloneGraphComponent` and `SzEntityDetailGraphComponent`.
  - `matchKeyTokenSelectionScope` possible values are "CORE" and "EXTRANEOUS". core sets the scope of match key token filtering to just entities directly related to the focused/primary entity of the graph. defaults to `EXTRANEOUS`.
- The following methods added to `SzGraphComponent` and are inheirited by `SzStandaloneGraphComponent` and `SzEntityDetailGraphComponent`.
  - `canRemoveNode(entityId: SzEntityIdentifier)` returns boolean if an entity on canvas can be removed(root nodes, and primary query nodes cannot).
  - `canExpandNode(entityId: SzEntityIdentifier)` returns boolean if a node has hidden related entities that can be shown on canvas.
  - `removeNode(entityId: SzEntityIdentifier)` removes a single node and any directly related nodes 
  - `collapseNode(entityId: SzEntityIdentifier)` hide all visible(expanded) entities related to a specific entity that are themselves not related to any other visible entities.
  - `expandNode(entityId: SzEntityIdentifier)` show any entities that are related to a specific entity that are currently not on the canvas.
- The following event emitters added to `SzGraphComponent`
  - `relationshipContextMenuClick` is emitted when a user right clicks on relationship lines/labels in the embedded graph component. 
  - `relationshipClick` is emitted when a user clicks on relationship lines/labels in the embedded graph component.
- The following methods added to `SzEntityDetailComponent`
  - `isGraphEntityRemovable(entityId: SzEntityIdentifier)` can a specific entity node be removed from canvas.
  - `showGraphEntityRelationships(entityId: SzEntityIdentifier)` show any entities that are related to a specific entity that are currently not on the canvas.
  - `hideGraphEntityRelationships(entityId: SzEntityIdentifier)` hide all visible(expanded) entities related to a specific entity that are themselves not related to any other visible entities.
  - `hideGraphEntity(entityId: SzEntityIdentifier)` remove single node and any directly related nodes that are only related to the entity specified.
- `SzRelationshipNetworkComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipNetworkInputComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipNetworkLookupComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipPathComponent` moved from `@senzing/sdk-graph-components`
- The following methods added to `SzRelationshipNetworkComponent`
  - `canExpandNode` does a node have hidden related nodes that can be displayed.
  - `expandNode` show all hidden nodes related to the node specified.
  - `canRemoveNode` can a node be removed.
  - `removeNode` removes a single node, all it's related and/or both.
  - `center` centers the graph viewport.
  - `addExistingNodeData` used for data merge/transform operation.
  - `addLinksToNodeData` used for data merge/transform operation.
  - `asEntityNetworkData` gets the state of graph nodes/links as `EntityNetworkData`
  - `onLinkClick` when a user clicks on a relationship link line or label.
  - `onLinkDblClick` when a user double clicks on a relationship link line or label.
  - `onLinkContextClick` when a user right clicks on a relationship link line or label.
  - `getNodeByIdQuery` returns a D3.Selection of the node that matches the entity id provided.
  - `getNodesByIdQuery` returns a D3.Selection of the nodes that match the entity ids provided.
  - `getHiddenNodeIds` return an array of entity ids for nodes that exist on canvas but are not currently visible.
  - `updateHiddenRelationshipCounts` update the relationship count bubble inside a entity node with the value from numberRelatedHidden.
  - `getRelatedNodesByIdQuery` returns a D3.Selection of nodes that match the entity ids provided
  - `updateIsHiddenForLinks` ensure that a link node(line) is not visible if one of the connected nodes is not visible
  - `getEntityNodeClass` get the css classes as a space separate string to apply to an entity node. 
  - `getEntityLinkClass` get the css classes as a space separate string to apply to an entity link node(line).
  - `getEntityLinkLabelClass` get the css classes as a space separate string to apply to an entity link node.
  - `expandCollapseToggle` toggles the collapsed or expanded nodes related to a node
  - `updateHasCollapsedRelationships` after a collapse or expand event all of the nodes on canvas's properties related to collapse/expand must be updated in order to calculate whether or not a node still has hidden related entities.
- The following event emitters added to `SzRelationshipNetworkComponent`
  - `relationshipClick` when a user clicks on a relationship link line or label.
  - `relationshipDblClick` when a user double clicks on a relationship link line or label.
  - `relationshipContextMenuClick` when a user right clicks on a relationship link line or label.
  - `onDataUpdated` when new data is added to the store representing the state of the graph this event is emitted with the result of `asEntityNetworkData()`
  - `onShowRelatedEntities` event emitted when the user expands or collapses a entity nodes related nodes.
  - `onHideRelatedEntities` event emitted when the user expands or collapses a entity nodes related nodes.
- Major refactoring around the draw mechanism inside `SzRelationshipNetworkComponent.addSvg()` method reorganized or rewritten. The following subroutines added:
  - `getNodeVisibilityClass` returns a array with the string of `sz-node-state-hidden` if node is supposed to be hidden. (used for css queries)
  - `setNodePositionsAsCircle` takes a selection of entity nodes and places their X,Y positions on an arc path(circle) around a central point.
  - `applyPositionToNodes` takes the X/Y values set on a node's data property and converts them to CSS transform properties
  - `updateLinksForNodes` when a node(s) position has changed this sub is called to keep the end of the link path attached to the node being moved
  - `attachEventListenersToNodes` attach internal handlers for things like click, drag, mouseover events to a selection of nodes so handlers are called.
  - `stopEventListenersForNodes` remove event handers for a selection of nodes
  - `attachEventListenersToLinks` attach internal handlers for things like click, drag, mouseover events to a selection of nodes so handlers are called.
  - `polarToCartesian` dependency for drawing concentric rings
  - `describeArc` dependency for drawing concentric rings
  - `circleCoord` dependency for drawing concentric rings
  - `getRingSchemaForNodes` gets a object describing a ring based drawing layout for nodes
  - `drawNodesInRings` takes a collection of entities and lays them out in increasing diameter along rings around an X and Y origin.
  - `drawLinks` draws the links between entity nodes on svg canvas
  - `drawNodes` draws the entity nodes on svg canvas
  - `onExpandCollapseClick` event handler for when a node's expand or collapsed glyph is clicked on.
- `SzRelationshipNetworkComponent.onNodeContextClick` added the following to the `contextMenuClick` event emitter so the context menu could be positioned correctly.
  - `eventPageX` the x position on the page non-relative that the event occurred at.
  - `eventPageY` the y position on the page non-relative that the event occurred at.
- `SzRelationshipNetworkComponent.contextMenuClick`
  - `eventPageX` the x position on the page non-relative that the event occurred at.
  - `eventPageY` the y position on the page non-relative that the event occurred at.

### Removed
- The following methods have been removed from `SzRelationshipNetworkComponent`
  - `onSimulationCycle` gravity simulation has been removed in favor or concentric ring algorithm.
  - `unlockForcePosition` gravity simulation has been removed in favor or concentric ring algorithm.
  - `lockForcePosition` gravity simulation has been removed in favor or concentric ring algorithm.
  - `fade` used to highlight directly related  nodes by changing the opacity of all unrelated nodes
  - `linkfade` used to highlight directly related  nodes by changing the opacity of all unrelated nodes
  - `onNodeDragEnded` no longer needed

### Modified
- `_graphIds` property on `SzGraphComponent` type changed from `number[]` to `SzEntityIdentifier[]`
- `graphIds` property getter and setter on `SzGraphComponent` type changed from `number[]` to `SzEntityIdentifier[]`
- `reload` method in `SzGraphComponent` parameter type changed to `string | number | SzEntityIdentifier | SzEntityIdentifier[]`
- Major refactoring around the draw mechanism inside `SzRelationshipNetworkComponent`. Almost all of the routiines in `addSvg` method reorganized or rewritten. The following subroutines added 
  - `onNodeContextClick` added the following to the `contextMenuClick` event emmitter so the context menu could be positioned correctly.
    - `eventPageX` the x position on the page non-relative that the event occurred at.
    - `eventPageY` the y position on the page non-relative that the event occurred at.
  - `contextMenuClick`
    - `eventPageX` the x position on the page non-relative that the event occurred at.
    - `eventPageY` the y position on the page non-relative that the event occurred at.

relevant tickets: #280 #299 #302 #304 #307 #310 #311 #313 #315 #319 #321

## [4.0.0] - 2022-05-09

This update brings the models in line with the changes for the `3.0.0` release of the [senzing rest api server](https://github.com/Senzing/senzing-api-server)
and [rest api specification](https://github.com/Senzing/senzing-rest-api-specification/blob/caceres.version-3.0.0/senzing-rest-api.yaml).

### Added
- `showMatchKeyFilters` property added to `sz-standalone-graph` tag. specifying a value of `false` will hide the *Filter By Match Key* section of the embedded graph controls. (defaults to _true_)
- `showMatchKeyFilters` property added to `sz-graph-filter` tag. specifying a value of `false` will hide the *Filter By Match Key* list of checkboxes. (defaults to _true_)
- `SzWhyEntityComponent` component for displaying results from the api server's respective why endpoints(`/entities/{entityId}/why`).
- `parseSzIdentifier` function added to `src/lib/common/utils.ts`
- `nonTextTrim` function added to `src/lib/common/utils.ts`
- `SzWhySelectionMode` 
- `showWhyFunction` input attribute added to `SzEntityDetailComponent`. Turns on the availability of "Why" related functions(Why button under icon, why buttons in the records section) in the entity detail component.
- `whySelectionMode` input attribute added to `SzEntityDetailComponent`. Turns on the availability of "Why" related functions(Why button under icon, why buttons in the records section) in the entity detail component. values are `NONE`|`SINGLE`|`MULTI`
-  `openWhyComparisonModalOnClick` input attribute added to `SzEntityDetailComponent`. setting to `false` will mean that the integrator will be responsible for responding to "Why" events(`recordsWhyButtonClick`,`headerWhyButtonClick`), the component will no longer display a modal on click by default. 
- The following getters/setters, and methods to `SzEntityDetailComponent`
  - `showRecordWhyUtilities` - explicitly hide or show the why buttons on individual records.
  - `showEntityWhyFunction` - explicitly hide or show the why button under the icon.
  - `onCompareRecordsForWhy()` - is what is called when a `recordsWhyButtonClick` event is invoked.
  - `onHeaderWhyButtonClick()` - is what is called when a `headerWhyButtonClick` event is invoked.
- The following event emitters to `SzEntityDetailComponent`
  - `recordsWhyButtonClick` - is emitted when a user clicks a why button from within the context of a record.
  - `headerWhyButtonClick` - is emitted when a user clicks a why button underneath the icon in the header.
- The graph filters found in the `SzStandaloneGraphComponent` can now show a tag cloud of *Match Key Tokens*. If setting the `showMatchKeyTokenFilters="true"` you should also set the `showMatchKeyFilters]="false"` since the two options are exclusive and will interfere with proper function of the other.

### Removed
- the following methods removed `SzAdminService`
  - `addEntityClasses()`
  - `addEntityTypes()`
  - `addEntityTypesForClass()`
  - `getCurrentConfig()`
  - `getDefaultConfig()`
  - `getEntityClass()`
  - `getEntityType()`
  - `getEntityTypeByClass()`
  - `listEntityClasses()`
  - `listEntityTypes()`
  - `listEntityTypesByClass()`
- the following parameters removed from `SzAdminService.loadBulkRecords()`
  - `entityType`
  - `mapEntityTypes`
  - `mapEntityType`
- the following properties removed from `SzBulkDataService`
  - `_entityTypes`
  - `entityTypeMap`
  - `entityTypes`
- the following event emitters from `SzBulkDataService`
  - `onEntityTypesChange`
  - `onEntityTypeMapChange`
- the following methods removed from `SzBulkDataService`
  - `updateEntityTypes()`
  - `getEntityTypeMapFromAnalysis()`
  - `changeEntityTypeName()`
  - `createEntityTypes()`
- the following parameters removed from `SzBulkDataService.load()`
  - `entityTypeMap`
- `SzEntityTypesService`
- `SzSearchResultEntityData.matchScore` property

## [3.0.0] - 2021-12-17
### Modified
- Angular Framework Updated to version 13. As of 3.0.0 release this package now requires `@angular@~13.0.0` to compile and run. Updating to angular 13 resolves major dependency compatibility issues so we can apply the latest security patches to the library. For information updating your project from a previous angular version to `~13.0.0` see the [Angular Update Guide ](https://update.angular.io/)
- SzSearchComponent.resultCleared event emitter payload is now of type `void` and not `SzEntitySearchParams`.
- Small bugfix to properly clip the graph scale ui control when graph section in entity detail is collapsed.

### Deleted
- Admin Import example and related code. The admin load functionality has been deprecated since there is just too much movement of the methodology and complexity used to achieve this functionality for it be practical to expose it via the sdk-components-ng package. For a working example of how to implement load and analyze functionality see the consuming [Entity Search Web App](https://github.com/Senzing/entity-search-web-app) repository.
- Angular Schematics support. see #253

relevant tickets: #253 #252 #251 #250

## [2.2.6] - 2021-11-23
### Added
- `SzEntityDetailGraphComponent`
   - `showZoomControl` input setter for whether or not to show zoom controls.
   - `showZoomControl` getter for whether or not zoom controls are shown.
   - `zoomControlPosition` input setter for where the zoom control shows up on the embedded graph.
   - `zoomControlPosition` getter for where the zoom control shows up on the embedded graph.
   - `graphZoom` input setter for the current zoom level of the graph.
   - `graphZoom` getter for the current zoom level of the graph.
   - `onGraphZoom()` handler for proxying zoom state of graph component to local scope.
   - `zoomIn()` zooms the graph in.
   - `zoomOut()` zooms the graph out.
- `SzStandaloneGraphComponent`
   - `showZoomControl` input setter for whether or not to show zoom controls.
   - `showZoomControl` getter for whether or not zoom controls are shown.
   - `zoomControlPosition` input setter for where the zoom control shows up on the embedded graph.
   - `zoomControlPosition` getter for where the zoom control shows up on the embedded graph.
   - `graphZoom` input setter for the current zoom level of the graph.
   - `graphZoom` getter for the current zoom level of the graph.
   - `onGraphZoom()` handler for proxying zoom state of graph component to local scope.
   - `zoomIn()` zooms the graph in.
   - `zoomOut()` zooms the graph out.
- `SzEntityDetailComponent`
   - `graphZoomControlPosition` input setter for where the zoom control shows up on the embedded graph.
   - `graphShowZoomControl` input setter for whether or not to show zoom controls on embedded graph.

relevant tickets: #245 #240

## [2.2.5] - 2021-11-01

- Graph now allows the user to be able to show/hide entities on the graph control whos' relationships belong to specific match keys present in the graph in the filters control.
- *Search by Datasource/RecordId* now gets the full `SzEntityData` instead of just the `SzEntityRecord`
- Old behavior(to return just `SzEntityRecord` instead of `SzEntityData`) relocated from `SzSearchService.getEntityByRecordId` to `SzSearchService.getRecordById`
- Various new CSS Variables added for styling granularity relevant to https://github.com/Senzing/entity-search-web-app/issues/213

relevant tickets: #232 #233 #235

## [2.2.4] - 2021-08-06

- [API Client package](https://github.com/Senzing/rest-api-client-ng/releases) updated to version [2.3.0](https://github.com/Senzing/rest-api-client-ng/releases/tag/2.3.0)
- Compatibility updates for [Senzing OAS 2.7.0](https://github.com/Senzing/senzing-rest-api-specification/blob/master/CHANGELOG.md#270---2021-07-22) specification
- Compatibility updates for [Senzing Rest Server@2.7.0](https://github.com/Senzing/senzing-api-server/blob/master/CHANGELOG.md#270---2021-07-22)
- Preferences has several models added to facilitate stateful storage of **Stream Loading** features found in the [POC Server] extensions:
  - `AdminStreamConnProperties`, `AdminStreamAnalysisConfig`, `AdminStreamLoadConfig`, `AdminStreamUploadRates` in src/lib/models/data-admin.ts
  - `SzAdminPrefs` added to `src/lib/services/sz-prefs.service.ts`

relevant tickets: #204 #226

## [2.2.3] - 2021-06-14

- Passing additional or custom headers are necessary in certain operation scenario's, ie: passing `X-Amz-Security-Token` to a [Cognito](https://aws.amazon.com/cognito/) enabled [API Gateway](https://aws.amazon.com/api-gateway/) address after user authentication.
  - Methods added to SzConfigurationService :
    - addHeaderToApiRequests
    - removeHeaderFromApiRequests
  - Accessors added to SzConfigurationService :
    - additionalApiRequestHeaders
  - @Input() Accessor added to SzConfigurationComponent : 
    - additionalHeaders
- Code Cleanup (various commented out or unused variables removed)
- Graph entity datasource colors are now reorderable via drag. Color with highest priority is shown when a graph entity belongs to multiple datasources.

relevant tickets: #111, #219, #223

## [2.2.2] - 2021-03-17

- Patch release for @angular@~11.0.0 compatibility. See #207

relevant tickets: #207

## [2.2.1] - 2021-01-27

- Entities with no "relatedEntities" present in data model cause blank UI on detail view

relevant tickets: #202

## [2.2.0] - 2020-12-31
- Select Identifiers in Search Form feature added. #191
- Angular Material added to `peerDependencies`. #192
- Package now supports basic install schematics: `ng add @senzing/sdk-components-ng`. #190

## [2.1.2] - 2020-11-03

- API Client package updated to the [Senzing OAS 2.2.0](https://github.com/Senzing/senzing-rest-api-specification/releases/tag/2.2.0) specification.
- Web Components code integrated as a child project in to the the `sdk-components-ng` repository. see ticket [#169](https://github.com/Senzing/sdk-components-ng/issues/169).
Documentation for `@senzing/sdk-components-web` now [available here](http://hub.senzing.com/sdk-components-ng/additional-documentation/web-components.html).
- Bugfixes: #169, #170, #173, #174, #175, #176, #177, #178, #179, #180, #181

## [2.1.1] - 2020-10-02

- Bugfixes for graph node filtering, color application by datasource, tooltips, redraw and source race conditions.
- Added *Entity Id* to entity detail component

relevant tickets: #162, #159, #152, #137

## [2.1.0] - 2020-09-21

Maintenence release for framework upgrade to Angular 10: see [https://blog.angular.io/version-10-of-angular-now-available-78960babd41](https://blog.angular.io/version-10-of-angular-now-available-78960babd41)

Major updates to most dependency versions have also been made which should improve file sizes, security, and stability.

The following Senzing projects have also been updated to operate on Angular 10,
see the following links for associated tickets:
- [sdk-components-ng/issues/143](https://github.com/Senzing/sdk-components-ng/issues/143)
- [rest-api-client-ng/issues/39](https://github.com/Senzing/rest-api-client-ng/issues/39)
- [sdk-graph-components/issues/37](https://github.com/Senzing/sdk-graph-components/issues/37)

## [2.0.0] - 2020-07-12

Compatibility release for interacting with the 2.0.0 [senzing-rest-api-spec](https://github.com/Senzing/senzing-rest-api-specification) and [senzing-api-server](https://github.com/Senzing/senzing-api-server). For information on specifics of endpoint changes see below:

- [@senzing/rest-api-client-ng@2.0.0](https://github.com/Senzing/rest-api-client-ng/releases/tag/2.0.0)
- [senzing-rest-api-specification PR #44](https://github.com/Senzing/senzing-rest-api-specification/pull/44)
- [senzing-api-server PR #172](https://github.com/Senzing/senzing-api-server/pull/172)

## [1.3.0] - 2020-02-06

### Added to 1.3.0

Added in components that can be used for bulk analysis and bulk loading. The components and services are specifically to facilitate admin functionality.

- new components:
  - [SzBulkDataAnalysisReportComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataAnalysisReportComponent.html)
  - [SzBulkDataAnalysisSummaryComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataAnalysisSummaryComponent.html)
  - [SzBulkDataAnalysisComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataAnalysisComponent.html)
  - [SzBulkDataLoadReportComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataLoadReportComponent.html)
  - [SzBulkDataLoadSummaryComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataLoadSummaryComponent.html)
  - [SzBulkDataLoadComponent](https://senzing.github.io/sdk-components-ng/components/SzBulkDataLoadComponent.html)
- new models/classes:
  - [SzBaseBulkLoadResult](https://senzing.github.io/rest-api-client-ng/interfaces/SzBaseBulkLoadResult.html)
  - [SzBulkDataAnalysis](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkDataAnalysis.html)
  - [SzBulkDataAnalysisResponse](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkDataAnalysisResponse.html)
  - [SzBulkDataLoadResponse](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkDataLoadResponse.html)
  - [SzBulkLoadError](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkLoadError.html)
  - [SzBulkLoadResponse](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkLoadResponse.html)
  - [SzBulkLoadResult](https://senzing.github.io/rest-api-client-ng/interfaces/SzBulkLoadResult.html)
  - [SzDataSourceBulkLoadResult](https://senzing.github.io/rest-api-client-ng/interfaces/SzDataSourceBulkLoadResult.html)
  - [SzDataSourceRecordAnalysis](https://senzing.github.io/rest-api-client-ng/interfaces/SzDataSourceRecordAnalysis.html)
  - [SzEntityTypeBulkLoadResult](https://senzing.github.io/rest-api-client-ng/interfaces/SzEntityTypeBulkLoadResult.html)
  - [SzEntityTypeRecordAnalysis](https://senzing.github.io/rest-api-client-ng/interfaces/SzEntityTypeRecordAnalysis.html)
- new services:
  - [SzAdminService](https://senzing.github.io/sdk-components-ng/injectables/SzAdminService.html)
  - [SzBulkDataService](https://senzing.github.io/sdk-components-ng/injectables/SzBulkDataService.html)
- new examples:
  - example/admin-importing
- relevant tickets
  - [#133](https://github.com/Senzing/sdk-components-ng/issues/133)

## [1.2.0] - 2019-12-11

### Added to 1.2.0

New *"Search By Id"* component, *"record viewer"* component, search history type-ahead, various bugfixes, rest-client updates, admin service, and basic folio models.

- new components:
  - SzSearchByIdComponent Component
  - SzEntityRecordViewerComponent
- new models/classes:
  - SzSearchByIdFormParams interface
  - SzAdminService
  - SzFolioItem
  - SzFolio
  - SzSearchParamsFolioItem extends SzFolioItem
  - SzSearchParamsFolio extends SzFolio
  - SzSearchHistoryFolioItem extends SzSearchParamsFolioItem
  - SzSearchHistoryFolio extends SzSearchParamsFolio
- new services:
  - SzFoliosService
- new events:
  - SzSearchService.parametersChanged
  - SzSearchService.resultsChanged
  - SzSearchService.searchPerformed
- new dependencies:
  - ngx-json-viewer
- new examples:
  - search-by-id
- relevant tickets
  - [#109](https://github.com/Senzing/sdk-components-ng/issues/109)
  - [#110](https://github.com/Senzing/sdk-components-ng/issues/110)
  - [#112](https://github.com/Senzing/sdk-components-ng/issues/112)
  - [#114](https://github.com/Senzing/sdk-components-ng/issues/114)
  - [#115](https://github.com/Senzing/sdk-components-ng/issues/115)
  - [#121](https://github.com/Senzing/sdk-components-ng/issues/121)
  - [#123](https://github.com/Senzing/sdk-components-ng/issues/123)
  - [#125](https://github.com/Senzing/sdk-components-ng/issues/125)
  - [#126](https://github.com/Senzing/sdk-components-ng/issues/126)

## [1.1.0] - 2019-11-11

### Added to 1.1.0

- pop out graph icon
- new "example/search-in-graph" project to show search integrating directly with graph
- new *[SzPrefDictComponent](https://senzing.github.io/sdk-components-ng/components/SzPrefDictComponent.html)* for displaying pref(s) that are object/key/value based(ie json object)
- added *[dataSourceColors](https://senzing.github.io/sdk-components-ng/classes/SzGraphPrefs.html#dataSourceColors)* configuration to SzPreferencesComponent
- added *[SzEntityDetailGraphFilterComponent](https://senzing.github.io/sdk-components-ng/components/SzEntityDetailGraphFilterComponent.html)*
- added *SzStandaloneGraphComponent*, a embeddable graph components designed to run in it's own context or near-to.
- added new [SzDataSourcesService](https://senzing.github.io/sdk-components-ng/injectables/SzDataSourcesService.html) class for retrieving the datasources from the api server instance.
- modified existing SzGraphComponent code, adding all new properties to keep feature parity with SzStandaloneGraphComponent's implementation.
- added new *layout-rail* layout for ... well, exactly what it sounds like, a rail version of the entity detail component.
- relevant tickets
  - [#105](https://github.com/Senzing/sdk-components-ng/issues/105)
  - [#104](https://github.com/Senzing/sdk-components-ng/issues/104)

## [1.0.9] - 2019-09-23

### Added to 1.0.9

- Added [SzPrefsService](https://senzing.github.io/sdk-components-ng/injectables/SzPrefsService.html)
- Added [SzPreferencesComponent](https://senzing.github.io/sdk-components-ng/components/SzPreferencesComponent.html)
- CSS for responsive breakpoint(s) and/or reflow on narrow width
- Various UI/UX layout bugfixes
- Graph should reload on entityIdChange
- Graph should collapse on *0* results
- Include "other data" in records area.
- Text highlighting no longer triggers click-thru
- Search identifiers drop-down should auto-update on api config change
- relevant tickets:
  - [#102](https://github.com/Senzing/sdk-components-ng/issues/102)
  - [#100](https://github.com/Senzing/sdk-components-ng/issues/100)
  - [#96](https://github.com/Senzing/sdk-components-ng/issues/96)
  - [#94](https://github.com/Senzing/sdk-components-ng/issues/94)
  - [#92](https://github.com/Senzing/sdk-components-ng/issues/92)
  - [#90](https://github.com/Senzing/sdk-components-ng/issues/90)
  - [#88](https://github.com/Senzing/sdk-components-ng/issues/88)
  - [#86](https://github.com/Senzing/sdk-components-ng/issues/86)
  - [#84](https://github.com/Senzing/sdk-components-ng/issues/84)
  - [#82](https://github.com/Senzing/sdk-components-ng/issues/82)
  - [#79](https://github.com/Senzing/sdk-components-ng/issues/79)
  - [#78](https://github.com/Senzing/sdk-components-ng/issues/78)

## [1.0.8] - 2019-07-30

### Added to 1.0.8

- Graph decoupling
- Graph enhancements
- Bring graph dependency up to 0.0.4
- smarter entity icon inference
- fix for identifier searches sending the wrong parameter format to the api server
- fix for PDF service ignoring filename parameter
- relevant issues:
  - [#74](https://github.com/Senzing/sdk-components-ng/issues/74)
  - [#71](https://github.com/Senzing/sdk-components-ng/issues/71)
  - [#70](https://github.com/Senzing/sdk-components-ng/issues/70)
  - [#65](https://github.com/Senzing/sdk-components-ng/issues/65)
  - [#67](https://github.com/Senzing/sdk-components-ng/issues/67)
  - [#69](https://github.com/Senzing/sdk-components-ng/issues/69)

## [1.0.7] - 2019-07-19

### Added to 1.0.7

- Allow title of At a Glance graph component to be set from outside
- At a Glance now Relationships at a Glance
- Consume version of sdk-graph-components with fixes for node drifting
- Change Relationships at a Glance buildout to 1

## [1.0.6] - 2019-07-11

### Added to 1.0.6

- added "print to PDF" service.
- now uses separate [sdk-graph-components](https://github.com/senzing/sdk-graph-components) package for embedded graphs.
- Removed all graph components from package and moved code to /deprecated folder. will be removed in future release.
- Update all graph component references to use separate package namespace
- Changed default api server port to 8080, this way you can run the services directly against a default docker image of the senzing-api-server. factors in to e2e.
- Updated documentation to reflect changes
- Added better css classes to components to allow for more precise e2e test cases
- bugfix for constant redraw issue on "possible matches" node #47
- relevant issues:
  - [#39](https://github.com/Senzing/sdk-components-ng/issues/39)
  - [#47](https://github.com/Senzing/sdk-components-ng/issues/47)
  - [#56](https://github.com/Senzing/sdk-components-ng/issues/56)
  - [#60](https://github.com/Senzing/sdk-components-ng/issues/60)
  - [#63](https://github.com/Senzing/sdk-components-ng/issues/63)

## [1.0.5] - 2019-06-05

### Added to 1.0.5

fixes, features for:

- [#26](https://github.com/Senzing/sdk-components-ng/issues/26)
- [#38](https://github.com/Senzing/sdk-components-ng/issues/38)
- [#40](https://github.com/Senzing/sdk-components-ng/issues/40)

![2019-06-05_130246](https://user-images.githubusercontent.com/13721038/58986445-3f63f080-8792-11e9-913e-137253d54b7e.png)

- D3 integration in to Entity Detail component as "At a Glance"
- Src Path updates and refactoring to support automated building on windows
- SzRelationshipNetworkInputComponent
- SzRelationshipNetworkLookupComponent component
- SzRelationshipNetworkUploadComponent component
- remove extraneous div in sz-search markup
- remove extra padding/margins from search component wrapper
- add onKeyEnter handler to submit search when search button is hidden/not present
- Add New  CSS Theme Variables:
  - --sz-search-results-name-color
  - --sz-search-results-name-hover-color
  - --sz-search-results-name-font-weight
  - --sz-search-input-hover-border-color
  - --sz-search-input-focus-border-color
  - --sz-search-results-color
  - --sz-search-results-a-hover-color
  - --sz-search-results-name-color
  - --sz-search-results-name-hover-color
  - --sz-search-results-name-font-weight
  - --sz-search-results-name-min-width
  - --sz-search-results-transition
