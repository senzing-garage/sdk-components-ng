import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './services/in-memory-data.service';

import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';
import { SzSearchComponentTest } from './search/sz-search/sz-search.component';

import { SzSearchResultsTestComponent } from './search/sz-search-results-test/sz-search-results-test.component';
import { SzSearchResultsCardTestComponent } from './search/sz-search-results-card-test/sz-search-results-card-test.component';
import { SzRelationshipNetworkInputComponent } from '../../../../src/lib/graph/sz-relationship-network-input/sz-relationship-network-input.component';
import { SzRelationshipNetworkLookupComponent } from '../../../../src/lib/graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
import { SzRelationshipNetworkUploadComponent } from '../../../../src/lib/graph/sz-relationship-network-upload/sz-relationship-network-upload.component';
import { environment } from '../environments/environment';

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( {
    'basePath': '/api',
    'withCredentials': true
  } );
}

@NgModule({
  declarations: [
    AppComponent,
    SzSearchComponentTest,
    SzSearchResultsTestComponent,
    SzSearchResultsCardTestComponent,
    SzRelationshipNetworkInputComponent,
    SzRelationshipNetworkLookupComponent,
    SzRelationshipNetworkUploadComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }),
    FormsModule,
    ReactiveFormsModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
