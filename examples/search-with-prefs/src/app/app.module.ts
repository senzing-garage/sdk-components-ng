import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SenzingSdkModule, SzPrefsService, SzConfigurationService } from '@senzing/sdk-components-ng';
import { OverlayModule } from '@angular/cdk/overlay';
import { StorageServiceModule } from 'ngx-webstorage-service';

import { AppComponent } from './app.component';
import { SzPrefsManagerComponent } from './prefs/prefs-manager.component';

@NgModule({
  declarations: [
    AppComponent,
    SzPrefsManagerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    OverlayModule,
    ReactiveFormsModule,
    StorageServiceModule,
    SenzingSdkModule.forRoot()
  ],
  providers: [
    SzPrefsService,
    SzConfigurationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
