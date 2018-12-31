
# @senzing/sdk-components-ng

## Dependencies
these components are dependent on rest-ful api gateway. 
Node should install this for you when you install this package. If it doesn't, or 
you just want to look through it's documentation you can find it here.

## Installation
### REST Service Gateway
```bash
npm install @senzing/service-rest-http --save
```

### Components
```bash
npm install @senzing/sdk-components-ng --save
```


## Quick Start
After installation you will need to do a few more things.

1) Start up an instance of the @senzing/service-rest-http by running the following 
   from the application root. 
   `java -jar node node_modules/@senzing/service-rest-http/http.jar

2) Add the SenzingSDKModule to your angular app's app.module.ts 
```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SenzingSdkModule } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot(() => {
      return new SzRestConfiguration({
        basePath: "/api/",
        hostName: "localhost",
        portNum: 22080,
        withCredentials: false
      })
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Configuration & Parameters
Table with SzRestConfiguration parameters. (see docs)


## Documentation
Installation contains a statically generated API and component references. They can be found in
node_modules/@senzing/sdk-components-ng/docs or Online here.
