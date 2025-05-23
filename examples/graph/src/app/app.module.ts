import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SenzingSdkModule, SzRestConfiguration  } from '@senzing/sdk-components-ng';
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
        ReactiveFormsModule,
        SenzingSdkModule.forRoot(SzRestConfigurationFactory)], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
