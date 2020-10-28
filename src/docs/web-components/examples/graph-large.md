# Large Graph with Filtering

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@senzing/sdk-components-web</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script>
    // wire up senzing web components to event handlers
    window.onload = function() {
      var searchBoxEle    = document.querySelector('sz-wc-search');
      var graphEle        = document.querySelector('sz-wc-standalone-graph');
      var noResultsEle    = document.querySelector('#no-results');
      var filterControlToggle = document.querySelector('#toggleFiltersDrawerEle');

      document.getElementById('api-config').addEventListener('parametersChanged', function(event){
        console.log('a value in the config tag has emitted a change: ', event);
        searchBoxEle.updateAttributeTypes();
      });

      filterControlToggle.addEventListener('click', function(evt) {
        graphEle.showFiltersControl = !graphEle.showFiltersControl;
      })

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
            noResultsEle.removeAttribute('class');
            graphEle.setAttribute('class','hidden');
          } else {
            noResultsEle.setAttribute('class','hidden');
            graphEle.removeAttribute('class');
          }
          graphEle.graphIds = graphIds;
        }
      });
      function onError(err){
        console.log('something weird happened: ', err);
      }     
    };
  </script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: rgb(46, 46, 46);
      --sz-graph-filter-control-background-color: rgb(236, 236, 236) !important;
    }
    .no-results, .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <sz-wc-configuration id="api-config"></sz-wc-configuration>
  <sz-wc-search></sz-wc-search>
  <button id="toggleFiltersDrawerEle">Toggle Filters</button>
  <h2 id="no-results">No Results Found</h2>
  <sz-wc-standalone-graph
      filter-width="320"
      graph-ids="1,1001,1002"
      show-pop-out-icon="false"
      show-match-key-control="false"
      show-filters-control="true"
      filter-control-position="top-right"
      show-match-keys="true"
  ></sz-wc-standalone-graph>
</body>
</html>

```