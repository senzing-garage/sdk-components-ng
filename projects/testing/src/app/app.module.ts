import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot(() => {
      return new SzRestConfiguration({
        basePath: '/api',
        hostName: 'SizzzLaK',
        portNum: 22080,
        withCredentials: false
      });
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
