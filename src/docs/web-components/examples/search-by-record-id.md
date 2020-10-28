# Search By Record Id and Datasource, or EntityId

This is an example of how to wire the datasource/record/entityid search form to the record viewer component, or in the case of the entityId, a detail view component. 

![screen shot of Search By Record Id example](../../../images/ss-search-by-id.png)
<br/><br/><br/><br/>

## Source
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>@senzing/sdk-components-web (Search By Id)</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script>
    // wire up senzing web components to event handlers
    window.onload = function() {
      var searchBoxEle    = document.querySelector('sz-wc-search-by-id');
      var entityDetailEle = document.querySelector('sz-wc-entity-detail');
      var recordDetailEle = document.querySelector('sz-wc-entity-record-viewer');
      var noResultsEle    = document.querySelector('#no-results');

      document.getElementById('api-config').addEventListener('parametersChanged', function(event){
        console.log('a value in the config tag has emitted a change: ', event);
        searchBoxEle.updateDataSources();
      });

      searchBoxEle.addEventListener('entityChange', function(evt) {
        console.log('ENTITY RESULT CHANGE!', evt.detail);
        if(evt.detail){
          if(evt.detail.resolvedEntity) {
            showDetailView(evt.detail.resolvedEntity.entityId);
          } else {
            hideDetailView();
          }
        }
      });
      searchBoxEle.addEventListener('resultChange', function(evt) {
        console.log('RESULT CHANGE!', evt.detail);
        if(evt.detail){
          // has payload
          showRecordDetailView(evt.detail);
        }
      });
      
      function showDetailView(entityId) {
        noResultsEle.setAttribute('class','hidden');
        entityDetailEle.setAttribute('entity-id', entityId);
        recordDetailEle.setAttribute('class','hidden');
        entityDetailEle.removeAttribute('class');
      }
      function hideDetailView() {
        entityDetailEle.setAttribute('entity-id', undefined);
        entityDetailEle.setAttribute('class','hidden');
      }
      function showRecordDetailView(record) {
        noResultsEle.setAttribute('class','hidden');
        recordDetailEle.record = record;
        entityDetailEle.setAttribute('class','hidden');
        recordDetailEle.removeAttribute('class');
      }
      function hideRecordDetailView(){
        recordDetailEle.setAttribute('record', undefined);
        recordDetailEle.setAttribute('class','hidden');
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
  <sz-wc-search-by-id></sz-wc-search-by-id>
  <h2 id="no-results" class="hidden">No Results Found</h2>
  <sz-wc-entity-detail class="hidden"></sz-wc-entity-detail>
  <sz-wc-entity-record-viewer></sz-wc-entity-record-viewer>
  <script src="/node_modules/\@senzing/sdk-components-web/senzing-components-web.js" defer></script>
</body>
</html>
```
<br/><br/><br/><br/>
