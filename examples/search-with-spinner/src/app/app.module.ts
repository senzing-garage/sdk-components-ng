import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
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

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
