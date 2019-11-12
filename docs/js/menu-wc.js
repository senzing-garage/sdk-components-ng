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
                                        <a data-type="chapter-link" href="additional-documentation/themes.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-247b91889b4cfdb46d99aa0ed55b635b"' : 'data-target="#xs-additional-page-247b91889b4cfdb46d99aa0ed55b635b"' }>
                                                <span class="link-name">Themes</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-247b91889b4cfdb46d99aa0ed55b635b"' : 'id="xs-additional-page-247b91889b4cfdb46d99aa0ed55b635b"' }>
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
                                <a href="modules/SenzingSdkModule.html" data-type="entity-link">SenzingSdkModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' : 'data-target="#xs-components-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' :
                                            'id="xs-components-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' }>
                                            <li class="link">
                                                <a href="components/SzConfigurationAboutComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzConfigurationAboutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzConfigurationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzConfigurationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzEntityDetailComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzEntityDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzEntityDetailGraphFilterComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzEntityDetailGraphFilterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzPoweredByComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzPoweredByComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzPrefDictComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzPrefDictComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzPreferencesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzPreferencesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzSearchComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SzSearchResultsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SzSearchResultsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' : 'data-target="#xs-injectables-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' :
                                        'id="xs-injectables-links-module-SenzingSdkModule-2de1d4a17edcc2ac98176575954aee83"' }>
                                        <li class="link">
                                            <a href="injectables/SzConfigurationService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzDataSourcesService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzDataSourcesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzPdfUtilService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzPdfUtilService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzPrefsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzPrefsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzSearchService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzSearchService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SzUIEventService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SzUIEventService</a>
                                        </li>
                                    </ul>
                                </li>
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
                                <a href="classes/SzEntityDetailPrefs.html" data-type="entity-link">SzEntityDetailPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzGraphPrefs.html" data-type="entity-link">SzGraphPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSdkPrefsBase.html" data-type="entity-link">SzSdkPrefsBase</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchFormPrefs.html" data-type="entity-link">SzSearchFormPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzSearchResultsPrefs.html" data-type="entity-link">SzSearchResultsPrefs</a>
                            </li>
                            <li class="link">
                                <a href="classes/SzServerError.html" data-type="entity-link">SzServerError</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/SzConfigurationService.html" data-type="entity-link">SzConfigurationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SzDataSourcesService.html" data-type="entity-link">SzDataSourcesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SzPdfUtilService.html" data-type="entity-link">SzPdfUtilService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SzPrefsService.html" data-type="entity-link">SzPrefsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SzSearchService.html" data-type="entity-link">SzSearchService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SzUIEventService.html" data-type="entity-link">SzUIEventService</a>
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
                                <a href="interfaces/SzEntityDetailSectionData.html" data-type="entity-link">SzEntityDetailSectionData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzEntityDetailSectionSummary.html" data-type="entity-link">SzEntityDetailSectionSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzEntitySearchParams.html" data-type="entity-link">SzEntitySearchParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzMatchFields.html" data-type="entity-link">SzMatchFields</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzNetworkGraphInputs.html" data-type="entity-link">SzNetworkGraphInputs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzRawData.html" data-type="entity-link">SzRawData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzRawDataMatches.html" data-type="entity-link">SzRawDataMatches</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSdkPrefsModel.html" data-type="entity-link">SzSdkPrefsModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SzSearchResultEntityData.html" data-type="entity-link">SzSearchResultEntityData</a>
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
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
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