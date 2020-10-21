import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { APP_BASE_HREF } from '@angular/common';

import {
  SenzingSdkModule,
  SzConfigurationAboutComponent,
  SzConfigurationComponent,
  SzEntityDetailComponent,
  SzEntityDetailGraphComponent,
  SzEntityRecordViewerComponent,
  SzPoweredByComponent,
  SzPreferencesComponent,
  SzRestConfiguration,
  SzSearchByIdComponent,
  SzSearchComponent,
  SzSearchResultsComponent,
  SzStandaloneGraphComponent
} from '@senzing/sdk-components-ng';
// for graph support
import {
  SenzingSdkGraphModule,
  SzRelationshipNetworkComponent,
  SzRelationshipPathComponent
} from '@senzing/sdk-graph-components';

/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig, environment } from '../environments/environment';

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}


@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
    SenzingSdkGraphModule.forRoot( SzRestConfigurationFactory )
  ],
  providers: [{provide: APP_BASE_HREF, useValue: '/'}]
})
export class AppModule { 
  constructor(private injector: Injector) {

    // configuration summary
    const WC_CONF_ABOUT = createCustomElement(SzConfigurationAboutComponent, { injector });
    customElements.define('sz-configuration-about', WC_CONF_ABOUT);

    // configuration injector
    const WC_CONF = createCustomElement(SzConfigurationComponent, { injector });
    customElements.define('sz-configuration', WC_CONF);

    // entity detail
    const WC_ENT_DETAIL = createCustomElement(SzEntityDetailComponent, { injector });
    customElements.define('sz-entity-detail', WC_ENT_DETAIL);

    // small embedded graph 
    // ! breaks entity detail graph. not sure why
    const WC_GRAPH_SMALL = createCustomElement(SzEntityDetailGraphComponent, { injector });
    customElements.define('sz-embedded-graph', WC_GRAPH_SMALL);

    // view a entity record information (json tree/summary)
    const WC_ENT_REC_VIEWER = createCustomElement(SzEntityRecordViewerComponent, { injector });
    customElements.define('sz-entity-record-viewer', WC_ENT_REC_VIEWER);

    // powered by tag
    const WC_PWR_BY = createCustomElement(SzPoweredByComponent, { injector });
    customElements.define('sz-powered-by', WC_PWR_BY);

    // preferences control component
    const WC_PREFS_PNL = createCustomElement(SzPreferencesComponent, { injector });
    customElements.define('sz-preferences', WC_PREFS_PNL);

    // search by record id or entity id
    const WC_SRCH_BY_ID = createCustomElement(SzSearchByIdComponent, { injector });
    customElements.define('sz-search-by-id', WC_SRCH_BY_ID);

    // search by attribute or name
    const WC_SRCH_BY_ATTR = createCustomElement(SzSearchComponent, { injector });
    customElements.define('sz-search', WC_SRCH_BY_ATTR);

    // search results list
    const WC_SRCH_RESULTS = createCustomElement(SzSearchResultsComponent, { injector });
    customElements.define('sz-search-results', WC_SRCH_RESULTS);
    
    // large format graph
    const WC_GRAPH_LARGE = createCustomElement(SzStandaloneGraphComponent, { injector });
    customElements.define('sz-standalone-graph', WC_GRAPH_LARGE);
    
    // relationship network graph tag
    // !! DO NOT use the same tag name as defined in the class, it will break nested component rendering !!
    const WC_GRAPH_NETWORK = createCustomElement(SzRelationshipNetworkComponent, { injector });
    customElements.define('sz-wc-relationship-network', WC_GRAPH_NETWORK);
    
    // relationship path graph tag
    const WC_GRAPH_PATH = createCustomElement(SzRelationshipPathComponent, {injector});
    customElements.define('sz-wc-relationship-path', WC_GRAPH_PATH);
  }
  ngDoBootstrap() {}
}
