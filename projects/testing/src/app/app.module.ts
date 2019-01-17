import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';
import { SzSearchComponentTest } from './search/sz-search/sz-search.component';
import { ApiModule } from '@senzing/rest-api-client-ng';

@NgModule({
  declarations: [
    AppComponent,
    SzSearchComponentTest
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SenzingSdkModule.forRoot(
      () => {
        return new SzRestConfiguration({
          basePath: '/api',
          hostName: 'SizzzLaK',
          portNum: 22080,
          withCredentials: false
        });
      },
      () => {
        return new SzRestConfiguration({
          basePath: '/sz-rest-api',
          withCredentials: false
        });
      }
    ),
    ApiModule.forRoot(
      () => {
        return new SzRestConfiguration({
          basePath: '/sz-rest-api',
          withCredentials: false
        });
      }
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
