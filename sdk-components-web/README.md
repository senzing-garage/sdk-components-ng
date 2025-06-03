# @senzing/sdk-components-web

## Overview

This project is for the senzing sdk web components. It provides web component versions built
off of the components found in [@senzing/sdk-components-ng]. The components themselves leverage the [rest-api-client-ng package] which itself is generated from the [OAS specification].

The idea is to provide a framework agnostic option of those same components.

[![npm build]](https://github.com/senzing-garage/sdk-components-ng/actions/workflows/npm-build.yaml)
[![npm version]](https://badge.fury.io/js/%40senzing%2Fsdk-components-web)
![GitHub release (latest SemVer)]
![GitHub package.json version]

### Web Components

Web components are a set of web platform APIs that allow you to create new custom, reusable, encapsulated HTML tags to use in web pages and web apps. Custom components and widgets build on the Web Component standards, will work across modern browsers, and can be used with any JavaScript library or framework that works with HTML.

For more information on the subject see the following sites:

- [WebComponents.org]
- [Web Components | MDN]
- [Building Components | Web Fundamentals | Google Developers]

## Installation

```terminal
npm install @senzing/sdk-components-web --save
```

Add the script tag to your html document like so:

```html
  <body> ...
    <script type="text/javascript" src="node_modules/@senzing/sdk-components-web/senzing-components-web.js"></script>
    <link rel="stylesheet" href="node_modules/@senzing/sdk-components-web/senzing-components-web.css">
  </body>
</html>
```

And include the component tag in your document like so:

```html
<sz-wc-search name="Guy To LookFor"
  email="GuysEmail@MAIL.COM"></sz-search>
```

## Scripting Components

All the components support all the same inputs and output as the [@senzing/sdk-components-ng] package. [See documentation]

The only major difference between the two packages is the dependency requirements and the way that eventing is handled outside of the components. The web components are accessible just like any other DOM elements.

To listen for the result of a the search box completed search for example you would add an
event listener to the dom node ie:

```javascript
document.querySelector("sz-search").addEventListener("resultsChange", function (evt) {
  if (evt.detail) {
    var searchResults = evt.detail;
    // check if results > 0
    if (searchResults > 0) {
      console.log("SzAttributeSearchResult[]: ", searchResults);
    }
  }
});
```

To see a more complex example(a search box, with a results list, and a detail view) see the example.html file shipped with the npm package.

## Styling

There are some simple themes provided in the themes directory in the package itself. They can be included in the html document like so:

```html
<head>
  ...
  <link rel="stylesheet" href="node_modules/@senzing/sdk-components-web/themes/drab.css" />
</head>
```

### Customizing

There are some limitations when using web components. Because of the way that browsers treat the dom inside of the component tags themselves, the content inside a tag is not directly accessible. It means styling a sub element like so:

```css
sz-search-results sz-search-result-card {
  color: blue;
}
```

will _*NOT*_ work.

The elements themselves were created with this limitation in mind and try to provide as many sensible [CSS Variables] as makes sense. For more information on CSS Variables See [this article] or [here].

an example achieving the same effect as above that _WILL WORK_ would be:

```css
body {
  --sz-search-results-color: blue;
}
```

Another option is to bake the styles in to the components themselves. This is the extreme option, but skips over the issue entirely. The requirements for doing so are the same as building the sdk-components-ng package from source. The repo is publicly available: [@senzing/sdk-components-ng], fork it and have yourself an afternoon.

## Dependencies

### REST API Server

These components require the senzing [Senzing REST API Sever] to function. Follow the instructions to check out and build the [Senzing REST API Sever] from source or download a pre-built.

### Example Notes

You'll want to copy the example.html file to some place you can serve up with a webserver. By default the components are configured to access the REST API Server through a CORS request. To the best of my knowledge the components won't be able to send the appropriate Origin header when serving directly off of the file system. This is probably a good thing.

Besides, it's a super easy problem to solve.

```bash
npm install http-server
./node_modules/.bin/http-server node_modules/@senzing/sdk-components-web/example.html --cors
```

### Running examples from the SDK Components codebase

All examples can be rendered in a _Live_ edit state by checking out the main sdk components codebase, doing an npm install, then running one of the following commands from the repository root.

- `ng serve @senzing/sdk-components-web -c apiServerConfig`
- `ng serve @senzing/sdk-components-web -c searchByAttribute`
- `ng serve @senzing/sdk-components-web -c searchById`
- `ng serve @senzing/sdk-components-web -c searchWithDetail`
- `ng serve @senzing/sdk-components-web -c largeGraph`
- `ng serve @senzing/sdk-components-web -c smallGraph`
<!-- - `ng serve @senzing/sdk-components-web -c findPathGraph` -->

[@senzing/sdk-components-ng]: https://github.com/senzing-garage/sdk-components-ng
[Building Components | Web Fundamentals | Google Developers]: https://developers.google.com/web/fundamentals/web-components/
[CSS Variables]: https://senzing.github.io/sdk-components-ng/additional-documentation/themes/customizing.html
[GitHub package.json version]: https://img.shields.io/github/package-json/v/senzing/sdk-components-ng?color=orange&logo=latest&logoColor=blue
[GitHub release (latest SemVer)]: https://img.shields.io/github/v/release/senzing/sdk-components-ng?color=%2300c4ff&logo=latest%20tag
[here]: https://css-tricks.com/difference-between-types-of-css-variables/
[npm build]: https://github.com/senzing-garage/sdk-components-ng/actions/workflows/npm-build.yaml/badge.svg
[npm version]: https://badge.fury.io/js/%40senzing%2Fsdk-components-web.svg
[OAS specification]: https://github.com/senzing-garage/senzing-rest-api-specification
[rest-api-client-ng package]: https://www.npmjs.com/package/@senzing/rest-api-client-ng
[See documentation]: https://senzing.github.io/sdk-components-ng/
[Senzing REST API Sever]: https://github.com/senzing-garage/senzing-api-server/
[this article]: https://developers.google.com/web/updates/2016/02/css-variables-why-should-you-care
[Web Components | MDN]: https://developer.mozilla.org/en-US/docs/Web/Web_Components
[WebComponents.org]: https://www.webcomponents.org/introduction
