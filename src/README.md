# @senzing/sdk-components-ng

If you are beginning your journey with [Senzing],
please start with [Senzing Quick Start guides].

You are in the [Senzing Garage] where projects are "tinkered" on.
Although this GitHub repository may help you understand an approach to using Senzing,
it's not considered to be "production ready" and is not considered to be part of the Senzing product.
Heck, it may not even be appropriate for your application of Senzing!

## Overview

This project is for the Senzing&reg; SDK components that can be used in other projects. There are two flavors that the components come in. The [@senzing/sdk-components-ng] package which is based around the Angular 13.x.x framework, and the [@senzing/sdk-components-web] package which is framework agnostic and based around the [Web Components] standard. The usage for both packages is noted in the [documentation examples].

For information on the Web Components version see the [sdk-components-web guide].

[![npm build]](https://github.com/senzing-garage/sdk-components-ng/actions/workflows/npm-build.yaml)
[![npm version]](https://badge.fury.io/js/%40senzing%2Fsdk-components-ng)
![GitHub release (latest SemVer)]
![GitHub package.json version]

## Dependencies

For building from Source:

- [Node/NPM]
- [Angular CLI]
- [TypeScript]

Please see the installation instructions for each of these for how to install and setup each one properly.

### Installation

#### Shortcuts

If you're developing on Windows or macOS, you can make use of the [Senzing app]
to help populate an entity repository to test with. It also gives you an easy way to load and browse data
outside of the [Senzing POC API Server]. See the instructions
for using the [Senzing App Integration Scripts]
to start the Senzing REST API Server using your existing projects in the Senzing app.

#### REST API Server

These components require an implementation of the [Senzing REST API]
to function. You can use the [Senzing REST API Server] as a default
implementation in Java. Follow [the instructions] to check out and
build the [Senzing POC API Server] from source or download a pre-built
version when available.

### SDK Components

Open a terminal window to the location of your project and type:
`ng add @angular/material`
`ng add @senzing/sdk-components-ng`

The components package, along with any missing dependencies will be added to your project.

Alternatively you can install the components and dependencies without the angular-cli via npm individually:
`npm i @angular/material @angular/cdk @senzing/sdk-components-ng --save`

Please take note that all the same [interfaces, and services] from the [@senzing/rest-api-client-ng package] will also be available for convenience.

#### Usage

Just add the import statement for the particular component, service, or model that you want to use.

```typescript
import { SzEntitySearchParams, SzAttributeSearchResult } from "@senzing/sdk-components-ng";
```

### Quick Start

**1)** Start up an instance of the [Senzing POC API Server]
if not currently running.

See the [Senzing POC API Server] README.md for instructions on how
to start the Senzing REST API Server on the command line or with Docker.

**2)** Add the SenzingSDKModule to your angular app's app.module.ts

```typescript
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { SenzingSdkModule } from "@senzing/sdk-components-ng";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SenzingSdkModule.forRoot()],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**3)** Check that components can be rendered correctly. Add the following to your app.component.html (or any template) and verify the result:

```html
<sz-powered-by format="small"></sz-powered-by>
```

The result should be a powered by logo like the following:

![powered by tag]

If not then double check that step 2 is correct, and that you remembered to include the
import statement as well.

**4)** Check that components can communicate with rest api gateway successfully. Add the following to your app.component.html(or any template):

```html
<sz-configuration-about></sz-configuration-about>
```

The result should be a list of service configuration parameters and values.

**5)** Load the engine with data to resolve. The easiest way to do this currently is to load a CSV using the
[Senzing app]. This can also be done through the
[Senzing REST API] using the [Senzing POC API Server].

**6)** Verify that the components are working properly. The easiest way to do this is to is to just implement a search box, and a result list. Copy the following to your app.component.html file

```html
<sz-search (resultsChange)="onSearchResults($event)"></sz-search> <sz-search-results [results]="currentSearchResults" (resultClick)="onSearchResultClick($event)"></sz-search-results>
```

now in your controller class (app.component.ts) add the _onSearchResults_ and _onSearchResultClick_ methods we just referenced above:

```typescript
import { Component } from "@angular/core";
import { SzEntitySearchParams, SzAttributeSearchResult } from "@senzing/sdk-components-ng";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "senzing-sdk-consumer";
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number;
  public currentSearchParameters: SzEntitySearchParams;

  onSearchResults(evt: SzAttributeSearchResult[]) {
    console.log("@senzing/sz-search-results: ", evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property
  }

  public onSearchResultClick(entityData: SzAttributeSearchResult) {
    console.log("@senzing/sz-search-results-click: ", entityData);

    if (entityData && entityData.entityId > 0) {
      this.currentlySelectedEntityId = entityData.entityId;
    }
  }
}
```

Now, start up your standard Angular dev server (or maybe just restart for fun) via `ng serve`
and you should be greeted by a page like with a search box. And search results list right below it.

![screen shot of working example]

And that's it! At least for the quickstart. There are a ton more options for running the rest server, interacting with the components and services.

## Configuration & Parameters

The SenzingSDKModule accepts a factory method that returns an instance of the
[SzRestConfiguration] class. By adding a factory like the following to the forRoot method, you can change services configuration to point to non-default values.

The following tells any components to turn on CORS functionality and make all api requests to localhost port 8080 (i.e.: http://localhost:8080/).

```typescript
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { SenzingSdkModule, SzRestConfiguration } from "@senzing/sdk-components-ng";
import { AppComponent } from "./app.component";

// create exportable factory
// for AOT compilation
export function SzRestConfigurationFactory() {
  return new SzRestConfiguration({
    basePath: "http://localhost:8080",
    withCredentials: true,
  });
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SenzingSdkModule.forRoot(SzRestConfigurationFactory)],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Parameters

See [SzRestConfiguration] online documentation for a complete list of configuration parameters that can control the connection behavior of the sdk components.

## Documentation

Installation contains a statically generated API and component references. They can be found in
node_modules/@senzing/sdk-components-ng/docs or [Online here].

## Examples

When you check out the source for this repository there is a directory of Angular project examples. Please see the [Examples Readme] for more information on how these work.

## Troubleshooting

Occasionally something does go wrong (I know, I know right?). Here are some common things we run in to:

<table style="border: 2px solid #eee; border-collapse: separate; border-spacing: 2px;">
  <thead style="background-color: #c0c0c0; color: #454545; font-weight: bold;">
    <tr>
      <td style="padding: 2px 5px;">Problem</td>
      <td style="padding: 2px 5px;">Solution</td>
      <td style="padding: 2px 5px;">Explanation</td>
    </tr>
  </thead>
  <tbody>
    <tr style="padding: 0 0 12px 0; border-bottom: 1px solid green;">
      <td style="padding: 10px 5px;">messages like <code>GET http://attribute-types/ net::ERR_NAME_NOT_RESOLVED</code> are
      showing up in the developer console</td>
      <td style="padding: 10px 5px;">
        Set the api configuration to the address and port your rest server is running at by
        passing in an instance of <a href="https://senzing-garage.github.io/rest-api-client-ng/classes/Configuration.html">SzRestConfiguration</a> to the <a href="https://senzing-garage.github.io/sdk-components-ng/modules/SenzingSdkModule.html">SenzingSdkModule.forRoot method</a>.
        <br/><br/>
        Double check and make sure you can connect to your rest server via
        <code>curl -i http://localhost:8080/heartbeat</code>
      </td>
      <td style="padding: 10px 5px;">
        The api is trying to hit the rest server without an appropriate basepath or the hostname.
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 5px;"><code>npm run start</code> throws weird "No App Module" error</td>
      <td style="padding: 10px 5px;">recompile the npm package. <br/>
      <code>npm run build</code></td>
      <td style="padding: 10px 5px;">For whatever reason sometimes the builder <i>misses</i> compiling packages. open up dist/@senzing/sdk-components/public_api.d.ts and check to make sure all the packages being referenced actually got compiled.</td>
    </tr>
  </tbody>
</table>

[@senzing/rest-api-client-ng package]: https://www.npmjs.com/package/@senzing/rest-api-client-ng
[@senzing/sdk-components-ng]: https://www.npmjs.com/package/@senzing/sdk-components-ng
[@senzing/sdk-components-web]: https://www.npmjs.com/package/@senzing/sdk-components-web
[Angular CLI]: https://cli.angular.io/
[documentation examples]: http://hub.senzing.com/sdk-components-ng/
[Examples Readme]: https://github.com/senzing-garage/sdk-components-ng/tree/master/examples
[GitHub package.json version]: https://img.shields.io/github/package-json/v/senzing/sdk-components-ng?color=orange&logo=latest&logoColor=blue
[GitHub release (latest SemVer)]: https://img.shields.io/github/v/release/senzing/sdk-components-ng?color=%2300c4ff&logo=latest%20tag
[interfaces, and services]: https://senzing-garage.github.io/rest-api-client-ng/
[Node/NPM]: https://nodejs.org/
[npm build]: https://github.com/senzing-garage/sdk-components-ng/actions/workflows/npm-build.yaml/badge.svg
[npm version]: https://badge.fury.io/js/%40senzing%2Fsdk-components-ng.svg
[Online here]: https://senzing-garage.github.io/sdk-components-ng/
[powered by tag]: docs/images/ss-powered-by-tag.png
[screen shot of working example]: docs/images/ss-search-with-results.small.png
[sdk-components-web guide]: https://github.com/senzing-garage/sdk-components-ng/tree/master/sdk-components-web
[Senzing App Integration Scripts]: https://github.com/senzing-garage/senzing-api-server/tree/master/app-scripts
[Senzing app]: https://senzing.com/#download
[Senzing Garage]: https://github.com/senzing-garage
[Senzing POC API Server]: https://github.com/senzing-garage/senzing-poc-server
[Senzing Quick Start guides]: https://docs.senzing.com/quickstart/
[Senzing REST API Server]: https://github.com/senzing-garage/senzing-api-server
[Senzing REST API]: https://github.com/senzing-garage/senzing-rest-api-specification
[Senzing]: https://senzing.com/
[SzRestConfiguration]: https://senzing-garage.github.io/rest-api-client-ng/classes/Configuration.html
[the instructions]: https://github.com/senzing-garage/senzing-api-server
[TypeScript]: https://www.typescriptlang.org/
[Web Components]: https://developers.google.com/web/fundamentals/web-components/
