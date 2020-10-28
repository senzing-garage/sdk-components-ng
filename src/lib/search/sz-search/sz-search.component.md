
The search box component and the search results component are split up. this is done for some practical reasons. most noteably, so results can be placed wherever it makes sense to put them. This does complicate set up a tiny bit, but the tradeoff in flexibility is well worth it.

So, lets get down to business.
lets bind the output of the search component to the input of the search results component.

## Angular

first two methods to your component(or app.component.ts) that will handle the output of our search component:
```typescript
  public onSearchResults(evt: SzSearchResults) {
    console.log('@senzing/sdk-components-ng/sz-search/searchResults: ', evt);
    // store on current scope
    this.currentSearchResults = evt;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    // store search parameter on current scope
    this.currentSearchParameters = searchParams;
  }
```
and the property `currentSearchResults` and import the `SzAttributeSearchResult` model:
```typescript
public currentSearchResults: SzAttributeSearchResult[];
```

your app.component.ts up to this point should look something like this:
```typescript
import {
  SzAttributeSearchResult,
  SzEntitySearchParams,
  SzSearchComponent
} from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  public currentSearchResults: SzAttributeSearchResult[];
  public currentSearchParameters: SzEntitySearchParams;

  constructor(){}

  public onSearchResults(evt: SzAttributeSearchResult[]){
    // store on current scope
    this.currentSearchResults = evt;
  }

  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    // store search parameter on current scope
    this.currentSearchParameters = searchParams;
  }
}
```

now lets add the attrribute search component(sz-search) to the method we just created. Add the following to your app.component.html file:

```html
<!-- start search box -->
<sz-search 
  (resultsChange)="onSearchResults($event)"
  (parameterChange)="onSearchParameterChange($event)"></sz-search>
<!-- end search box -->
```

the attribute in parens just tells angular that it's an event and not just an attribute.

Now we should be getting the results of the search, and assigning it to the class property `currentSearchResults`. The next step is to do something with that data, so add the following to your app.component.html file:

```html
<!-- start search results -->
<sz-search-results [results]="currentSearchResults" [parameters]="currentSearchParameters"></sz-search-results>
<!-- end search results -->
```



## Web Components
