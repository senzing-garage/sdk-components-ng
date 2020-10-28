# Point To API Server Address

This example illustrates how to configure the web components so that all of their api calls point to a specific non-default hostname and port.

The `<sz-wc-configuration></sz-wc-configuration>` tag is what is used to make runtime configuration changes to global properties of the SDK Components.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@senzing/sdk-components-web (Non-Default API Server Address)</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script>
    // wire up senzing web components to event handlers
    window.onload = function() {
      document.getElementById('api-config').addEventListener('parametersChanged', function(event){
        console.log('a value in the config tag has emitted a change: ', event);
      });

    };
  </script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: rgb(46, 46, 46);
    }
    .no-results, .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <sz-wc-configuration id="api-config" base-path="http://my-api-server-host-or-ip:8250"></sz-wc-configuration>
  <sz-wc-configuration-about></sz-wc-configuration-about>
  <script src="/node_modules/\@senzing/sdk-components-web/senzing-components-web.js" defer></script>
</body>
</html>

```