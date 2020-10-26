# What are Web Components

Web components are a set of web platform APIs that allow you to create new custom, reusable, encapsulated HTML tags to use in web pages and web apps. Custom components and widgets build on the Web Component standards, will work across modern browsers, and can be used with any JavaScript library or framework that works with HTML.

For more information on the subject see the following sites:
* [WebComponents.org](https://www.webcomponents.org/introduction)
* [Web Components | MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
* [Building Components | Web Fundamentals | Google Developers](https://developers.google.com/web/fundamentals/web-components/)


# Installation
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
  email="GuysEmail@MAIL.COM"></sz-wc-search>
```

# Web Components Vs. Angular

All Web Component tag names are prefixed with `sz-wc`. This is to prevent tag namespace collision/pollution. When browsing any of the online documentation examples, and you see a tag start with `sz-`, just remember if you are using the `@senzing/sdk-components-web` package your tag name should start with `sz-wc` instead.