'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">Senzing SDK Components</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Guides</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/web-components.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' : 'data-target="#xs-additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' }>
                                                <span class="link-name">Web Components</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' : 'id="xs-additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/web-components/quick-start.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Quick Start</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/web-components/examples.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Examples</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/web-components/examples/configure-rest-server-connection-properties.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Configure Rest Server Connection Properties</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/web-components/examples/attribute-search-with-results.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Attribute Search with Results</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/web-components/examples/id-search-with-record-viewer.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Id Search with Record Viewer</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/web-components/examples/large-graph-with-filtering.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Large Graph with Filtering</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/web-components/examples/small-graph-(for-embedding).html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Small Graph (for embedding)</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/graph-components.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' : 'data-target="#xs-additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' }>
                                                <span class="link-name">Graph Components</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' : 'id="xs-additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/graph-components/szstandalonegraphcomponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">SzStandaloneGraphComponent</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/graph-components/szrelationshipnetworkcomponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">SzRelationshipNetworkComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/themes.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' : 'data-target="#xs-additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' }>
                                                <span class="link-name">Themes</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' : 'id="xs-additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/themes/pre-built.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Pre Built</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/themes/customizing.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Customizing</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/SenzingSdkModule.html" data-type="entity-link" >SenzingSdkModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' : 'data-target="#xs-components-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' :
                                            'id="xs-components-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' }>
                                            <li class="link">
                                                <a href="components/SzConfigurationAboutComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzConfigurationAboutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzConfigurationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzConfigurationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzEntityDetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzEntityDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzEntityDetailGraphFilterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzEntityDetailGraphFilterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzEntityRecordViewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzEntityRecordViewerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzPoweredByComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzPoweredByComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzPreferencesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzPreferencesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchByIdComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchByIdComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchIdentifiersPickerDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchIdentifiersPickerDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchIdentifiersPickerSheetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchIdentifiersPickerSheetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchResultsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchResultsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzStandaloneGraphComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzStandaloneGraphComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' : 'data-target="#xs-injectables-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' :
                                        'id="xs-injectables-links-module-SenzingSdkModule-2a7ae69ec06c573c9fdbd0466ed5d238f2805800d59831f7b0b21459fcc40b44c379152b1977616e44ae1d4ccd5c1e2d17e619c9f9ba8271a7baf93bf9e1d092"' }>
                                        <li class="link">
                                            <a href="injectables/SzAdminService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzAdminService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzBulkDataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzBulkDataService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzConfigurationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzDataSourcesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzDataSourcesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzEntityTypesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzEntityTypesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzFoliosService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzFoliosService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzPdfUtilService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzPdfUtilService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzPrefsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzPrefsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzSearchService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzSearchService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzUIEventService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SzUIEventService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SzSdkMaterialModule.html" data-type="entity-link" >SzSdkMaterialModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/SzAdminPrefs.html" data-type="entity-link" >SzAdminPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzBulkDataAnalysis.html" data-type="entity-link" >SzBulkDataAnalysis</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzDataSourceRecordAnalysis.html" data-type="entity-link" >SzDataSourceRecordAnalysis</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzEntityDetailPrefs.html" data-type="entity-link" >SzEntityDetailPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzFolio.html" data-type="entity-link" >SzFolio</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzFolioItem.html" data-type="entity-link" >SzFolioItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzGraphPrefs.html" data-type="entity-link" >SzGraphPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSdkPrefsBase.html" data-type="entity-link" >SzSdkPrefsBase</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchFormPrefs.html" data-type="entity-link" >SzSearchFormPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchHistoryFolio.html" data-type="entity-link" >SzSearchHistoryFolio</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchHistoryFolioItem.html" data-type="entity-link" >SzSearchHistoryFolioItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchParamsFolio.html" data-type="entity-link" >SzSearchParamsFolio</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchParamsFolioItem.html" data-type="entity-link" >SzSearchParamsFolioItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchResultsPrefs.html" data-type="entity-link" >SzSearchResultsPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzServerError.html" data-type="entity-link" >SzServerError</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AdminStreamAnalysisConfig.html" data-type="entity-link" >AdminStreamAnalysisConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdminStreamConnProperties.html" data-type="entity-link" >AdminStreamConnProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdminStreamLoadConfig.html" data-type="entity-link" >AdminStreamLoadConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzDataSourceComposite.html" data-type="entity-link" >SzDataSourceComposite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzEntityDetailSectionData.html" data-type="entity-link" >SzEntityDetailSectionData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzEntityDetailSectionSummary.html" data-type="entity-link" >SzEntityDetailSectionSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzEntitySearchParams.html" data-type="entity-link" >SzEntitySearchParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzMatchFields.html" data-type="entity-link" >SzMatchFields</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzMatchKeyComposite.html" data-type="entity-link" >SzMatchKeyComposite</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzNetworkGraphInputs.html" data-type="entity-link" >SzNetworkGraphInputs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzRawData.html" data-type="entity-link" >SzRawData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzRawDataMatches.html" data-type="entity-link" >SzRawDataMatches</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSdkPrefsModel.html" data-type="entity-link" >SzSdkPrefsModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSearchEvent.html" data-type="entity-link" >SzSearchEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSearchResultEntityData.html" data-type="entity-link" >SzSearchResultEntityData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSectionDataByDataSource.html" data-type="entity-link" >SzSectionDataByDataSource</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});