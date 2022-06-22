# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2022-06-27

Thio release adds new functionality around expanding and collapsing related entities in *Network Graph* related components. We've moved the `@senzing/sdk-graph-components` to the scope of this package for easier maintenance and installation(now you just need this package instead of two). We're also adding the *Why Not* component that can be embedded between two or more entities to generate a report to show why two entities/records did not resolve.

### Added
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
- The follwing getters and setters added to `SzEntityDetailComponent`
  - `showGraphContextMenu` enables the built-in context menu for entity nodes on the graph embedded in the entity detail component.
  - `showGraphLinkContextMenu` enables the built-in context menu for relationship lines/labels on the graph embedded in the entity detail component.
- The following Event Emitters added to `SzEntityDetailComponent`
  - `graphRelationshipContextMenuClick` is emitted when a user right clicks on relationship lines/labels in the embedded graph component.
  - `graphRelationshipClick` is emitted when a user clicks on relationship lines/labels in the embedded graph component.
- `SzRelationshipNetworkComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipNetworkInputComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipNetworkLookupComponent` moved from `@senzing/sdk-graph-components`
- `SzRelationshipPathComponent` moved from `@senzing/sdk-graph-components`

### Modified
- `_graphIds` property on `SzGraphComponent` type changed from `number[]` to `SzEntityIdentifier[]`
- `graphIds` property getter and setter on `SzGraphComponent` type changed from `number[]` to `SzEntityIdentifier[]`
- `reload` method in `SzGraphComponent` parameter type changed to `string | number | SzEntityIdentifier | SzEntityIdentifier[]`

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
