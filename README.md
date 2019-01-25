# @senzing/sdk-components-ng

## Overview
This project is for the senzing sdk components that can be used in other projects using angular 7.X.X
To see an example of an electron app using the sdk components feel free to checkout the latest windows or mac builds from https://senzing.com/senzing-app/

## Dependencies

For building from Source: 
* [Node/NPM](https://nodejs.org/). 
* [Angular CLI](https://cli.angular.io/)
* [TypeScript](https://www.typescriptlang.org/)
* [Senzing REST API Sever](https://github.com/Senzing/rest-api-server-java/)
* [JAVA JDK 1.8](https://jdk.java.net/) _(for rest-api-server-java)_

Please see the installation instructions for each of these for how to install and setup each one properly.

### Installation
#### Shortcuts
If you're developing on Windows or macOS, do yourself a favor and download and install [the app](https://senzing.com/senzing-app/). It installs the G2 libs and sets up project config files. It also gives you an easy way to load and browse data outside of the Senzing REST API Sever. You can do it manually too if you need to.
<br/> <br/>

#### REST Service Gateway
These components require the senzing [Senzing REST API Sever](https://github.com/Senzing/rest-api-server-java/) to function. Follow [the instructions](https://github.com/Senzing/rest-api-server-java/) to check out and build the [Senzing REST API Sever](https://github.com/Senzing/rest-api-server-java/) from source. 

##### Build(and run) from Source
```bash
git@github.com:Senzing/rest-api-server-java.git
cd rest-api-server-java
mvn clean install
java -jar target/sz-api-server-1.5.0.jar -iniFile %LOCALAPPDATA%/Senzing/Workbench/project_1/g2.ini
```

##### from NPM
```bash
npm install @senzing/rest-api-server-java --save
java -jar node_modules/@senzing/rest-api-server-java/sz-api-server-1.5.0.jar
java -Djava.library.path="C:\Program Files\Senzing\g2\lib" -jar node_modules/@senzing/rest-api-server-java/sz-api-server-1.5.0.jar -iniFile node_modules/@senzing/rest-api-server-java/g2.ini
```
<br/> <br/> <br/> 

### SDK Components
open a terminal window to the location of your project and type: 
`npm install @senzing/sdk-components-ng --save`

The components will be added to your node_modules. 

Please take note that all the same [interfaces](https://senzing.github.io/rest-api-client-ng/), and [services](https://senzing.github.io/rest-api-client-ng/) from the [@senzing/rest-api-client-ng package](https://www.npmjs.com/package/@senzing/rest-api-client-ng) will also be available for convenience.

#### Usage
Just add the import statement for the particular component, service, or model that you want to use. 
```typescript
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';
```


<br/> <br/> <br/> 


### Quick Start

<b>1)</b> Start up an instance of the [rest api server](https://github.com/Senzing/rest-api-server-java/) if not currently running.

you can start up the REST Server manually by invoking through java, or by making a slight change to the npm script(for convenience).

<b>through java:</b>

```terminal
java -jar "%HOMEPATH%\www\rest-api-server-java\target\sz-api-server-1.5.0.jar" -iniFile "%LOCALAPPDATA%\Senzing\Workbench\project_1\g2.ini"
```
<br/> 

<b>via npm script: </b><br/>
edit the following line in package.json to point to your projects G2.ini path and the REST Server JAR. Then the server can just be started up by runnning `npm run server`.

```json
"start:server": "java -jar \"%HOMEPATH%\\www\\rest-api-server-java\\target\\sz-api-server-1.5.0.jar\" -iniFile \"%LOCALAPPDATA%\\Senzing\\Workbench\\project_1\\g2.ini\"",
```


  <br/><br/> 


<b>2)</b> Add the SenzingSDKModule to your angular app's app.module.ts 
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
    SenzingSdkModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
  <br/> 
  
<b>3)</b> Check that components can be rendered correctly. Add the following to your app.component.html(or any template) and verify the result: 
```html
<sz-powered-by format="small"></sz-powered-by>
```

The result should be a powered by logo like the following:

![powered by tag](docs/images/ss-powered-by-tag.png)
<br/>

If not then double check that step 2 is correct, and that you remembered to include the 
import statement as well.
<br/> 
<br/> 
<br/>
  

<b>4)</b> Check that components can communicate with rest api gateway sucessfully. Add the following to your app.component.html(or any template) : 
```html
<sz-configuration-about></sz-configuration-about>
```
The result should be a list of service configuration parameters and values.

<b>5)</b> Load the engine with data to resolve. 
   The easiest way to do this currently is to load a CSV using the application. This can also be done through the Senzing REST API.

<b>6)</b> Verify that the components are working properly. The easiest way to do this is to is to just implement a search box, and a result list. Copy the following to your app.component.html file
```html
<sz-search (resultsChange)="onSearchResults($event)"></sz-search>
<sz-search-results 
[results]="currentSearchResults" 
(resultClick)="onSearchResultClick($event)"></sz-search-results>
```
now in your controller class(app.component.ts) add the *onSearchResults* and *onSearchResultClick* methods we just referenced above:
```typescript
import { Component } from '@angular/core';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'senzing-sdk-consumer';
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number;
  public currentSearchParameters: SzEntitySearchParams;

  onSearchResults(evt: SzAttributeSearchResult[]) {
    console.log('@senzing/sz-search-results: ', evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property
  }

  public onSearchResultClick(entityData: SzAttributeSearchResult) {
    console.log('@senzing/sz-search-results-click: ', entityData);

    if (entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
    }
  }
}
```

Now, start up your standard angular dev server(or maybe just restart for fun) via `ng serve`
and you should be greeted by a page like with a search box. And search results list right below it.<br/>

![screen shot of working example](docs/images/ss-search-with-results.small.png)


<h2>
And that's it! at least for the quickstart. There are a ton more options for running the rest server, interacting with the components and services. </h2>

<br/> <br/> <br/> 

## Configuration & Parameters

The SenzingSDKModule accepts a factory method or a object literal that conforms to the 
properties found in the [Configuration](https://senzing.github.io/rest-api-client-ng/classes/Configuration.html) class. By adding a factory like the following to the constructor method, you can change services configuration to point to non-default values.

The following tells any components to turn on CORS functionality and make all api requests to localhost port 22080( http://localhost:22080/ ).

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot(
      () => {
        return new SzRestConfiguration({
          basePath: 'http://localhost:2080',
          withCredentials: true
        });
      }
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
<br/> 

### Parameters
See [online documentation](https://senzing.github.io/rest-api-client-ng/classes/Configuration.html) for a complete list of configuration parameters that can control the connection behavior of the sdk components.


## Documentation
Installation contains a statically generated API and component references. They can be found in
node_modules/@senzing/sdk-components-ng/docs or [Online here](https://senzing.github.io/sdk-components-ng/).

## Examples
When you check out the source for this repository there is a directory of Angular project examples. Please see the [Examples Readme](https://github.com/Senzing/sdk-components-ng/tree/master/examples) for more information on how these work.

