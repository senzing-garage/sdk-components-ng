import { NgModule, Injector, ModuleWithProviders, SkipSelf, Optional, Provider, InjectionToken } from '@angular/core';
/* import { BrowserModule } from '@angular/platform-browser'; */
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe, Location, PathLocationStrategy, LocationStrategy } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';

import {
  ApiModule,
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters
} from '@senzing/rest-api-client-ng';

import {
  SenzingSdkGraphModule
} from '@senzing/sdk-graph-components';

/** utilities */
// import { JSONScrubber } from './common/utils';

/** models */
// import { SzEntityDetailSectionData } from './models/entity-detail-section-data';
// import { SzEntitySearchParams } from './models/entity-search';

/** services */
import { SzMessageBundleService } from './services/sz-message-bundle.service';
import { SzSearchService } from './services/sz-search.service';
import { SzConfigurationService } from './services/sz-configuration.service';
import { SzUIEventService } from './services/sz-ui.service';
import { SzPdfUtilService } from './services/sz-pdf-util.service';
import { SzPrefsService } from './services/sz-prefs.service';
import { SzDataSourcesService } from './services/sz-datasources.service';

/** components */
import { SzEntityDetailComponent } from './entity/detail/sz-entity-detail.component';
import { SzEntityDetailHeaderComponent } from './entity/detail/sz-entity-detail-header/header.component';
import { SzEntityDetailSectionSummaryComponent } from './entity/detail/sz-entity-detail-header/summary.component';
import { SzEntityDetailHeaderContentComponent } from './entity/detail/sz-entity-detail-header/content.component';
import { SzEntityDetailsSectionComponent } from './entity/detail/sz-entity-details-section/sz-entity-details-section.component';
import { SzEntityDetailSectionHeaderComponent } from './entity/detail/sz-entity-details-section/header.component';
import { SzEntityDetailSectionCollapsibleCardComponent } from './entity/detail/sz-entity-details-section/collapsible-card.component';

import { SzEntityDetailGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
import { SzEntityDetailGraphControlComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-control.component';
import { SzEntityDetailGraphFilterComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-filter.component';
import { SzEntityMatchPillComponent } from './entity/sz-entity-match-pill/sz-entity-match-pill.component';
import { SzStandaloneGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-standalone-graph.component';
import { SzEntityRecordCardComponent } from './entity/sz-entity-record-card/sz-entity-record-card.component';
import { SzEntityRecordCardHeaderComponent } from './entity/sz-entity-record-card/sz-entity-record-card-header/sz-entity-record-card-header.component';
import { SzEntityRecordCardContentComponent } from './entity/sz-entity-record-card/sz-entity-record-card-content/sz-entity-record-card-content.component';

import { SzSearchComponent } from './search/sz-search/sz-search.component';
import { SzSearchResultsComponent } from './search/sz-search-results/sz-search-results.component';
import { SzSearchResultCardComponent } from './search/sz-search-result-card/sz-search-result-card.component';
import { SzSearchResultCardContentComponent } from './search/sz-search-result-card/sz-search-result-card-content/sz-search-result-card-content.component';
import { SzSearchResultCardHeaderComponent } from './search/sz-search-result-card/sz-search-result-card-header/sz-search-result-card-header.component';
import { SzConfigurationAboutComponent } from './configuration/sz-configuration-about/sz-configuration-about.component';
import { SzConfigurationComponent } from './configuration/sz-configuration/sz-configuration.component';
import { SzPoweredByComponent } from './sz-powered-by/sz-powered-by.component';
import { SzPreferencesComponent } from './configuration/sz-preferences/sz-preferences.component';
import { SzPrefDictComponent } from './configuration/sz-preferences/sz-pref-dict/sz-pref-dict.component';

/**
 * Sets up a default set of service parameters for use
 * by the SDK Components.
 *
 * this is only used when no configuration parameters are set
 * via the forRoot static method.
 * @internal
 */
export function SzDefaultRestConfigurationFactory(): SzRestConfiguration {
  return new SzRestConfiguration({
    basePath: 'http://localhost:8080',
    withCredentials: true
  });
}
/**
 * Injection Token for the rest configuration class
 * @internal
 */
const SzRestConfigurationInjector = new InjectionToken<SzRestConfiguration>("SzRestConfiguration");

/**
 * Senzing SDK Components Module.
 * Add to your applications module imports array.
 */
@NgModule({
  declarations: [
    SzEntityDetailComponent,
    SzSearchComponent,
    SzSearchResultsComponent,
    SzSearchResultCardComponent,
    SzSearchResultCardContentComponent,
    SzEntityDetailGraphComponent,
    SzEntityDetailGraphControlComponent,
    SzEntityDetailGraphFilterComponent,
    SzStandaloneGraphComponent,
    SzEntityDetailHeaderComponent,
    SzEntityDetailsSectionComponent,
    SzEntityDetailSectionSummaryComponent,
    SzEntityDetailHeaderContentComponent,
    SzEntityDetailSectionHeaderComponent,
    SzEntityDetailSectionCollapsibleCardComponent,
    SzEntityMatchPillComponent,
    SzEntityRecordCardComponent,
    SzEntityRecordCardHeaderComponent,
    SzEntityRecordCardContentComponent,
    SzSearchResultCardHeaderComponent,
    SzConfigurationAboutComponent,
    SzConfigurationComponent,
    SzPoweredByComponent,
    SzPreferencesComponent,
    SzPrefDictComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    SenzingSdkGraphModule,
    ApiModule
  ],
  exports: [
    SzEntityDetailComponent,
    SzSearchComponent,
    SzSearchResultsComponent,
    SzSearchResultCardComponent,
    SzPoweredByComponent,
    SzConfigurationComponent,
    SzConfigurationAboutComponent,
    SzEntityDetailGraphComponent,
    SzEntityDetailGraphControlComponent,
    SzEntityDetailGraphFilterComponent,
    SzStandaloneGraphComponent,
    SzPreferencesComponent
  ],
  /** for components being exported as web components */
  entryComponents: [
    SzEntityDetailComponent,
    SzEntityDetailGraphComponent,
    SzStandaloneGraphComponent,
    SzSearchComponent,
    SzSearchResultsComponent,
    SzPoweredByComponent,
    SzConfigurationComponent,
    SzConfigurationAboutComponent,
    SzPreferencesComponent
  ],
  providers: [
    SzMessageBundleService,
    SzSearchService,
    SzConfigurationService,
    SzDataSourcesService,
    SzPrefsService,
    HttpClient,
    TitleCasePipe,
    SzUIEventService,
    SzPdfUtilService,
    Location
  ]
})
export class SenzingSdkModule {
  /**
   * initialize the SenzingSdkModule with an optional factory method that returns a {@link https://senzing.github.io/rest-api-client-ng/classes/Configuration.html|SzRestConfiguration} instance.
   * @see {@link https://senzing.github.io/rest-api-client-ng/classes/Configuration.html|SzRestConfiguration}
   * @example
   export function SzRestConfigurationFactory() {
      return new SzRestConfiguration({ basePath: \"myapiserverhostname.com:8080\", withCredentials: true });
   }

   SenzingSdkModule.forRoot( SzRestConfigurationFactory )
   *
   */
  public static forRoot(apiConfigFactory?: () => SzRestConfiguration): ModuleWithProviders {
    return {
        ngModule: SenzingSdkModule,
        providers: [
          {
            provide: SzRestConfiguration,
            useFactory: apiConfigFactory ? apiConfigFactory : SzDefaultRestConfigurationFactory
          },
          {provide: LocationStrategy, useClass: PathLocationStrategy}
        ]
    };
  }

}
