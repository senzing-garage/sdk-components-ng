# Embeddable Graph

This is an example of how to wire the relationship graph base component to a attribute search form. You submit the search, it sends it to the api server, returns the results. Then those results are iterated over and fed in to the `entityIds` setter for the component.

![screen shot of SzRelationshipNetworkGraph](../../../images/ss-graph-small.png)
<br/><br/><br/><br/>

## Source
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@senzing/sdk-components-web (SzRelationshipNetworkGraph)</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script>
    // wire up senzing web components to event handlers
    window.onload = function() {
      var searchBoxEle    = document.querySelector('sz-wc-search');
      var graphEle        = document.querySelector('sz-wc-relationship-network-graph');

      graphEle.reloadOnIdChange = true;

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
          var graphIds      = searchResults.map( (searchRes) => {
            return searchRes.entityId;
          });
          console.log('results from search: ', graphIds, searchResults);
          if(searchResults.length <= 0){
            graphEle.setAttribute('class','hidden');
          } else {
            graphEle.removeAttribute('class');
          }
          graphEle.entityIds = graphIds.join(',');
          //graphEle.reload( graphIds );
        }
      });
      
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
  <sz-wc-relationship-network-graph
    entity-ids="1,1001,1002"
    svg-view-box="150 50 400 300"
    svg-preserve-aspect-ratio="xMinYMid meet"
    max-degrees="2"
    build-out="5"
    show-link-labels="true"
  ></sz-wc-relationship-network-graph>
  <script src="/node_modules/\@senzing/sdk-components-web/senzing-components-web.js" defer></script>
</body>
</html>

```

<br/><br/><br/><br/>