# What are Web Components ?

Web components are a set of web platform APIs that allow you to create new custom, reusable, encapsulated HTML tags to use in web pages and web apps. Custom components and widgets built on the Web Component standards, will work across modern browsers, and can be used with any JavaScript library or framework that work with HTML.

For more information on the subject see the following sites:

- [WebComponents.org]
- [Web Components | MDN]
- [Building Components | Web Fundamentals | Google Developers]

# Web Components Vs. Angular

- Tag Attributes are kabob-case
- Tag names are prefixed with `sz-wc`
- DOM events are camel-case
- DOM properties are camel-case

All Web Component tag names are prefixed with `sz-wc`. This is to prevent tag namespace collision/pollution. When browsing any of the online documentation examples, and you see a tag start with `sz-`, just remember if you are using the `@senzing/sdk-components-web` package your tag name should start with `sz-wc` instead.

The other main difference between the two implementations is that if using angular the attributes are [Camel Case], and if using web components the attributes are kabob case. See [https://en.wikipedia.org/wiki/Letter_case#Special_case_styles]

When accessing a method or setter through the DOM on a web component programmatically however, you access the setter/method in camel case ie:

```html
<sz-wc-standalone-graph filter-width="320" graph-ids="1,1001,1002" show-pop-out-icon="false" show-match-key-control="false" show-filters-control="false" filter-control-position="top-right" show-match-keys="true"></sz-wc-standalone-graph>

<script>
  // hide graph filter control programmatically
  document.querySelector("sz-wc-standalone-graph").showFiltersControl = false;
</script>
```

# Getting Started

Getting set up to work with the Senzing SDK Components can be done in as little as 10 minutes if you already have an Senzing REST API Server installation running.

See the [Quick Start Guide] for instructions.

# Compatibility

Any web page or application that can render web component tags can be enabled by adding the `@senzing/sdk-components-web` package to it's dependencies. The basic requirement is that the application hosting the tags can parse javascript and supports rendering custom component tags. All modern web browsers, some mobile browsers, and any native applications that support embedded web views should be able to render these components.

Add the css file to your document:

```html
<link rel="stylesheet" href="/node_modules/\@senzing/sdk-components-web/senzing-components-web.css" />
```

Add the javascript to your document:

```html
<script src="/node_modules/\@senzing/sdk-components-web/senzing-components-web.js" defer></script>
```

<div style="border-radius: 5px; border: 1px solid #000; padding: 8px; margin-top: 10px">
  <div><b>Note*</b></div>
  You may have to change the paths pointing to each of these files depending on how your application is laid out. These files can be moved to wherever your other assets are stored, the examples above are just directly referencing the files from the node modules location.
</div>

<br/><br/><br/><br/>

[WebComponents.org]: https://www.webcomponents.org/introduction
[Web Components | MDN]: https://developer.mozilla.org/en-US/docs/Web/Web_Components
[Building Components | Web Fundamentals | Google Developers]: https://developers.google.com/web/fundamentals/web-components/
[Camel Case]: https://en.wikipedia.org/wiki/Camel_case
[https://en.wikipedia.org/wiki/Letter_case#Special_case_styles]: https://en.wikipedia.org/wiki/Letter_case#Special_case_styles
[Quick Start Guide]: web-components/quick-start.html
