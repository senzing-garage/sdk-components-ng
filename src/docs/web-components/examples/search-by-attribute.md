# Search By Attribute

This is an example of how to wire the attribute search form to a results list, and the results list to a entity detail viewer. You submit the search, it sends it to the api server, returns the results, then those results are fed in to the result list component. 

When the user clicks on a individual result in the list the `resultClick` event is emitted, in the handler for this event the code grabs the `entityId` property from the json and sets the `entity-id` attribute on the detail viewer tag.

![screen shot of Search By Attribute example](../../../images/ss-search-by-attributes.png)
<br/><br/><br/><br/>

## Source
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@senzing/sdk-components-web (Search by Attribute)</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script>
    // wire up senzing web components to event handlers
    window.onload = function() {
      var searchBoxEle    = document.querySelector('sz-wc-search');
      var searchResEle    = document.querySelector('sz-wc-search-results');
      var entityDetailEle = document.querySelector('sz-wc-entity-detail');

      document.getElementById('api-config').addEventListener('parametersChanged', function(event){
        console.log('a value in the config tag has emitted a change: ', event);
        searchBoxEle.updateAttributeTypes();
      });

      searchBoxEle.addEventListener('searchException', function(evt) {
        console.log('search error', evt);
        searchBoxEle.updateAttributeTypes();
      });

      searchBoxEle.addEventListener('resultsChange', function(evt) {
        if(evt.detail){
          // has payload
          var searchResults = evt.detail;
          console.log('results from search: ',searchResults);
          if(searchResults.length <= 0){
            searchResEle.setAttribute('class','hidden');
            entityDetailEle.setAttribute('class','hidden');
          } else {
            searchResEle.removeAttribute('class');
            entityDetailEle.setAttribute('class','hidden');
          }
          searchResEle.setAttribute('results', JSON.stringify(searchResults));
        }
      });
      searchResEle.addEventListener('resultClick', function(evt){
        if(evt.detail && evt.detail.entityId){
          //has payload
          showDetailView(evt.detail.entityId);
        }
      });
      function showDetailView(entityId) {
        entityDetailEle.setAttribute('entity-id', entityId);
        searchResEle.setAttribute('class','hidden');
        entityDetailEle.removeAttribute('class');
      }
      function onError(err){
        console.log('something weird happened: ', err);
      }
    };
  </script>
  <link rel="stylesheet" href="/node_modules/\@senzing/sdk-components-web/senzing-components-web.css">
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
  <sz-wc-configuration id="api-config"></sz-wc-configuration>
  <sz-wc-search></sz-wc-search>
  <sz-wc-search-results class="hidden"></sz-wc-search-results>
  <sz-wc-entity-detail
    entity-id="1002"
  ></sz-wc-entity-detail>
  <script src="/node_modules/\@senzing/sdk-components-web/senzing-components-web.js" defer></script>
</body>
</html>

```

<br/><br/><br/><br/>
