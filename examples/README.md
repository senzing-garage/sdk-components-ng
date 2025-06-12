# Examples

the examples in this directory are not intended to be run standalone examples. Since this is a angular module it would be time consuming and distracting to have each example using a completely separate angular workspace since there would be a lot of extra files that angular needs to run in the first place.

They are fully functional mini-projects following the directory layout of [Angular projects]. If you are unfamiliar with this style of layout the documentation can be found [here].

The benefit of doing it this way is that you can just check out this repo(same as you would for building the components from source), and do a:

```terminal
npm install
npm run build
npm run example:name-of-example
```

which will start up an instance of the angular cli development server that will serve the appropriate example. So if I wanted to serve up the <i>search-with-results-and-details</i> example I would type `npm run example:search-with-results-and-details`

<small>note: notice that it's <b><u>"example"</u></b> and not <b>"examples"</b> with regards to the commands. this is intentional to avoid strange shell behavior thinking we are referring to the <i>physical</i> directory and not the project definition name.</small>

## Dependencies

All examples have the same dev dependencies as the main repository. namely [Angular CLI], [TypeScript], and [Node/NPM]. Please see the installation instructions for each of these for how to install each one.

## Source

The relevant source for for each example is located in the examples/{name of example}/src/app directory.

## Current List

<table>
  <thead>
    <tr>
      <td>Name</td><td>Command</td><td>Summary</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>search-with-results-and-details</td>
      <td>`npm run example:search-with-results-and-details`</td>
      <td>An example Angular app showing usage of the sz-search, sz-search-results,
  and sz-entity-detail components working together.</td>
    </tr>
    <tr>
      <td>search-with-spinner</td>
      <td>`npm run example:search-with-spinner`</td>
      <td>An example Angular app showing a usage of the searchStart, searchStart, and exception events from sz-search. The example creates a spinner that shows up while data requests are being made(with a min and max display time).</td>
    </tr>
    <tr>
      <td>graph</td>
      <td>`npm run example:graph`</td>
      <td>An example Angular app showing a usage of the graph components.</td>
    </tr>
    <tr>
      <td>search-by-id</td>
      <td>`npm run example:search-by-id`</td>
      <td>
        An example illustrating usage of SzSearchByIdComponent which allows searching by a datasource+recordId or an entityId
      </td>
    </tr>
        <tr>
      <td>search-in-graph</td>
      <td>`npm run example:search-in-graph`</td>
      <td>An example illustrating how to power the SzStandaloneGraphComponent component from a sz-search tag result.
      </td>
    </tr>
    <tr>
      <td>search-with-prefs</td>
      <td>`npm run example:search-with-prefs`</td>
      <td>Same as the "search-with-results-and-details" example, but binding to the SzPrefsService class eventbus. Has an example component that listens for pref change events, saves any 
      changes to localStorage via 'ngx-webstorage-service' npm module, and initializes the preferences for the sdk components state from same localStorage value.
      </td>
    </tr>
  </tbody>
</table>

[Angular CLI]: https://cli.angular.io/
[Angular projects]: https://angular.io/guide/glossary#project
[here]: https://angular.io/guide/file-structure
[Node/NPM]: https://nodejs.org/
[TypeScript]: https://www.typescriptlang.org/
