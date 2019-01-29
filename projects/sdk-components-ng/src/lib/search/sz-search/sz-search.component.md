
The search box component and the search results component are split up. this is done for some practical reasons. most noteably, so results can be placed wherever it makes sense to put them. This does complicate set up a tiny bit, but the tradeoff in flexibility is well worth it.

So, lets get down to business.
lets bind the output of the search component to the input of the search results component.

first add a method to your component(or app.component.ts) that will handle the output:
```typescript
onSearchResults(evt: SzSearchResults) {
    console.log('@senzing/sdk-components-ng/sz-search/searchResults: ', evt);
    // store on current scope
    this.currentSearchResults = evt;
    // results module is bound to this property
  }
```

now lets bind the sz-search tag to the method we just created. Add the following to your app.component.html file:

```html
<!-- start search box -->
<sz-search (resultsChange)="onSearchResults($event)"></sz-search>
<!-- end search box -->
```

the attribute in parens just tells angular that it's an event and not just an attribute.
