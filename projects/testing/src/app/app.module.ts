import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';
import { ApiModule } from '@senzing/rest-api-client-ng';

import { AppComponent } from './app.component';
import { SzSearchComponentTest } from './search/sz-search/sz-search.component';

import { SzSearchResultsTestComponent } from './search/sz-search-results-test/sz-search-results-test.component';
import { SzSearchResultsCardTestComponent } from './search/sz-search-results-card-test/sz-search-results-card-test.component';
import { SzSearchResultCardHeaderTestComponent } from './search/sz-search-results-card-test/sz-search-result-card-header-test/sz-search-result-card-header-test.component';
import { SzSearchResultCardContentTestComponent } from './search/sz-search-results-card-test/sz-search-result-card-content-test/sz-search-result-card-content-test.component';

@NgModule({
  declarations: [
    AppComponent,
    SzSearchComponentTest,
    SzSearchResultsTestComponent,
    SzSearchResultsCardTestComponent,
    SzSearchResultCardHeaderTestComponent,
    SzSearchResultCardContentTestComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SenzingSdkModule.forRoot(
      () => {
        return new SzRestConfiguration({
          basePath: 'http://localhost:2080',
          withCredentials: true
        });
      }
    ),
    ApiModule.forRoot(
      () => {
        return new SzRestConfiguration({
          basePath: 'http://localhost:2080',
          withCredentials: true
        });
      }
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
