# What are Web Components ?

Web components are a set of web platform APIs that allow you to create new custom, reusable, encapsulated HTML tags to use in web pages and web apps. Custom components and widgets built on the Web Component standards, will work across modern browsers, and can be used with any JavaScript library or framework that work with HTML.

For more information on the subject see the following sites:
* [WebComponents.org](https://www.webcomponents.org/introduction)
* [Web Components | MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
* [Building Components | Web Fundamentals | Google Developers](https://developers.google.com/web/fundamentals/web-components/)

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

This should copy all of the example .html file from the package in to your working directory.

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

# Web Components Vs. Angular

All Web Component tag names are prefixed with `sz-wc`. This is to prevent tag namespace collision/pollution. When browsing any of the online documentation examples, and you see a tag start with `sz-`, just remember if you are using the `@senzing/sdk-components-web` package your tag name should start with `sz-wc` instead.

