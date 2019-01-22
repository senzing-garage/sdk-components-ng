# @senzing/sdk-components-ng

## Overview
This project is for the sensing sdk components that can be used in other projects using angular 7.X.X
To see an example of an electron app using the sdk components feel free to checkout the latest windows or mac builds from https://senzing.com/senzing-app/

## Dependencies
these components are dependent on a [rest api gateway](https://github.com/Senzing/rest-api-server-java/) and [the rest-api-client-ng](https://github.com/Senzing/rest-api-client-ng/) [package](https://www.npmjs.com/package/@senzing/rest-api-client-ng). 

### Installation
#### REST Service Gateway
These components require the senzing [rest api gateway](https://github.com/Senzing/rest-api-server-java/) to function. Follow [the instructions](https://github.com/Senzing/rest-api-server-java/) to check out and build the [Api REST server](https://github.com/Senzing/rest-api-server-java/).

##### Build(and run) from Source
```bash
git@github.com:Senzing/rest-api-server-java.git
cd rest-api-server-java
mvn clean install
java -jar target/sz-api-server-1.5.0.jar
```

##### from NPM
```bash
npm install @senzing/rest-api-server-java --save
java -jar node_modules/@senzing/rest-api-server-java/sz-api-server-1.5.0.jar
```

#### Components
open a terminal window to the location of your project and type  
`npm install @senzing/sdk-components-ng --save`
<br/> <br/> 


## Quick Start
After installation you will need to do a few more things.

1) Start up an instance of the [Api REST server](https://github.com/Senzing/rest-api-server-java/) if not currently running.
  <br/> 


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
    SenzingSdkModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
  <br/> 
  
3) Check that components can be rendered correctly. Add the following to your app.component.html(or any template) and verify the result: 
```html
<sz-powered-by format="small"></sz-powered-by>
```
The result should be a powered by logo like the following:
<div style="display: block;">
<div style="
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 14px;
  font-size: 10px;
  padding: 10px 11px;
  border-radius: 5px;
  border: 1px solid #c0c0c0;
  margin: 8px 12px 40px 0px;">
<span style="margin-right: 7px;">powered by</span>
<svg version="1.1" scale="0.5" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" width="60" viewBox="0, 0, 537.609, 135.141" style="align-self: flex-end;">
    <g id="Layer_1" transform="translate(-35.191, -241.664)">
      <g>
        <path d="M35.191,312.961 L55.441,310.992 Q57.27,321.188 62.859,325.969 Q68.449,330.75 77.941,330.75 Q87.996,330.75 93.094,326.496 Q98.191,322.242 98.191,316.547 Q98.191,312.891 96.047,310.324 Q93.902,307.758 88.559,305.859 Q84.902,304.594 71.895,301.359 Q55.16,297.211 48.41,291.164 Q38.918,282.656 38.918,270.422 Q38.918,262.547 43.383,255.691 Q47.848,248.836 56.25,245.25 Q64.652,241.664 76.535,241.664 Q95.941,241.664 105.75,250.172 Q115.559,258.68 116.051,272.883 L95.238,273.797 Q93.902,265.852 89.508,262.371 Q85.113,258.891 76.324,258.891 Q67.254,258.891 62.121,262.617 Q58.816,265.008 58.816,269.016 Q58.816,272.672 61.91,275.273 Q65.848,278.578 81.035,282.164 Q96.223,285.75 103.5,289.582 Q110.777,293.414 114.891,300.059 Q119.004,306.703 119.004,316.477 Q119.004,325.336 114.082,333.07 Q109.16,340.805 100.16,344.566 Q91.16,348.328 77.73,348.328 Q58.184,348.328 47.707,339.293 Q37.23,330.258 35.191,312.961 z" fill="#000000"></path>
        <path d="M179.613,322.734 L199.301,326.039 Q195.504,336.867 187.312,342.527 Q179.121,348.188 166.816,348.188 Q147.34,348.188 137.988,335.461 Q130.605,325.266 130.605,309.727 Q130.605,291.164 140.309,280.652 Q150.012,270.141 164.848,270.141 Q181.512,270.141 191.145,281.145 Q200.777,292.148 200.355,314.859 L150.855,314.859 Q151.066,323.648 155.637,328.535 Q160.207,333.422 167.027,333.422 Q171.668,333.422 174.832,330.891 Q177.996,328.359 179.613,322.734 z M180.738,302.766 Q180.527,294.188 176.309,289.723 Q172.09,285.258 166.043,285.258 Q159.574,285.258 155.355,289.969 Q151.137,294.68 151.207,302.766 z" fill="#000000"></path>
        <path d="M284.379,346.5 L264.621,346.5 L264.621,308.391 Q264.621,296.297 263.355,292.746 Q262.09,289.195 259.242,287.227 Q256.395,285.258 252.387,285.258 Q247.254,285.258 243.176,288.07 Q239.098,290.883 237.586,295.523 Q236.074,300.164 236.074,312.68 L236.074,346.5 L216.316,346.5 L216.316,271.828 L234.668,271.828 L234.668,282.797 Q244.441,270.141 259.277,270.141 Q265.816,270.141 271.23,272.496 Q276.645,274.852 279.422,278.508 Q282.199,282.164 283.289,286.805 Q284.379,291.445 284.379,300.094 z" fill="#000000"></path>
        <g>
          <path d="M296.973,347 L296.973,331.602 L324.957,299.469 Q331.848,291.594 335.152,288.289 Q331.707,288.5 326.082,288.57 L299.715,288.711 L299.715,272.328 L361.449,272.328 L361.449,286.32 L332.902,319.227 L322.848,330.125 Q331.074,329.633 333.043,329.633 L363.629,329.633 L363.629,347 z" fill="#FF0000"></path>
          <path d="M296.973,347 L296.973,331.602 L324.957,299.469 Q331.848,291.594 335.152,288.289 Q331.707,288.5 326.082,288.57 L299.715,288.711 L299.715,272.328 L361.449,272.328 L361.449,286.32 L332.902,319.227 L322.848,330.125 Q331.074,329.633 333.043,329.633 L363.629,329.633 L363.629,347 z" fill-opacity="0" stroke="#FF0000" stroke-width="1"></path>
        </g>
        <path d="M376.418,261.703 L376.418,243.422 L396.176,243.422 L396.176,261.703 z M376.418,346.5 L376.418,271.828 L396.176,271.828 L396.176,346.5 z" fill="#000000"></path>
        <path d="M484.348,346.5 L464.59,346.5 L464.59,308.391 Q464.59,296.297 463.324,292.746 Q462.059,289.195 459.211,287.227 Q456.363,285.258 452.355,285.258 Q447.223,285.258 443.145,288.07 Q439.066,290.883 437.555,295.523 Q436.043,300.164 436.043,312.68 L436.043,346.5 L416.285,346.5 L416.285,271.828 L434.637,271.828 L434.637,282.797 Q444.41,270.141 459.246,270.141 Q465.785,270.141 471.199,272.496 Q476.613,274.852 479.391,278.508 Q482.168,282.164 483.258,286.805 Q484.348,291.445 484.348,300.094 z" fill="#000000"></path>
        <path d="M502.559,351.422 L525.129,354.164 Q525.691,358.102 527.73,359.578 Q530.543,361.688 536.59,361.688 Q544.324,361.688 548.191,359.367 Q550.793,357.82 552.129,354.375 Q553.043,351.914 553.043,345.305 L553.043,334.406 Q544.184,346.5 530.684,346.5 Q515.637,346.5 506.848,333.773 Q499.957,323.719 499.957,308.742 Q499.957,289.969 508.992,280.055 Q518.027,270.141 531.457,270.141 Q545.309,270.141 554.309,282.305 L554.309,271.828 L572.801,271.828 L572.801,338.836 Q572.801,352.055 570.621,358.594 Q568.441,365.133 564.504,368.859 Q560.566,372.586 553.992,374.695 Q547.418,376.805 537.363,376.805 Q518.379,376.805 510.434,370.301 Q502.488,363.797 502.488,353.812 Q502.488,352.828 502.559,351.422 z M520.207,307.617 Q520.207,319.5 524.812,325.02 Q529.418,330.539 536.168,330.539 Q543.41,330.539 548.402,324.879 Q553.395,319.219 553.395,308.109 Q553.395,296.508 548.613,290.883 Q543.832,285.258 536.52,285.258 Q529.418,285.258 524.812,290.777 Q520.207,296.297 520.207,307.617 z" fill="#000000"></path>
      </g>
    </g>
</svg>
</div></div>

If not then double check that step 2 is correct, and that you remembered to include the 
import statement as well.
<br/> 
<br/> 
<br/>
  

4) Check that components can communicate with rest api gateway sucessfully. Add the following to your app.component.html(or any template) : 
```html
<sz-configuration-about></sz-configuration-about>
```
The result should be a list of service configuration parameters and values.


5) Load the engine with data to resolve. 
   The sdk ships with some example data that can be loaded in to the engine. An example of how to do that  is below:

   5.1) TODO

6) Verify that the components are working properly. The easiest way to do this is to is to just implement a search box, and a result list. Copy the following to your app.component.html file
```html
<sz-search (resultsChange)="onSearchResults($event)"></sz-search>
<sz-search-results 
[results]="currentSearchResults" 
(resultClick)="onSearchResultClick($event)"></sz-search-results>
```
now in your controller class(app.component.ts) add the *onSearchResults* and *onSearchResultClick* methods we just referenced above:
```typescript
import { Component } from '@angular/core';
import { SzSearchResults, SzSearchResultEntityData, SzEntitySearchParams } from '@senzing/sdk-components-ng';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'senzing-sdk-consumer';
  public currentSearchResults: SzSearchResults;
  public currentlySelectedEntityId = 4068;
  public currentSearchParameters: SzEntitySearchParams;

  onSearchResults(evt: SzSearchResults) {
    console.log('@senzing/sz-search-results: ', evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property
  }

  public onSearchResultClick(entityData: SzSearchResultEntityData) {
    console.log('@senzing/sz-search-results-click: ', entityData);

    if (entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
    }
  }
}
```


<br/> <br/> <br/> 

## Configuration & Parameters

### Configuration
The SenzingSDKModule accepts a factory method or a object literal that conforms to the 
properties found in the [Configuration](https://senzing.github.io/rest-api-client-ng/classes/Configuration.html) class. By adding a factory like the following to the constructor method, you can change services configuration to point to non-default values.

The following tells any components to make api requests to http://localhost:22080/api/
```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SenzingSdkModule } from '@senzing/sdk-components-ng';
import { SenzingSdkModule } from '@senzing/rest-api-client-ng';
import { Configuration as SzApiConfiguration } from '@senzing/rest-api-client-ng';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot(() => {
      return new SzApiConfiguration({
        basePath: "http://localhost:22080/api/",
        withCredentials: false
      })
    })
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


## Trouble Shooting
