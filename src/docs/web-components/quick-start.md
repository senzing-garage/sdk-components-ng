# Quick Start Guide

Getting set up to work with the Senzing SDK Components can be done in as little as 10 minutes if you already have an Senzing REST API Server installation running. 

When working with web components you are really just working with HTML tags, so you should set up your project just as you would any web application. We could add things like api request proxy authentication, ssl, react app, electron shell etc. 

This guide is meant purely to get you from zero to working example as quickly as possible.

# Preparation

You should set up a working directory, and initialize it.

```terminal
mkdir wc-example-spa && cd wc-example-spa
git init
npm init -y
```

If you get an error on `git --version` you don't have git installed. If you get an error on `npm -v` you do not have node installed. While you can run the components without either of these tools it's beyond the purposes of illustrating how to get things up and running quickly  ;)

- [Download NodeJS](https://nodejs.org/)
- [Download Git](https://git-scm.com/download)

# Installation
```terminal
npm install @senzing/sdk-components-web --save
```

# Create an HTML document

So you can either create a html document from scratch or just grab one from the `node_modules/@senzing/sdk-components-web/examples` directory. For the sake of brevity I'm going to illustrate the latter option. Open up a terminal to your working project directory and type:

```terminal
cp -r node_modules/\@senzing/sdk-components-web/examples/* ./
```

This should copy all of the example .html files from the package in to your working directory.

## Set the components to your API Server address

Open up the example file and update the `sz-wc-configuration` tag, or add the following to the top of the document `<body>` tag contents:
```html
<sz-wc-configuration id="api-config" base-path="http://localhost:8080"></sz-wc-configuration>
```
This will tell the components to redirect all api server calls to `localhost:8080`. The next step will set up a redirect to forward any unresolved requests to your api server hostname.

#### Serve your HTML

Go to your terminal and execute the following command. Replace the `http://americium.local:8250` part with the address to your API Rest Server address.

```terminal
npx http-server --proxy http://americium.local:8250
```

By default http-server will run on [localhost:8080](http://localhost:8080), and any resources that it can't find will be redirected to the address specified in the `--proxy` parameter.

Now open up [localhost:8080](http://localhost:8080) and browse to the file/example being worked on.
