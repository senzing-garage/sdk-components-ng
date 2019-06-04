


# Installation

## Prerequisites
Before you begin, make sure your development environment includes Node.js® and an npm package manager.

### Node.js
Angular and this specific SDK package requires Node.js version 8.x or 10.x.

If you are looking for the Web Component version of this package it can be found [here](https://github.com/Senzing/sdk-components-web)

* To check your version, run `node -v` in a terminal/console window.
* To get Node.js, go to [nodejs.org](http://nodejs.org/download).

### npm package manager
Angular, the Angular CLI, and Angular apps depend on features and functionality provided by libraries that are available as [npm packages](https://docs.npmjs.com/about-npm/index.html). To download and install npm packages, you must have an npm package manager.

This Quick Start uses the [npm client](https://docs.npmjs.com/cli/install) command line interface, which is installed with Node.js by default.

To check that you have the npm client installed, run `npm -v` in a terminal/console window.

### Install JAVA/JDK x.x
TODO: find instructions for setting up jdk

### Install Maven x.x (Optional)
If you want to build the rest server from source you will need to install JDK version x.x.x
Follow Directions on http://maven.apache.org/install.html

### Install Angular and Angular-Cli 7.1.4
This Quick Start makes use of the angular cli tool to automatically set up an angular project and provide tooling. This can be done without the cli tool as well, but for purposes of simplifying the examples it is what we're going to use in this walkthrough.

To install the CLI using npm, open a terminal/console window and enter the following command:
```bash
npm install -g @angular/cli
```

## Install Senzing HTTP Services and SDK
#### Locate or Create G2.ini
The library will initialize with this configuration file. This configuration file initializes the g2 engine pointing to a specific project. 

##### Via Application
If you have already installed the [application](https://senzing.com/use-cases/general-purpose/) it will be located in either 
*%%LocalAppData%%\Senzing\Workbench\project_{PROJECT_ID}\ or 
TODO: find osx link

This application will also install any support libraries, and create the initial g2.ini for you.

##### For Enterprise
TODO: instructions from g2 api documentation.

### Senzing REST Api (pre-built)
```bash
npm install @senzing/senzing-api-server --save-dev
```
now start up the rest server with:
```bash
java -Djava.library.path="C:\\Program Files\\Senzing\\g2\\lib" -jar node_modules/@senzing/senzing-api-server/sz-api-server-1.0-SNAPSHOT.jar -iniFile "%%LocalAppData%%\Senzing\Workbench\project_{PROJECT_ID}\g2.ini"
```

### Senzing REST HTTP (from source)

#### Download and Register G2.jar
TODO: instructions for this.

```
mvn install:install-file -Dfile=./g2.jar -DgroupId=com.senzing -DartifactId=g2 -Dversion=1.0.0-SNAPSHOT -Dpackaging=jar
```

#### Build Server
```bash
git clone git@github.com:Senzing/senzing-api-server.git
mvn clean install
java -Djava.library.path="C:\\Program Files\\Senzing\\g2\\lib" -jar target/sz-api-server-1.0-SNAPSHOT.jar -iniFile "%%LocalAppData%%\Senzing\Workbench\project_{PROJECT_ID}\g2.ini"
```

## Create new Angular Project
```bash
ng new senzing-sdk-demo --style=scss
cd senzing-sdk-demo
```
If you're already working with a Angular 7.x.x Project you can skip ahead to the next section.

### Senzing SDK Componenents
```
npm install @senzing/sdk-components-ng
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

1. [At run time, injected in to the sdkModule's constructor](#config-1).
2. [At run time, by calling the sz-configuration component with the properties as attributes](#config-2).
3. Before run time, by modifying the SDK Service's api.configuration.json file.
4. [Before run time, by using a reverse proxy.](#config-4)

<a name="config-1"></a>
### 1) As Module constructor parameters
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
<a name="config-2"></a>
### 2) Using the configuration Tag
the senzing sdk can be configured at run time to point to the location of where the rest service is running this can be done through the configuration tag:
```
<sz-configuration basePath="/api" portNum="22080">
```

<a name="config-4"></a>
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

