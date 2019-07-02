import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent  } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';
import { SzRelationshipNetworkInputComponent } from '../../../../src/lib/graph/sz-relationship-network-input/sz-relationship-network-input.component';
import { SzRelationshipNetworkLookupComponent } from '../../../../src/lib/graph/sz-relationship-network-lookup/sz-relationship-network-lookup.component';
import { SzRelationshipNetworkUploadComponent } from '../../../../src/lib/graph/sz-relationship-network-upload/sz-relationship-network-upload.component';

@NgModule({
  declarations: [
    AppComponent,
    SzRelationshipNetworkInputComponent,
    SzRelationshipNetworkLookupComponent,
    SzRelationshipNetworkUploadComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SenzingSdkModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
