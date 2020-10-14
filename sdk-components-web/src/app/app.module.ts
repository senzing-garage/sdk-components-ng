import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { APP_BASE_HREF } from '@angular/common';

import {
  SenzingSdkModule,
  SzSearchComponent,
  SzSearchResultsComponent,
  SzEntityDetailComponent,
  SzRestConfiguration,
  SzPoweredByComponent,
  SzConfigurationAboutComponent,
  SzConfigurationComponent,
  SzPreferencesComponent
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
    // search box
    const el1 = createCustomElement(SzSearchComponent, { injector });
    customElements.define('sz-search', el1);
    // search results list
    const el2 = createCustomElement(SzSearchResultsComponent, { injector });
    customElements.define('sz-search-results', el2);
    // entity detail
    const el3 = createCustomElement(SzEntityDetailComponent, { injector });
    customElements.define('sz-entity-detail', el3);
    // configuration injector
    const el4 = createCustomElement(SzConfigurationComponent, { injector });
    customElements.define('sz-configuration', el4);
    // configuration summary
    const el5 = createCustomElement(SzConfigurationAboutComponent, { injector });
    customElements.define('sz-configuration-about', el5);
    // configuration injector
    const el6 = createCustomElement(SzPreferencesComponent, { injector });
    customElements.define('sz-preferences', el6);
    // powered by tag
    const el7 = createCustomElement(SzPoweredByComponent, { injector });
    customElements.define('sz-powered-by', el7);
    // relationship network graph tag
    // const el7 = createCustomElement(SzRelationshipNetworkComponent, {injector});
    // customElements.define('sz-relationship-network', el7);
    // relationship path graph tag
    // const el8 = createCustomElement(SzRelationshipPathComponent, {injector});
    // customElements.define('sz-relationship-path', el8);
  }
  ngDoBootstrap() {}
}
