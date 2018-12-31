# @senzing/sdk-components-ng
wheeeeee

## SDK Modules, Classes, and Library Elements

### Build SDK Modules First
You must run the build to generate the sdk module output since it is used in the workbench project(the default) before running the usual `ng serve` command.
Run `ng build @senzing/sdk` to build the sdk modules.

### Adding new SDK components
To use the angular-cli to create a new component in the sdk, use the following syntax.
`ng g component SzNewSDKWidgetName --project=@senzing/sdk`

## Workbench Application

### Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Adding new Workbench components using schematics
Run `ng g component sz-workbench-component-name --project=workbench` to generate a new workbench component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/workbench` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
