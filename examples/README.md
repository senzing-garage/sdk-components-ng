# Examples
the examples in this directory are not intended to be run standalone examples. Since this is a angular module it would be timeconsuming and distracting to have each example using a completely separate angular workspace since there would be alot of extra files that angular needs to run in the first place. 

They are fully functional mini-projects following the directory layout of [Angular projects](https://angular.io/guide/glossary#project). If you are unfamiliar with this style of layout the documentation can be found [here](https://angular.io/guide/file-structure).

The benefit of doing it this way is that you can just check out this repo(same as you would for building the components from source), and do a:
```terminal
npm install
npm run build
npm run example:name-of-example
```

which will start up an instance of the angular cli development server that will serve the appropriate example. So if I wanted to serve up the <i>search-with-results-and-details</i> example I would type `ng run example/search-with-results-and-details`

<small>note: notice that it's <b><u>"example"</u></b> and not <b>"examples"</b> with regards to the commands. this is intentional to avoid strange shell behavior thinking we are referring to the <i>physical</i> directory and not the project definition name.</small>

## Dependencies
All examples have the same dev dependencies as the main repository. namely [Angular CLI](https://cli.angular.io/), [TypeScript](https://www.typescriptlang.org/), and [Node/NPM](https://nodejs.org/). Please see the installation instructions for each of these for how to install each one.

## Source
The relevant source for for each example is located in the examples/{name of example}/src/app directory.


##  Current List

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
  </tbody>
</table>
