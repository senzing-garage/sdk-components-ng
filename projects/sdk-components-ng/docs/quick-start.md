


# Installation

<img src="../images/test.png" alt="Test Thumbnail" width="150" height="100" /><br/>
![Test Image](../images/test.png)

## Install Angular and Angular-Cli 7.x.x

## Create new Angular Project
```bash
ng new senzing-sdk-demo
cd senzing-sdk-demo
```
If you're already working with a Angular 7.x.x Project you can skip ahead to the next section.

## Install Senzing HTTP Services and SDK
TODO: figure out how to distribute and install the HTTP REST api servlet.


### Senzing REST HTTP
```bash
npm install @Senzing/service-http-rest
```

### Senzing SDK Componenents
```
npm install @Senzing/sdk-components-ng
```

# Configuration

## REST Service
The Rest service must be configured with a port number and hostname. you will use this same network address info for the next step as well.

### Start up the service
```bash
cd node_modules/@senzing/service-http-rest
java -jar g2-webapp-servlet
```
By default the http rest server will start on the local interface on port 22080. for the sake of this guide we will assume that you are running the rest server on this address. If you change the port number or are hosting the http server on a machine different from the machine you are following this walkthrough on please replace *http://localhost:22080* with the relevant hostname and port number.

### Load in some data
Lets load in some stub data for the purposes of demonstrating that our rest service is operating in the expected manner. Gotta have something to search through right? 

lets fire up another console window and load in some data.
```bash
cd node_modules/@senzing/service-http-rest
node loader.js --file=./demo-data/1.csv
```


## SDK Components
The SDK components have to know the network address information of where the HTTP services are running to communicate. There are a number of ways to do this:

  1) At run time, injected in to the sdkModule's constructor.
  2) At run time, by calling the sz-configuration component with the properties as attributes.
  3) Before run time, by modifying the SDK Service's api.configuration.json file.
  4) Before run time, by using a reverse proxy. 

### 1)
Open up your application's app.module.ts file and add the SDK imports(SenzingSdkModule, and SzRestConfiguration)
```typescript
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';
```

Now add the *SenzingSdkModule* to your applications imports. You can pass in the API configuration parameters inline(shown below) or via any factory method that constructs a _SzRestConfiguration_ object. Your application's NgModule declaration should look something like this below:

```typescript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot(() => {
      return new SzRestConfiguration({
        basePath: "/api/",        
        withCredentials: false
      })
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})

```

### 2)
the senzing sdk can be configured at run time to point to the location of where the rest service is running this can be done through the configuration tag:
```
<sz-configuration basePath="/api" portNum="22080">
```


### 4) Reverse Proxy (for development)
For the easiest set up possible you may want to use angular-cli's built in reverse proxy support. This is not recommended for production deployment. By using the reverse proxy, you can temporarily avoid any security issues that will be present in production implementations. To do this type the following in a terminal window from your angular project's root:
```
echo '{"api": {"target": "http://localhost:22080/workbench/", "secure": false }}' > proxy.conf.json
```

now add(or just update if already present) the following to your npm package.json start script:
`
  "start":"ng serve --proxy-config proxy.conf.json"
`
Now anytime you serve the angular application via `npm start` it will start up the angular development server with a built-in reverse proxy from http://localhost:4200/api/**/* -> http://localhost:22080/workbench/*



### Add SDK Module to application
open up your app's entry point module declaration, this is usually located in src/app/app.module.ts
and add the following to it's imports. If you've already done this in the previous step, or are using the web component(s) feel free to skip ahead to the html markup step.

```typescript
import { SenzingSdkModule } from '@senzing/sdk-components-ng';
```

now add the SenzingSdkModule to the components imports property:
```typescript
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
```

we should edit our app's template to pull in some SDK components. lets add the "powered by senzing" component just to make sure our angular app can pull in and render components from the sdk first.

Open up the app.component.html and replace the content with the following:
```html
<center>
  <sz-powered-by format="large"></sz-powered-by>
  <sz-configuration-about></sz-configuration-about>
</center>
```

now lets start up the angular dev server
```bash
ng serve
```

you should see a white background with the senzing logo in the top center of the page and a small table of service configuration and datasource properties(pictured below). If you do not then something is wrong. Re-read the steps above and double check that you didn't miss anything.




### Usage
please see api documentation for specific language implementation examples and usage. 

