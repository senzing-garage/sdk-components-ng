# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2019-11-11

### Added to 1.1.0

## [1.0.9] - 2019-09-23

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
