import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from '../../../data/services/in-memory-data.service';

import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent } from '@senzing/sdk-components-ng';
import { AppComponent } from './app.component';
import { SzSearchComponentTest } from './search/sz-search/sz-search.component';

import { SzSearchResultsTestComponent } from './search/sz-search-results-test/sz-search-results-test.component';
import { SzSearchResultsCardTestComponent } from './search/sz-search-results-card-test/sz-search-results-card-test.component';

import { environment } from '../environments/environment';

/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig } from './../environments/environment';

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration( (apiConfig ? apiConfig : undefined) );
}

@NgModule({ declarations: [
        AppComponent,
        SzSearchComponentTest,
        SzSearchResultsTestComponent,
        SzSearchResultsCardTestComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        SenzingSdkModule.forRoot(SzRestConfigurationFactory),
        environment.test ? HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }) : []], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
