import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { OverlayModule } from '@angular/cdk/overlay';
import { ApiModule as SenzingDataServiceModule } from '@senzing/rest-api-client-ng';
import { SenzingSdkModule, SzRestConfiguration, SzPoweredByComponent, SzPrefsService, SzConfigurationService  } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';

/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig, environment } from './../environments/environment';

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
        AppComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        OverlayModule,
        ReactiveFormsModule,
        SenzingSdkModule.forRoot(SzRestConfigurationFactory),
        SenzingDataServiceModule.forRoot(SzRestConfigurationFactory)], providers: [
        SzPrefsService,
        SzConfigurationService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
