'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

customElements.define('compodoc-menu', /*#__PURE__*/function (_HTMLElement) {
  _inherits(_class, _HTMLElement);

  var _super = _createSuper(_class);

  function _class() {
    var _this;

    _classCallCheck(this, _class);

    _this = _super.call(this);
    _this.isNormalMode = _this.getAttribute('mode') === 'normal';
    return _this;
  }

  _createClass(_class, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      this.render(this.isNormalMode);
    }
  }, {
    key: "render",
    value: function render(isNormalMode) {
      var tp = lithtml.html("\n        <nav>\n            <ul class=\"list\">\n                <li class=\"title\">\n                    <a href=\"index.html\" data-type=\"index-link\">Senzing SDK Components</a>\n                </li>\n\n                <li class=\"divider\"></li>\n                ".concat(isNormalMode ? "<div id=\"book-search-input\" role=\"search\"><input type=\"text\" placeholder=\"Type to search\"></div>" : '', "\n                <li class=\"chapter\">\n                    <a data-type=\"chapter-link\" href=\"index.html\"><span class=\"icon ion-ios-home\"></span>Getting started</a>\n                    <ul class=\"links\">\n                        <li class=\"link\">\n                            <a href=\"overview.html\" data-type=\"chapter-link\">\n                                <span class=\"icon ion-ios-keypad\"></span>Overview\n                            </a>\n                        </li>\n                        <li class=\"link\">\n                            <a href=\"index.html\" data-type=\"chapter-link\">\n                                <span class=\"icon ion-ios-paper\"></span>README\n                            </a>\n                        </li>\n                        <li class=\"link\">\n                            <a href=\"changelog.html\"  data-type=\"chapter-link\">\n                                <span class=\"icon ion-ios-paper\"></span>CHANGELOG\n                            </a>\n                        </li>\n                        <li class=\"link\">\n                            <a href=\"contributing.html\"  data-type=\"chapter-link\">\n                                <span class=\"icon ion-ios-paper\"></span>CONTRIBUTING\n                            </a>\n                        </li>\n                        <li class=\"link\">\n                            <a href=\"license.html\"  data-type=\"chapter-link\">\n                                <span class=\"icon ion-ios-paper\"></span>LICENSE\n                            </a>\n                        </li>\n                                <li class=\"link\">\n                                    <a href=\"dependencies.html\" data-type=\"chapter-link\">\n                                        <span class=\"icon ion-ios-list\"></span>Dependencies\n                                    </a>\n                                </li>\n                    </ul>\n                </li>\n                    <li class=\"chapter additional\">\n                        <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#additional-pages"' : 'data-target="#xs-additional-pages"', ">\n                            <span class=\"icon ion-ios-book\"></span>\n                            <span>Guides</span>\n                            <span class=\"icon ion-ios-arrow-down\"></span>\n                        </div>\n                        <ul class=\"links collapse \" ").concat(isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"', ">\n                                    <li class=\"chapter inner\">\n                                        <a data-type=\"chapter-link\" href=\"additional-documentation/web-components.html\" data-context-id=\"additional\">\n                                            <div class=\"menu-toggler linked\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' : 'data-target="#xs-additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"', ">\n                                                <span class=\"link-name\">Web Components</span>\n                                                <span class=\"icon ion-ios-arrow-down\"></span>\n                                            </div>\n                                        </a>\n                                        <ul class=\"links collapse\" ").concat(isNormalMode ? 'id="additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"' : 'id="xs-additional-page-768cd47719cd7b77f76b0103a56efea9ba083120f5789a266e65d76038964159db972d34552a09e348eb5bb4d9166bb02c14f16e7b9674217b7c68d13b5c2c40"', ">\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/web-components/quick-start.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Quick Start</a>\n                                            </li>\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/web-components/examples.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Examples</a>\n                                            </li>\n                                            <li class=\"link for-chapter3\">\n                                                <a href=\"additional-documentation/web-components/examples/configure-rest-server-connection-properties.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Configure Rest Server Connection Properties</a>\n                                            </li>\n                                            <li class=\"link for-chapter3\">\n                                                <a href=\"additional-documentation/web-components/examples/attribute-search-with-results.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Attribute Search with Results</a>\n                                            </li>\n                                            <li class=\"link for-chapter3\">\n                                                <a href=\"additional-documentation/web-components/examples/id-search-with-record-viewer.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Id Search with Record Viewer</a>\n                                            </li>\n                                            <li class=\"link for-chapter3\">\n                                                <a href=\"additional-documentation/web-components/examples/large-graph-with-filtering.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Large Graph with Filtering</a>\n                                            </li>\n                                            <li class=\"link for-chapter3\">\n                                                <a href=\"additional-documentation/web-components/examples/small-graph-(for-embedding).html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Small Graph (for embedding)</a>\n                                            </li>\n                                        </ul>\n                                    </li>\n                                    <li class=\"chapter inner\">\n                                        <a data-type=\"chapter-link\" href=\"additional-documentation/graph-components.html\" data-context-id=\"additional\">\n                                            <div class=\"menu-toggler linked\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' : 'data-target="#xs-additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"', ">\n                                                <span class=\"link-name\">Graph Components</span>\n                                                <span class=\"icon ion-ios-arrow-down\"></span>\n                                            </div>\n                                        </a>\n                                        <ul class=\"links collapse\" ").concat(isNormalMode ? 'id="additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"' : 'id="xs-additional-page-1016512b99746cf77d3cb983f6694bbb59a918da0300ec40dcaee7d23e92249a31692d0530c5475338d8cea43f0226697a9473f58625c4886d6460a5d5f7de1d"', ">\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/graph-components/szstandalonegraphcomponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">SzStandaloneGraphComponent</a>\n                                            </li>\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/graph-components/szrelationshipnetworkcomponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">SzRelationshipNetworkComponent</a>\n                                            </li>\n                                        </ul>\n                                    </li>\n                                    <li class=\"chapter inner\">\n                                        <a data-type=\"chapter-link\" href=\"additional-documentation/themes.html\" data-context-id=\"additional\">\n                                            <div class=\"menu-toggler linked\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' : 'data-target="#xs-additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"', ">\n                                                <span class=\"link-name\">Themes</span>\n                                                <span class=\"icon ion-ios-arrow-down\"></span>\n                                            </div>\n                                        </a>\n                                        <ul class=\"links collapse\" ").concat(isNormalMode ? 'id="additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"' : 'id="xs-additional-page-5bdf190992f365a97e5e6e1b19634869fd78af263a77665c23c38f5a0e19009c3beb8d89140e1e7c967871444aebf6bfebf6bdab6135fd7967c9429b8b611e6d"', ">\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/themes/pre-built.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Pre Built</a>\n                                            </li>\n                                            <li class=\"link for-chapter2\">\n                                                <a href=\"additional-documentation/themes/customizing.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"additional\">Customizing</a>\n                                            </li>\n                                        </ul>\n                                    </li>\n                        </ul>\n                    </li>\n                    <li class=\"chapter modules\">\n                        <a data-type=\"chapter-link\" href=\"modules.html\">\n                            <div class=\"menu-toggler linked\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#modules-links"' : 'data-target="#xs-modules-links"', ">\n                                <span class=\"icon ion-ios-archive\"></span>\n                                <span class=\"link-name\">Modules</span>\n                                <span class=\"icon ion-ios-arrow-down\"></span>\n                            </div>\n                        </a>\n                        <ul class=\"links collapse \" ").concat(isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"', ">\n                            <li class=\"link\">\n                                <a href=\"modules/SenzingSdkModule.html\" data-type=\"entity-link\" >SenzingSdkModule</a>\n                                    <li class=\"chapter inner\">\n                                        <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#components-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"' : 'data-target="#xs-components-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"', ">\n                                            <span class=\"icon ion-md-cog\"></span>\n                                            <span>Components</span>\n                                            <span class=\"icon ion-ios-arrow-down\"></span>\n                                        </div>\n                                        <ul class=\"links collapse\" ").concat(isNormalMode ? 'id="components-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"' : 'id="xs-components-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"', ">\n                                            <li class=\"link\">\n                                                <a href=\"components/SzConfigurationAboutComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzConfigurationAboutComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzConfigurationComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzConfigurationComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzEntityDetailComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzEntityDetailComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzEntityDetailGraphFilterComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzEntityDetailGraphFilterComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzEntityRecordViewerComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzEntityRecordViewerComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzGraphFilterComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzGraphFilterComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzPoweredByComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzPoweredByComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzPreferencesComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzPreferencesComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzSearchByIdComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchByIdComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzSearchComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzSearchIdentifiersPickerDialogComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchIdentifiersPickerDialogComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzSearchIdentifiersPickerSheetComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchIdentifiersPickerSheetComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzSearchResultsComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchResultsComponent</a>\n                                            </li>\n                                            <li class=\"link\">\n                                                <a href=\"components/SzStandaloneGraphComponent.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzStandaloneGraphComponent</a>\n                                            </li>\n                                        </ul>\n                                    </li>\n                                <li class=\"chapter inner\">\n                                    <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#injectables-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"' : 'data-target="#xs-injectables-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"', ">\n                                        <span class=\"icon ion-md-arrow-round-down\"></span>\n                                        <span>Injectables</span>\n                                        <span class=\"icon ion-ios-arrow-down\"></span>\n                                    </div>\n                                    <ul class=\"links collapse\" ").concat(isNormalMode ? 'id="injectables-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"' : 'id="xs-injectables-links-module-SenzingSdkModule-eb9be92d70b32b73093c790eeb8ce856b2a03083a89c2aa724dfb78e9c02d865658a9057138bb709a2fc2270ccb37eeba57eb3f7d7a5272caf22857d8fbd9f63"', ">\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzAdminService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzAdminService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzBulkDataService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzBulkDataService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzConfigurationService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzConfigurationService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzDataSourcesService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzDataSourcesService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzFoliosService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzFoliosService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzPdfUtilService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzPdfUtilService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzPrefsService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzPrefsService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzSearchService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzSearchService</a>\n                                        </li>\n                                        <li class=\"link\">\n                                            <a href=\"injectables/SzUIEventService.html\" data-type=\"entity-link\" data-context=\"sub-entity\" data-context-id=\"modules\" >SzUIEventService</a>\n                                        </li>\n                                    </ul>\n                                </li>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"modules/SzSdkMaterialModule.html\" data-type=\"entity-link\" >SzSdkMaterialModule</a>\n                            </li>\n                </ul>\n                </li>\n                    <li class=\"chapter\">\n                        <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#classes-links"' : 'data-target="#xs-classes-links"', ">\n                            <span class=\"icon ion-ios-paper\"></span>\n                            <span>Classes</span>\n                            <span class=\"icon ion-ios-arrow-down\"></span>\n                        </div>\n                        <ul class=\"links collapse \" ").concat(isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"', ">\n                            <li class=\"link\">\n                                <a href=\"classes/SzAdminPrefs.html\" data-type=\"entity-link\" >SzAdminPrefs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzBulkDataAnalysis.html\" data-type=\"entity-link\" >SzBulkDataAnalysis</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzDataSourceRecordAnalysis.html\" data-type=\"entity-link\" >SzDataSourceRecordAnalysis</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzEntityDetailPrefs.html\" data-type=\"entity-link\" >SzEntityDetailPrefs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzFolio.html\" data-type=\"entity-link\" >SzFolio</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzFolioItem.html\" data-type=\"entity-link\" >SzFolioItem</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzGraphPrefs.html\" data-type=\"entity-link\" >SzGraphPrefs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSdkPrefsBase.html\" data-type=\"entity-link\" >SzSdkPrefsBase</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchFormPrefs.html\" data-type=\"entity-link\" >SzSearchFormPrefs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchHistoryFolio.html\" data-type=\"entity-link\" >SzSearchHistoryFolio</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchHistoryFolioItem.html\" data-type=\"entity-link\" >SzSearchHistoryFolioItem</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchParamsFolio.html\" data-type=\"entity-link\" >SzSearchParamsFolio</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchParamsFolioItem.html\" data-type=\"entity-link\" >SzSearchParamsFolioItem</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzSearchResultsPrefs.html\" data-type=\"entity-link\" >SzSearchResultsPrefs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"classes/SzServerError.html\" data-type=\"entity-link\" >SzServerError</a>\n                            </li>\n                        </ul>\n                    </li>\n                    <li class=\"chapter\">\n                        <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#interfaces-links"' : 'data-target="#xs-interfaces-links"', ">\n                            <span class=\"icon ion-md-information-circle-outline\"></span>\n                            <span>Interfaces</span>\n                            <span class=\"icon ion-ios-arrow-down\"></span>\n                        </div>\n                        <ul class=\"links collapse \" ").concat(isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"', ">\n                            <li class=\"link\">\n                                <a href=\"interfaces/AdminStreamAnalysisConfig.html\" data-type=\"entity-link\" >AdminStreamAnalysisConfig</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/AdminStreamConnProperties.html\" data-type=\"entity-link\" >AdminStreamConnProperties</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/AdminStreamLoadConfig.html\" data-type=\"entity-link\" >AdminStreamLoadConfig</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzDataSourceComposite.html\" data-type=\"entity-link\" >SzDataSourceComposite</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzEntityDetailSectionData.html\" data-type=\"entity-link\" >SzEntityDetailSectionData</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzEntityDetailSectionSummary.html\" data-type=\"entity-link\" >SzEntityDetailSectionSummary</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzEntitySearchParams.html\" data-type=\"entity-link\" >SzEntitySearchParams</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzMatchFields.html\" data-type=\"entity-link\" >SzMatchFields</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzMatchKeyComposite.html\" data-type=\"entity-link\" >SzMatchKeyComposite</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzNetworkGraphInputs.html\" data-type=\"entity-link\" >SzNetworkGraphInputs</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzRawData.html\" data-type=\"entity-link\" >SzRawData</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzRawDataMatches.html\" data-type=\"entity-link\" >SzRawDataMatches</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzSdkPrefsModel.html\" data-type=\"entity-link\" >SzSdkPrefsModel</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzSearchEvent.html\" data-type=\"entity-link\" >SzSearchEvent</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzSearchResultEntityData.html\" data-type=\"entity-link\" >SzSearchResultEntityData</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"interfaces/SzSectionDataByDataSource.html\" data-type=\"entity-link\" >SzSectionDataByDataSource</a>\n                            </li>\n                        </ul>\n                    </li>\n                    <li class=\"chapter\">\n                        <div class=\"simple menu-toggler\" data-toggle=\"collapse\" ").concat(isNormalMode ? 'data-target="#miscellaneous-links"' : 'data-target="#xs-miscellaneous-links"', ">\n                            <span class=\"icon ion-ios-cube\"></span>\n                            <span>Miscellaneous</span>\n                            <span class=\"icon ion-ios-arrow-down\"></span>\n                        </div>\n                        <ul class=\"links collapse \" ").concat(isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"', ">\n                            <li class=\"link\">\n                                <a href=\"miscellaneous/enumerations.html\" data-type=\"entity-link\">Enums</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"miscellaneous/functions.html\" data-type=\"entity-link\">Functions</a>\n                            </li>\n                            <li class=\"link\">\n                                <a href=\"miscellaneous/variables.html\" data-type=\"entity-link\">Variables</a>\n                            </li>\n                        </ul>\n                    </li>\n                    <li class=\"divider\"></li>\n                    <li class=\"copyright\">\n                        Documentation generated using <a href=\"https://compodoc.app/\" target=\"_blank\">\n                            <img data-src=\"images/compodoc-vectorise.png\" class=\"img-responsive\" data-type=\"compodoc-logo\">\n                        </a>\n                    </li>\n            </ul>\n        </nav>\n        "));
      this.innerHTML = tp.strings;
    }
  }]);

  return _class;
}( /*#__PURE__*/_wrapNativeSuper(HTMLElement)));