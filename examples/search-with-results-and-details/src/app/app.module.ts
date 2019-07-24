import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';
import { OverlayModule } from '@angular/cdk/overlay';

import { AppComponent } from './app.component';
import { SzSearchComponentTest } from './search/sz-search/sz-search.component';

import { SzSearchResultsTestComponent } from './search/sz-search-results-test/sz-search-results-test.component';
import { SzSearchResultsCardTestComponent } from './search/sz-search-results-card-test/sz-search-results-card-test.component';

/*
import {
  SenzingSdkGraphModule
} from '@senzing/sdk-graph-components';
*/

@NgModule({
  declarations: [
    AppComponent,
    SzSearchComponentTest,
    SzSearchResultsTestComponent,
    SzSearchResultsCardTestComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    OverlayModule,
    ReactiveFormsModule,
    SenzingSdkModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
