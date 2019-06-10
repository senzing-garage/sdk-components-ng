// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'core-js/es7/reflect';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
//const context = require.context('./', true, /\.spec\.ts$/);

// config
const context = require.context('./lib/configuration', true, /\.spec\.ts$/);
// search
const context2 = require.context('./lib/search', true, /\.spec\.ts$/);
// entity
const context3 = require.context('./lib/entity', true, /\.spec\.ts$/);

// powered by
const context5 = require.context('./lib/sz-powered-by', true, /\.spec\.ts$/);

// And load the modules.
context.keys().map(context);
context2.keys().map(context2);
//context3.keys().map(context3);
context5.keys().map(context5);
