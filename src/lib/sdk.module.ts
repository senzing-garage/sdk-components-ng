import { NgModule, Injector, ModuleWithProviders, SkipSelf, Optional, Provider, InjectionToken } from '@angular/core';
/* import { BrowserModule } from '@angular/platform-browser'; */
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, Location, LocationStrategy, PathLocationStrategy, TitleCasePipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import {
  ApiModule,
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters
} from '@senzing/rest-api-client-ng';
import { SzSdkMaterialModule } from './sdk.material.module';

/** services */
import { SzMessageBundleService } from './services/sz-message-bundle.service';
import { SzSearchService } from './services/sz-search.service';
import { SzConfigurationService } from './services/sz-configuration.service';
import { SzFoliosService } from './services/sz-folios.service';
import { SzUIEventService } from './services/sz-ui.service';
import { SzPrefsService } from './services/sz-prefs.service';
import { SzDataSourcesService } from './services/sz-datasources.service';
import { SzAdminService } from './services/sz-admin.service';
import { SzBulkDataService } from './services/sz-bulk-data.service';
import { SzCSSClassService } from './services/sz-css-class.service';
import { SzConfigDataService } from './services/sz-config-data.service';

/** components */
import { SzMultiSelectButtonComponent } from './shared/multi-select-button/multi-select-button.component';
import { SzAlertMessageDialog } from './shared/alert-dialog/sz-alert-dialog.component';

/** entity resume related */
import { SzEntityDetailComponent } from './entity/detail/sz-entity-detail.component';
import { SzEntityDetailHeaderComponent } from './entity/detail/sz-entity-detail-header/header.component';
import { SzEntityDetailSectionSummaryComponent } from './entity/detail/sz-entity-detail-header/summary.component';
import { SzEntityDetailHeaderContentComponent } from './entity/detail/sz-entity-detail-header/content.component';
import { SzEntityDetailsSectionComponent } from './entity/detail/sz-entity-details-section/sz-entity-details-section.component';
import { SzEntityDetailSectionHeaderComponent } from './entity/detail/sz-entity-details-section/header.component';
import { SzEntityDetailSectionCollapsibleCardComponent } from './entity/detail/sz-entity-details-section/collapsible-card.component';
import { SzEntityDetailGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph.component';
import { SzEntityDetailHowReportComponent } from './entity/detail/sz-entity-detail-how-report/sz-entity-detail-how-report.component';
import { SzEntityMatchPillComponent } from './entity/sz-entity-match-pill/sz-entity-match-pill.component';
import { SzEntityRecordCardComponent } from './entity/sz-entity-record-card/sz-entity-record-card.component';
import { SzEntityRecordCardHeaderComponent } from './entity/sz-entity-record-card/sz-entity-record-card-header/sz-entity-record-card-header.component';
import { SzEntityRecordCardContentComponent } from './entity/sz-entity-record-card/sz-entity-record-card-content/sz-entity-record-card-content.component';

// graph components
import { SzRelationshipNetworkComponent } from './graph/sz-relationship-network/sz-relationship-network.component';
import { SzRelationshipNetworkInputComponent } from './graph/sz-relationship-network-input/sz-relationship-network-input.component';
import { SzRelationshipNetworkLookupComponent } from './graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
import { SzRelationshipPathComponent } from './graph/sz-relationship-path/sz-relationship-path.component';
import { SzEntityDetailGraphControlComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-control.component';
import { SzEntityDetailGraphFilterComponent } from './entity/detail/sz-entity-detail-graph/sz-entity-detail-graph-filter.component';
import { SzGraphControlComponent } from './graph/sz-graph-control.component';
import { SzStandaloneGraphComponent } from './entity/detail/sz-entity-detail-graph/sz-standalone-graph.component';
import { SzGraphFilterComponent } from './graph/sz-graph-filter.component';
import { SzGraphComponent } from './graph/sz-graph.component';
// search related
import { SzSearchComponent } from './search/sz-search/sz-search.component';
import { SzSearchIdentifiersPickerDialogComponent, SzSearchIdentifiersPickerSheetComponent } from './search/sz-search/sz-search-identifiers-picker.component';
import { SzSearchByIdComponent } from './search/sz-search/sz-search-by-id.component';
import { SzEntityRecordViewerComponent } from './record/sz-entity-record-viewer.component';
import { SzSearchResultsComponent } from './search/sz-search-results/sz-search-results.component';
import { SzSearchResultCardComponent } from './search/sz-search-result-card/sz-search-result-card.component';
import { SzSearchResultCardContentComponent } from './search/sz-search-result-card/sz-search-result-card-content/sz-search-result-card-content.component';
import { SzSearchResultCardHeaderComponent } from './search/sz-search-result-card/sz-search-result-card-header/sz-search-result-card-header.component';
import { SzConfigurationAboutComponent } from './configuration/sz-configuration-about/sz-configuration-about.component';
import { SzConfigurationComponent } from './configuration/sz-configuration/sz-configuration.component';
import { SzPoweredByComponent } from './sz-powered-by/sz-powered-by.component';
import { SzPreferencesComponent } from './configuration/sz-preferences/sz-preferences.component';
import { SzPrefDictComponent } from './configuration/sz-preferences/sz-pref-dict/sz-pref-dict.component';
// why related
import { SzWhyEntityComponent } from './why/sz-why-entity.component';
import { SzWhyEntitiesComparisonComponent } from './why/sz-why-entities.component';
import { SzWhyEntityDialog } from './why/sz-why-entity.component';
import { SzWhyEntitiesDialog } from './why/sz-why-entities.component';
// how related
import { SzHowECEntityComponent, SzHowECEntityDialog } from './how/ec/sz-how-ec-entity.component';
import { SzHowECStepComponent } from './how/ec/sz-how-ec-step.component';
import { SzHowECCardBaseComponent } from './how/ec/cards/sz-how-ec-entity-card-base.component';
import { SzHowECFinalCardComponent } from './how/ec/cards/sz-how-ec-entity-card-final.component';
import { SzHowECVirtualCardComponent } from './how/ec/cards/sz-how-ec-virtual-card.component';
import { SzHowUICoordinatorService } from './services/sz-how-ui-coordinator.service';
import { SzHowECToolbarComponent } from './how/ec/sz-how-ec-toolbar.component';
import { SzHowECSourceRecordsComponent } from './how/ec/sz-dialog-how-ec-source-records.component';

import { SzHowRCEntityComponent } from './how/rc/sz-how-rc-entity.component';
import { SzHowRCFinalEntityCardComponent } from './how/rc/cards/sz-how-rc-final-entity-card.component';
import { SzHowRCNavComponent } from './how/rc/sz-how-rc-nav.component';
import { SzHowRCStepCardComponent } from './how/rc/cards/sz-how-rc-step-card.component';
import { SzHowRCStepStackComponent } from './how/rc/sz-how-rc-step-stack.component';
import { SzHowUIService } from './services/sz-how-ui.service';
import { SzHowRCVirtualEntityCardComponent } from './how/rc/cards/sz-how-rc-virtual-entity-card.component';
import { SzHowRCVirtualEntityDialog } from './how/rc/sz-how-rc-virtual-entity-dialog.component';

import { SzHowRCStepNodeComponent } from './how/rc/sz-how-rc-step-node.component';

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
        SzAlertMessageDialog,
        SzConfigurationAboutComponent,
        SzConfigurationComponent,
        SzEntityDetailComponent,
        SzEntityDetailGraphControlComponent,
        SzEntityDetailGraphComponent,
        SzEntityDetailGraphFilterComponent,
        SzEntityDetailHeaderComponent,
        SzEntityDetailHeaderContentComponent,
        SzEntityDetailHowReportComponent,
        SzEntityDetailSectionSummaryComponent,
        SzEntityDetailSectionHeaderComponent,
        SzEntityDetailSectionCollapsibleCardComponent,
        SzEntityDetailsSectionComponent,
        SzEntityMatchPillComponent,
        SzEntityRecordCardComponent,
        SzEntityRecordViewerComponent,
        SzEntityRecordCardHeaderComponent,
        SzEntityRecordCardContentComponent,
        SzGraphControlComponent,
        SzGraphComponent,
        SzGraphFilterComponent,
        SzHowECCardBaseComponent,
        SzHowECEntityComponent,
        SzHowECEntityDialog,
        SzHowECFinalCardComponent,
        SzHowECSourceRecordsComponent,
        SzHowECStepComponent,
        SzHowECToolbarComponent,
        SzHowECVirtualCardComponent,
        SzHowRCEntityComponent,
        SzHowRCFinalEntityCardComponent,
        SzHowRCNavComponent,
        SzHowRCStepCardComponent,
        SzHowRCStepNodeComponent,
        SzHowRCStepStackComponent,
        SzHowRCVirtualEntityCardComponent,
        SzHowRCVirtualEntityDialog,
        SzMultiSelectButtonComponent,
        SzPoweredByComponent,
        SzPreferencesComponent,
        SzPrefDictComponent,
        SzRelationshipNetworkComponent,
        SzRelationshipNetworkInputComponent,
        SzRelationshipNetworkLookupComponent,
        SzRelationshipPathComponent,
        SzSearchComponent,
        SzSearchByIdComponent,
        SzSearchIdentifiersPickerDialogComponent,
        SzSearchIdentifiersPickerSheetComponent,
        SzSearchResultsComponent,
        SzSearchResultCardComponent,
        SzSearchResultCardContentComponent,
        SzSearchResultCardHeaderComponent,
        SzStandaloneGraphComponent,
        SzWhyEntitiesComparisonComponent,
        SzWhyEntityComponent,
        SzWhyEntitiesDialog,
        SzWhyEntityDialog
    ],
    imports: [
        CommonModule,
        DragDropModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        LayoutModule,
        NgxJsonViewerModule,
        ApiModule,
        SzSdkMaterialModule
    ],
    exports: [
        SzConfigurationComponent,
        SzConfigurationAboutComponent,
        SzEntityDetailGraphComponent,
        SzEntityDetailComponent,
        SzEntityDetailHowReportComponent,
        SzEntityDetailGraphControlComponent,
        SzEntityDetailGraphFilterComponent,
        SzEntityRecordViewerComponent,
        SzGraphComponent,
        SzGraphControlComponent,
        SzGraphFilterComponent,
        SzHowECEntityComponent,
        SzHowECEntityDialog,
        SzHowECSourceRecordsComponent,
        SzHowECToolbarComponent,
        SzHowECVirtualCardComponent,
        SzHowRCEntityComponent,
        SzHowRCNavComponent,
        SzHowRCStepNodeComponent,
        SzHowRCStepStackComponent,
        SzHowRCVirtualEntityCardComponent,
        SzHowRCVirtualEntityDialog,
        SzPoweredByComponent,
        SzPreferencesComponent,
        SzRelationshipNetworkComponent,
        SzRelationshipNetworkInputComponent,
        SzRelationshipNetworkLookupComponent,
        SzRelationshipPathComponent,
        SzSearchComponent,
        SzSearchByIdComponent,
        SzSearchResultsComponent,
        SzSearchResultCardComponent,
        SzStandaloneGraphComponent,
        SzWhyEntitiesComparisonComponent,
        SzWhyEntityComponent,
        SzWhyEntitiesDialog,
        SzWhyEntityDialog,
        SzPreferencesComponent
    ],
    providers: [
        SzMessageBundleService,
        SzAdminService,
        SzBulkDataService,
        SzConfigDataService,
        SzConfigurationService,
        SzCSSClassService,
        SzDataSourcesService,
        SzFoliosService,
        SzHowUICoordinatorService,
        SzHowUIService,
        SzPrefsService,
        SzSearchService,
        HttpClient,
        TitleCasePipe,
        SzUIEventService
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
  public static forRoot(apiConfigFactory?: () => SzRestConfiguration): ModuleWithProviders<SenzingSdkModule> {
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
