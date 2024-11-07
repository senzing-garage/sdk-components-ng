import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SenzingSdkModule, SzPrefsService, SzConfigurationService, SzRestConfiguration } from '@senzing/sdk-components-ng';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AppComponent } from './app.component';
import { SzPrefsManagerComponent } from './prefs/prefs-manager.component';

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
        AppComponent,
        SzPrefsManagerComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        OverlayModule,
        ReactiveFormsModule,
        NgxJsonViewerModule,
        SenzingSdkModule.forRoot(SzRestConfigurationFactory)], providers: [
        SzPrefsService,
        SzConfigurationService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
