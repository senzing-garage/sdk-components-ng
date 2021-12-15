import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject  } from 'rxjs';
import { map, first, filter, takeUntil } from 'rxjs/operators';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import {
  ConfigService,
  Configuration as SzRestConfiguration,
  ConfigurationParameters as SzRestConfigurationParameters,
  SzAttributeSearchResult,
  SzAttributeType,
  SzAttributeTypesResponse,
  SzAttributeTypesResponseData
} from '@senzing/rest-api-client-ng';

import { SzEntitySearchParams } from '../../models/entity-search';
import { SzSearchService } from '../../services/sz-search.service';
import { JSONScrubber, parseBool } from '../../common/utils';
import { SzConfigurationService } from '../../services/sz-configuration.service';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzFoliosService } from '../../services/sz-folios.service';
import { SzSearchHistoryFolio, SzSearchHistoryFolioItem, SzSearchParamsFolio, SzSearchParamsFolioItem } from '../../models/folio';
import { SzSearchIdentifiersPickerDialogComponent, SzSearchIdentifiersPickerSheetComponent } from './sz-search-identifiers-picker.component';

/** @internal */
interface SzSearchFormParams {
  name?: string[];
  email?: string[];
  dob?: string[];
  identifier?: string[];
  address?: string[];
  phoneNumber?: string[];
  type?: string[];
}
/** @internal */
interface SzBoolFieldMapByName {
  searchButton: boolean;
  resetButton: boolean;
  name: boolean;
  dob: boolean;
  identifier: boolean;
  email: boolean;
  address: boolean;
  phone: boolean;
  identifierType: boolean;
}

/**
 * Provides a search box component that can execute search queries and return results.
 *
 * @example <!-- (WC javascript) SzSearchComponent -->
 * <sz-wc-search
 * id="sz-search"
 * name="Isa Creepr"></sz-wc-search>
 * <script>
 *  document.getElementById('sz-search').addEventListener('resultsChange', (results) => {
 *    console.log('search results: ', results);
 *  });
 * </script>
 *
 * @example <!-- (Angular) SzSearchComponent -->
 * <sz-search
 * name="Isa Creepr"
 * (resultsChange)="myResultsHandler($event)"
 * (searchStart)="showSpinner()"
 * (searchEnd)="hideSpinner()"></sz-search>
 * @export
 *
 * @example <!-- (WC javascript) SzSearchComponent and SzSearchResultsComponent combo -->
 * <sz-wc-search
 * id="sz-search"
 * name="Isa Creepr"></sz-wc-search>
 * <sz-wc-search-results id="sz-search-results"></sz-wc-search-results>
 * <script>
 *  var szSearchComponent = document.getElementById('sz-search');
 *  var szSearchResultsComponent = document.getElementById('sz-search-results');
 *  szSearchComponent.addEventListener('resultsChange', (evt) => {
 *    console.log('search results: ', evt);
 *    szSearchResultsComponent.results = evt.detail;
 *  });
 * </script>
 */
@Component({
  selector: 'sz-search',
  templateUrl: './sz-search.component.html',
  styleUrls: ['./sz-search.component.scss']
})
export class SzSearchComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  /**
   * populate the search fields with an pre-existing set of search parameters.
   */
  @Input() searchValue: SzEntitySearchParams;

  /**
   * whether or not to show the search box label
   * @memberof SzSearchComponent
   */
  @Input() showSearchLabel = true;

  /** text that shows up in buttons */
  @Input() searchButtonLabel = "Search";
  @Input() searchButtonLabelShort = "Search";
  @Input() cancelButtonLabel = "Clear Search Criteria";
  @Input() cancelButtonLabelShort = "Clear";

  /**
   * collection of which mapping attributes to show in the identifiers pulldown.
   * @memberof SzSearchComponent
   */
  @Input() allowedTypeAttributes = [
    'NIN_NUMBER',
    'ACCOUNT_NUMBER',
    'SSN_NUMBER',
    'SSN_LAST4',
    'DRIVERS_LICENSE_NUMBER',
    'PASSPORT_NUMBER',
    'NATIONAL_ID_NUMBER',
    'OTHER_ID_NUMBER',
    'TAX_ID_NUMBER',
    'TRUSTED_ID_NUMBER'
  ];
  private _showIdentifierTypesPicker:boolean = false;
  /** whether or not to show the identifier types picker button */
  @Input('showIdentifierTypesPicker')
  public set inputIdentifierTypesPicker(value){
    this._showIdentifierTypesPicker = parseBool(value);
  }
  /** whether or not to show the identifier types picker button */
  public get showIdentifierTypesPicker(): boolean {
    return this._showIdentifierTypesPicker;
  }

  /** the default amount of searches to store in the search history folio. */
  private rememberLastSearches: number = 20;

  /** whether or not to display search history drop downs. set from searchform prefs */
  public get searchHistoryDisabled(): boolean {
    if(this.prefs && this.prefs.searchForm) {
      return this.prefs.searchForm.disableSearchHistory;
    }
    return false;
  }

  /** the folio items that holds last "X" searches performed */
  public search_history: SzSearchHistoryFolioItem[];

  /**
   * all the "Name" field search values from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryName(): string[] {
    return this.getHistoryOptions('NAME_FULL');
  }
  /**
   * all the "Date of Birth" in the form from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryDob(): string[] {
    return this.getHistoryOptions('DATE_OF_BIRTH');
  }
  /**
   * all the "Identifier" values in the form from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryIdentifier(): string[] {
    return this.getHistoryOptions('IDENTIFIER');
  }
  /**
   * all the "Address" values in the form from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryAddress(): string[] {
    return this.getHistoryOptions('ADDR_FULL');
  }
  /**
   * all the "Phone Number" values in the form  from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryPhone(): string[] {
    return this.getHistoryOptions('PHONE_NUMBER');
  }
  /**
   * all the "Date of Birth" values in the form from last X searches in history folio.
   * @readonly
   */
  public get searchHistoryEmail(): string[] {
    return this.getHistoryOptions('EMAIL_ADDRESS');
  }

  /** @internal */
  private _searchHistoryParams: SzSearchFormParams;
  /** checks to see if a value in a field just changed due to the
   * user selecting a value from a previous search.
   *
   * In the case of a "name" select the selection also populates
   * any other parameters
   * that were also in the form at the time of the search.
   */
  public checkHistoryForMatchOnChange(event) {
    const _currentSearchFormParams = this.getSearchParams();
    if(_currentSearchFormParams && _currentSearchFormParams.NAME_FULL && _currentSearchFormParams.NAME_FULL !== this._searchHistoryParams) {
      // last name search !== current value
      // we need this change check to make sure no infinite loop when entry is applied
      // check to see if name value in search history
      const isInSearchHistory = this.searchHistoryName.some( (name) => name === _currentSearchFormParams.NAME_FULL);
      if(isInSearchHistory) {
        // get search history item
        const currentHistoryEntry = this.search_history.find( (item: SzSearchHistoryFolioItem) => item.data.NAME_FULL === _currentSearchFormParams.NAME_FULL );
        // populate any additional fields
        if (currentHistoryEntry) {
          // see note above on change check
          this._searchHistoryParams = _currentSearchFormParams;
          this.applyHistoryEntryToFields( currentHistoryEntry );
        }
      } else {
        // console.warn('entry not in history! '+ _currentSearchFormParams.NAME_FULL, isInSearchHistory);
      }
    }
    this._searchHistoryParams = _currentSearchFormParams;
  }

  /**
   * reusable method for getting search history lists deduped, ordered,
   * mapped from "search_history" property
   */
  public getHistoryOptions(fieldName: string): string[] {
    let retVal = [];
    if(this.search_history && this.search_history.map) {
      retVal = this.search_history.filter( (folio: SzSearchHistoryFolioItem) => {
        return folio && folio.data && folio.data[fieldName] && folio.data[fieldName] !== undefined && folio.data[fieldName] !== null;
      }).map( (folio: SzSearchHistoryFolioItem ) => {
        return folio.data[fieldName];
      }).filter(function(elem, index, self) {
        return index == self.indexOf(elem);
      });
    }
    return retVal;
  }
  /** apply a search history entry to current form fields */
  private applyHistoryEntryToFields(historyItem: SzSearchHistoryFolioItem) {
    // specifically in the case of populating form fields
    // from prior searches we want to reset fields not in use
    const _values = Object.assign({
      'NAME_FULL': undefined,
      'DATE_OF_BIRTH': undefined,
      'IDENTIFIER': undefined,
      'IDENTIFIER_TYPE': undefined,
      'ADDR_FULL': undefined,
      'PHONE_NUMBER': undefined,
      'EMAIL_ADDRESS': undefined
    }, historyItem.data);

    //console.warn('apply previous historical search to fields: ', _values, historyItem.data);
    if( this.entitySearchForm ) {
      this.entitySearchForm.patchValue( _values );
    }
  }

  /**
   * emitted when a search is being performed.
   * @returns SzSearchFormParams
   * @memberof SzSearchComponent
   */
  @Output() searchStart: EventEmitter<SzSearchFormParams> = new EventEmitter<SzSearchFormParams>();
  /**
   * emitted when a search is done being performed.
   * @returns the number of total results returned from the search.
   * @memberof SzSearchComponent
   */
  @Output() searchEnd: EventEmitter<number> = new EventEmitter<number>();
  /**
   * emitted when a search encounters an exception
   * @todo remove from next breaking change release.
   * @deprecated
   */
  @Output() searchException: EventEmitter<Error> = new EventEmitter<Error>();
  /**
   * emitted when a search encounters an exception
   */
  @Output() exception: EventEmitter<Error> = new EventEmitter<Error>();

  /**
   * emmitted when the results have been cleared.
   * @memberof SzSearchComponent
   */
  @Output() resultsCleared: EventEmitter<void> = new EventEmitter<void>();
  /**
   * emmitted when the search results have been changed.
   * @memberof SzSearchComponent
   */
  @Output('resultsChange') searchResults: Subject<SzAttributeSearchResult[]> = new Subject<SzAttributeSearchResult[]>();
  /**
   * emmitted when parameters of the search have been changed.
   *
   * @memberof SzSearchComponent
   */
  @Output('parameterChange')
  searchParameters: Subject<SzEntitySearchParams> = new Subject<SzEntitySearchParams>();

  /**
   * @ignore
   */
  entitySearchForm: FormGroup;
  /**
   * @ignore
   */
  public searchResultsJSON;

  /* start tag input setters */
  /**
   * the name field of the search form.
   * @example
   * <sz-search name="Good Guy">
   *
   * @memberof SzSearchComponent
   */
  @Input('name')
  public set inputName(value){
    this.searchService.setSearchParam('NAME_FULL',value);

    if(this.entitySearchForm){
      this.entitySearchForm['NAME_FULL'] = value;
    }
  }
  /**
   * sets the value of the email field.
   *
   * @example
   * <sz-search email="guy.i.am.looking&#64;for.com">
   *
   * @memberof SzSearchComponent
   */
  @Input('email')
  public set inputEmail(value){
    this.searchService.setSearchParam('EMAIL_ADDRESS',value);

    if(this.entitySearchForm){
      this.entitySearchForm['EMAIL_ADDRESS'] = value;
    }
  }
  /**
   * sets the value of the address field
   * @example
   * <sz-search address="421 Rawling Str">
   * @memberof SzSearchComponent
   */
  @Input('address')
  public set inputAddress(value){
    this.searchService.setSearchParam('ADDR_FULL',value);

    if(this.entitySearchForm){
      this.entitySearchForm['ADDR_FULL'] = value;
    }
  }
  /** sets the value of the phone field */
  @Input('phone')
  public set inputPhone(value){
    this.searchService.setSearchParam('PHONE_NUMBER',value);

    if(this.entitySearchForm){
      this.entitySearchForm['PHONE_NUMBER'] = value;
    }
  }
  /** sets the value of the identifier field */
  @Input('identifier')
  public set inputIdentifier(value){
    this.searchService.setSearchParam('IDENTIFIER',value);

    if(this.entitySearchForm){
      this.entitySearchForm['IDENTIFIER'] = value;
    }
  }
  /** sets the value of the date of birth form field */
  @Input('dob')
  public set inputDob(value){
    this.searchService.setSearchParam('DATE_OF_BIRTH',value);

    if(this.entitySearchForm){
      this.entitySearchForm['DATE_OF_BIRTH'] = value;
    }
  }
  /**
   * collection of mapping attributes. this is usually populated from the mapping attributes
   * query from the search service.
   * @memberof SzSearchComponent
   * @internal
   */
  public matchingAttributes: SzAttributeType[];

  // ---------------------- individual field visibility setters ----------------------------------
  /** hide the search button */
  @Input() public set hideSearchButton(value: any)   { this.hiddenFields.searchButton        = parseBool(value); }
  /** hide the reset button */
  @Input() public set hideResetButton(value: any)    { this.hiddenFields.resetButton         = parseBool(value); }
  /** hide the clear button */
  @Input() public set hideClearButton(value: any)    { this.hiddenFields.resetButton         = parseBool(value); }
  /** hide the "Name" input field */
  @Input() public set hideName(value: any)           { this.hiddenFields.name                = parseBool(value); }
  /** hide the "DOB" input field */
  @Input() public set hideDob(value: any)            { this.hiddenFields.dob                 = parseBool(value); }
  /** hide the "Identifier" input field */
  @Input() public set hideIdentifier(value: any)     { this.hiddenFields.identifier          = parseBool(value); }
  /** hide the "Email" input field */
  @Input() public set hideEmail(value: any)          { this.hiddenFields.email               = parseBool(value); }
  /** hide the "Address" input field */
  @Input() public set hideAddress(value: any)        { this.hiddenFields.address             = parseBool(value); }
  /** hide the "Phone Number" input field */
  @Input() public set hidePhone(value: any)          { this.hiddenFields.phone               = parseBool(value); }
  /** hide the "Identifier Type" input field */
  @Input() public set hideIdentifierType(value: any) { this.hiddenFields.identifierType      = parseBool(value); }

  // ---------------------- individual field readonly setters ------------------------------------
  /** disable the search button. button is not clickable. */
  @Input() public set disableSearchButton(value: any)   { this.disabledFields.searchButton   = parseBool(value); }
  /** disable the reset button. button is not clickable. */
  @Input() public set disableResetButton(value: any)    { this.disabledFields.resetButton    = parseBool(value); }
  /** disable the clear button. button is not clickable. */
  @Input() public set disableClearButton(value: any)    { this.disabledFields.resetButton    = parseBool(value); }
  /** disable the "Name" field. input cannot be edited. */
  @Input() public set disableName(value: any)           { this.disabledFields.name           = parseBool(value); }
  /** disable the "Date of Birth" field. input cannot be edited. */
  @Input() public set disableDob(value: any)            { this.disabledFields.dob            = parseBool(value); }
  /** disable the "Identifier" field. input cannot be edited. */
  @Input() public set disableIdentifier(value: any)     { this.disabledFields.identifier     = parseBool(value); }
  /** disable the "Email" field. input cannot be edited. */
  @Input() public set disableEmail(value: any)          { this.disabledFields.email          = parseBool(value); }
  /** disable the "Address" field. input cannot be edited. */
  @Input() public set disableAddress(value: any)        { this.disabledFields.address        = parseBool(value); }
  /** disable the "Phone Number" field. input cannot be edited. */
  @Input() public set disablePhone(value: any)          { this.disabledFields.phone          = parseBool(value); }
  /** disable the "Identifier Type" field. input cannot be edited. */
  @Input() public set disableIdentifierType(value: any) { this.disabledFields.identifierType = parseBool(value); }

  // ---------------------- identifier type option visibility setters ----------------------------
  /** disable the identifier type "NIN" option */
  @Input() public set disableNINNumberOption(value: any) { if(value) {        this.disableIdentifierOption('NIN_NUMBER'); }}
  /** disable the identifier type "ACCOUNT NUMBER" option */
  @Input() public set disableACCTNUMOption(value: any) { if(value) {          this.disableIdentifierOption('ACCOUNT_NUMBER'); }}
  /** disable the identifier type "SSN" option*/
  @Input() public set disableSSNOption(value: any) { if(value) {              this.disableIdentifierOption('SSN_NUMBER'); }}
  /** disable the identifier type "SSN Last 4" option */
  @Input() public set disableSSNLAST4Option(value: any) { if(value) {         this.disableIdentifierOption('SSN_LAST4'); }}
  /** disable the identifier type "DRLIC" option */
  @Input() public set disableDRLICOption(value: any) { if(value) {            this.disableIdentifierOption('DRIVERS_LICENSE_NUMBER'); }}
  /** disable the identifier type "Passport" option */
  @Input() public set disablePassportOption(value: any) { if(value) {         this.disableIdentifierOption('PASSPORT_NUMBER'); }}
  /** disable the identifier type "NationalID" option */
  @Input() public set disableNationalIDOption(value: any) { if(value) {       this.disableIdentifierOption('NATIONAL_ID_NUMBER'); }}
  /** disable the identifier type "Other ID" option */
  @Input() public set disableOtherIDOption(value: any) { if(value) {          this.disableIdentifierOption('OTHER_ID_NUMBER'); }}
  /** disable the identifier type "Tax ID" option*/
  @Input() public set disableOtherTaxIDOption(value: any) { if(value) {       this.disableIdentifierOption('TAX_ID_NUMBER'); }}
  /** disable the identifier type "Trusted ID" option */
  @Input() public set disableTrustedIDOption(value: any) { if(value) {        this.disableIdentifierOption('TRUSTED_ID_NUMBER'); }}
  /** enable the identifier type "NIN" option */
  @Input() public set enableNINNumberOption(value: any) { if(value) {        this.enableIdentifierOption('NIN_NUMBER'); }}
  /** enable the identifier type "ACCOUNT NUMBER" option */
  @Input() public set enableACCTNUMOption(value: any) { if(value) {          this.enableIdentifierOption('ACCOUNT_NUMBER'); }}
  /** enable the identifier type "SSN" option */
  @Input() public set enableSSNOption(value: any) { if(value) {              this.enableIdentifierOption('SSN_NUMBER'); }}
  /** enable the identifier type "SSN Last 4" option */
  @Input() public set enableSSNLAST4Option(value: any) { if(value) {         this.enableIdentifierOption('SSN_LAST4'); }}
  /** enable the identifier type "DRLIC" option */
  @Input() public set enableDRLICOption(value: any) { if(value) {            this.enableIdentifierOption('DRIVERS_LICENSE_NUMBER'); }}
  /** enable the identifier type "Passport" option */
  @Input() public set enablePassportOption(value: any) { if(value) {         this.enableIdentifierOption('PASSPORT_NUMBER'); }}
  /** enable the identifier type "NationalID" option */
  @Input() public set enableNationalIDOption(value: any) { if(value) {       this.enableIdentifierOption('NATIONAL_ID_NUMBER'); }}
  /** enable the identifier type "Other ID" option */
  @Input() public set enableOtherIDOption(value: any) { if(value) {          this.enableIdentifierOption('OTHER_ID_NUMBER'); }}
  /** enable the identifier type "Tax ID" option */
  @Input() public set enableOtherTaxIDOption(value: any) { if(value) {       this.enableIdentifierOption('TAX_ID_NUMBER'); }}
  /** enable the identifier type "Trusted ID" option */
  @Input() public set enableTrustedIDOption(value: any) { if(value) {        this.enableIdentifierOption('TRUSTED_ID_NUMBER'); }}

  /**
   * disable an individual identifier type option.
   * @internal
   */
  private disableIdentifierOption(value: string) {
    value = value.trim();
    const optionIndex = this.allowedTypeAttributes.indexOf(value);
    if(optionIndex > -1) {
      this.allowedTypeAttributes.splice(optionIndex, 1);
    }
  }
  /**
   * enable an individual identifier type option.
   * @internal
   */
  private enableIdentifierOption(value: string) {
    value = value.trim();
    const optionIndex = this.allowedTypeAttributes.indexOf(value);
    if(optionIndex < 0) {
      this.allowedTypeAttributes.push(value);
    }
  }
  /**
   * enable a set of identifier type options.
   * format is "SOCIAL_NETWORK, DRIVERS_LICENSE_NUMBER" or array of strings
   */
  @Input()
  public set enableIdentifierOptions(options: string[] | string) {
    if(typeof options === 'string') {
      options = options.trim().split(',');
    }
    // enable each option in collection
    options.forEach((opt)=> {
      this.enableIdentifierOption(opt);
    });
  }
  /**
   * disable a set of identifier type options.
   * format is "SOCIAL_NETWORK, DRIVERS_LICENSE_NUMBER" or array of strings
   */
  @Input()
  public set disableIdentifierOptions(options: string[] | string) {
    if(typeof options === 'string') {
      options = options.split(',');
    }
    // enable each option in collection
    options.forEach((opt)=> {
      this.disableIdentifierOption(opt);
    });
  }
  /** @interal */
  public getAnyDisabled(keys: string[]): string {
    const _some = keys.some((key) => {
      return this.disabledFields[ key ];
    });
    if(_some) {
      return '';
    }
    return null;
  }
  /** @interal */
  public getDisabled(key: string): string {
    if(this.disabledFields && this.disabledFields[ key ]) {
      return '';
    }
    return null;
  }
  /** @internal*/
  public disabledFields: SzBoolFieldMapByName = {
    searchButton: false,
    resetButton: false,
    name: false,
    dob: false,
    identifier: false,
    email: false,
    address: false,
    phone: false,
    identifierType: false
  };
  /** @internal */
  public hiddenFields: SzBoolFieldMapByName = {
    searchButton: false,
    resetButton: false,
    name: false,
    dob: false,
    identifier: false,
    email: false,
    address: false,
    phone: false,
    identifierType: false
  };

  // layout enforcers
  /** @internal */
  public _layoutEnforcers: string[] = [''];
  /** @internal */
  public _forceLayout = false;
  /** @internal */
  public _layoutClasses: string[] = [];

  /**
   * Takes a collection or a single value of layout enum css classnames to pass
   * to all children components. this value overrides auto-responsive css adjustments.
   *
   * @example forceLayout="layout-narrow"
   *
   * @memberof SzEntityDetailComponent
   */
  @Input() public set forceLayout(value: string | string[]) {
    if(value){
      this._forceLayout = true;
      if(typeof value == 'string'){
        if(value.indexOf(',') > -1){
          this._layoutEnforcers = value.split(',');
        } else {
          this._layoutEnforcers = [value];
        }
      } else {
        this._layoutEnforcers = value;
      }
    }

  }
  /** the width to switch from wide to narrow layout */
  @Input() public layoutBreakpoints = [
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 830, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 829 }
  ]
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  public get layoutClasses() {
    return this._layoutClasses;
  }

  private _attributeTypesFromServer: SzAttributeType[];
  @Input('attributeTypes')
  public set inputAttributeTypes(value: SzAttributeType[]) {
    // strip out non-identifiers
    value = value.filter( (attr: SzAttributeType) => {
      return (attr.attributeClass === 'IDENTIFIER');
    });

    // store for caching
    this._attributeTypesFromServer = value;

    // filter out by specific codes
    this.matchingAttributes = value;
    //console.log(`SzSearchComponent.inputAttributeTypes(${JSON.stringify(value, undefined, 2)})`);
    this.matchingAttributes = this.filterAttributeTypesByAllowedTypes(value, this.allowedTypeAttributes);
  }

  public get inputAttributeTypes(): SzAttributeType[] {
    return this._attributeTypesFromServer;
  }

  private filterAttributeTypesByAllowedTypes( attributeTypes: SzAttributeType[], allowedTypes: string[] ) {
    let retTypes: SzAttributeType[] = attributeTypes;

    if(allowedTypes && allowedTypes.length > 0) {
      retTypes = attributeTypes.filter( (attr: SzAttributeType) => {
        return (allowedTypes.indexOf( attr.attributeCode) > -1);
      });
    }
    return retTypes
  }

  /**
   * Returns the placeholder text to show in the "Identifier" field for the 
   * selected "Identifier Type".
   * @returns string
   */
  public get placeHolderTextForIdentifierField(): string {
    let retVal = ""; // value to return
    let selectedValue = this.entitySearchForm.value['IDENTIFIER_TYPE']; // value of type
    // attrCodes that are numbers
    let attrsAreNumbers = [
      "PASSPORT_NUMBER",
      "DRIVERS_LICENSE_NUMBER",
      "DUNS_NUMBER",
      "ACCOUNT_NUMBER",
      "LEI_NUMBER",
      "NPI_NUMBER",
      "NATIONAL_ID_NUMBER",
      "OTHER_ID_NUMBER",
      "PHONE_NUMBER",
      "RECORD_ID",
      "SSN_NUMBER",
      "SSN_LAST4",
      "TAX_ID_NUMBER",
      "TRUSTED_ID_NUMBER",
      "VEHICLE_LICENSE_PLATE_NUMBER",
      "VEHICLE_VIN_NUMBER"
    ];
    // attrCodes that are screen names
    let attrsAreScreenNames = [
      "FACEBOOK",
      "INSTAGRAM",
      "LINKEDIN",
      "SIGNAL",
      "SKYPE",
      "SOCIAL_HANDLE",
      "SOCIAL_NETWORK",
      "TELEGRAM",
      "TWITTER",
      "VIBER",
      "WECHAT",
      "WHATSAPP",
      "ZOOMROOM"
    ];
    // attrCodes that are places
    let attrsArePlace = [
      "GEO_LATITUDE",
      "GEO_LONGITUDE",
      "GEO_LATLONG",
      "PLACE_OF_BIRTH"
    ]
    // attrCodes that expect countries
    let attrsAreCountry = [
      "ADDR_COUNTRY",
      "COUNTRY_OF_ASSOCIATION",
      "NATIONAL_ID_COUNTRY",
      "OTHER_ID_COUNTRY",
      "PASSPORT_COUNTRY",
      "REGISTRATION_COUNTRY",
      "TAX_ID_COUNTRY"
    ]
    // attr codes that expect date and or datetime
    let attrsAreDateTime = [
      "DRIVERS_LICENSE_EXPIRE_DT",
      "DRIVERS_LICENSE_ISSUE_DT",
      "ADDR_THRU_DATE",
      "ADDR_FROM_DATE",
      "DATE_OF_BIRTH",
      "DATE_OF_DEATH",
      "EMAIL_FROM_DATE",
      "EMAIL_THRU_DATE",
      "OTHER_ID_EXPIRE_DT",
      "OTHER_ID_ISSUE_DT",
      "PASSPORT_EXPIRE_DT",
      "PASSPORT_ISSUE_DT",
      "PHONE_FROM_DATE",
      "PHONE_THRU_DATE",
      "REGISTRATION_DATE",
      "RELATED_FROM_DATE",
      "RELATED_THRU_DATE",
      "SOCIAL_FROM_DATE",
      "SOCIAL_THRU_DATE",
      "TAX_ID_EXPIRE_DT",
      "TAX_ID_ISSUE_DT"
    ]

    if(this.matchingAttributes && this.matchingAttributes.find) {
      let matchingAttribute = this.matchingAttributes.find((attr: SzAttributeType) => {
        return attr.attributeCode === selectedValue;
      });

      if(matchingAttribute && matchingAttribute.attributeCode) {
        // primary checks
        if(attrsAreNumbers.indexOf && attrsAreNumbers.indexOf(matchingAttribute.attributeCode) > -1) {
          retVal = "Number";
        } else if(attrsAreScreenNames.indexOf && attrsAreScreenNames.indexOf(matchingAttribute.attributeCode) > -1) {
          retVal = "Screen Name";
        } else if(attrsArePlace.indexOf && attrsArePlace.indexOf(matchingAttribute.attributeCode) > -1) {
          retVal = "Place";
        } else if(attrsAreCountry.indexOf && attrsAreCountry.indexOf(matchingAttribute.attributeCode) > -1) {
          retVal = "Country";
        } else if(attrsAreDateTime.indexOf && attrsAreDateTime.indexOf(matchingAttribute.attributeCode) > -1) {
          retVal = "Date Time";
        }
        // fallthrough checks
        if(retVal === "" && matchingAttribute.attributeCode && matchingAttribute.attributeCode.indexOf) {
          // check code itself for clue
          if(matchingAttribute.attributeCode.indexOf("_DT") > -1) {
            retVal = "Date Time"
          } else if(matchingAttribute.attributeCode.indexOf("_NUMBER") > -1) {
            retVal = "Number"
          } else if(matchingAttribute.attributeCode.indexOf("_DATE") > -1) {
            retVal = "Date"
          } else if(matchingAttribute.attributeCode.indexOf("_STATE") > -1) {
            retVal = "State"
          } else if(matchingAttribute.attributeCode.indexOf("EMAIL_ADDRESS") > -1) {
            retVal = "user@domain.com"
          } else if(matchingAttribute.attributeCode.indexOf("WEBSITE_ADDRESS") > -1) {
            retVal = "http://www.website.com"
          }
        }
      }
    }
    return retVal;
  }

  public chooseIdentifiers(event: Event) {
    const isNarrowLayout = this.layoutClasses.indexOf('layout-narrow') > -1;
    //console.log(`SzSearchComponent.chooseIdentifiers ${JSON.stringify(this._attributeTypesFromServer, undefined, 2)}`);

    if(!isNarrowLayout){
      const dialogRef = this.dialog.open(SzSearchIdentifiersPickerDialogComponent, {
        width: '375px',
        height: '50vh',
        data: {
          attributeTypes: this._attributeTypesFromServer,
          selected: this.allowedTypeAttributes
        }
      });
  
      dialogRef.afterClosed().subscribe((result: SzAttributeType[]) => {
        if(result) {
          let newAllowedList = result.map((attrObj: SzAttributeType) => {
            return attrObj.attributeCode;
          });
          this.prefs.searchForm.allowedTypeAttributes = newAllowedList;
          //this.allowedTypeAttributes = newAllowedList;
        }
      });
    } else {
      const bottomSheetRef = this.bottomSheet.open(SzSearchIdentifiersPickerSheetComponent, {
        ariaLabel: 'Identifier Types',
        panelClass: ['sz-search-identifiers-picker-sheet'],
        backdropClass: 'sz-search-identifiers-picker-sheet-backdrop',
        hasBackdrop: false,
        data: {
          attributeTypes: this._attributeTypesFromServer,
          selected: this.allowedTypeAttributes
        }
      });

      bottomSheetRef.afterDismissed().pipe(
        first()
      ).subscribe((result: SzAttributeType[]) => {        
        if(result) {
          let newAllowedList = result.map((attrObj: SzAttributeType) => {
            return attrObj.attributeCode;
          });
          this.prefs.searchForm.allowedTypeAttributes = newAllowedList;
        }
      });
    }
  }

  /**
   * returns an ordered list of identifier fields to use in the pulldown list.
   * @internal
   * @returns SzAttributeType[]
   */
  public orderedAttributes(): SzAttributeType[] {
    if(this.matchingAttributes && this.matchingAttributes.sort){
      const matchingAttrs =  this.matchingAttributes.sort((a, b) => {
        let returnVal = 0;

        if (a.attributeCode.match(/^PASSPORT/)) {
          returnVal = returnVal - 1;
        }

        if (b.attributeCode.match(/^PASSPORT/)) {
          returnVal = returnVal + 1;
        }

        return returnVal;
      });
      return matchingAttrs;
    }

    return this.matchingAttributes;
  }

  /** 
   * returns text displayed in the "identifier type" drop-down
   * @internal 
   */
  public attributeCodeAsHumanReadable(attrCode: string): string {
    if(attrCode && attrCode.replace) {
      return attrCode.replace(/_/g,' ');
    }
    return attrCode;
  }

  /* end tag input setters */

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private cd: ChangeDetectorRef,
    private apiConfigService: SzConfigurationService,
    private prefs: SzPrefsService,
    private searchService: SzSearchService,
    private folios: SzFoliosService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    public breakpointObserver: BreakpointObserver) {

      this.prefs.searchForm.prefsChanged.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe( (pJson) => {
        if(pJson && pJson.rememberLastSearches) {
          this.rememberLastSearches = pJson.rememberLastSearches;
        }
        if(pJson && pJson.allowedTypeAttributes) {
          // update the allowedTypeAttributes
          this.allowedTypeAttributes = pJson.allowedTypeAttributes;
          if(this.inputAttributeTypes){
            // we already have response from server
            // just re-filter result
            this.matchingAttributes = this.filterAttributeTypesByAllowedTypes(this.inputAttributeTypes, this.allowedTypeAttributes);
            //console.log(`SzSearchComponent(${this.matchingAttributes})`);

            /*console.warn('filtering attr list based on prefs change',
            this.inputAttributeTypes,
            this.allowedTypeAttributes,
            this.matchingAttributes);*/

            this.cd.markForCheck();
            this.cd.detectChanges();
          }
          // otherwise wait for initial response
        }
        if(pJson && pJson.searchHistory && this.prefs && this.prefs.searchForm && this.prefs.searchForm.searchHistory) {
          // getting current value from service prefs service for modality
          // note: history getter is "latest-first"
          this.search_history = this.prefs.searchForm.searchHistory.history;
          //console.log('sz-search.prefs.searchForm from JSON',  this.prefs.searchForm.searchHistory.items);
        }
      });

      this.folios.searchHistoryUpdated.subscribe( (folio: SzSearchHistoryFolio) => {
        if ( folio && folio.history) {
          this.search_history = folio.history;
        }
        //console.log('search history from folio service updated: ', folio.history, this.search_history);
      });
  }

  /**
   * @internal
  */
  private _waitForConfigChange = false;
  /**
   * whether or not to show the wait for the the api
   * conf to change before fetching resources like the identifiers list
   * @memberof SzSearchComponent
   */
  @Input() public set waitForConfigChange(value: any){
    this._waitForConfigChange = parseBool(value);
  }
  public get waitForConfigChange(): boolean | any {
    return this._waitForConfigChange;
  }
  /**
   * whether or not to fetch new attributes from the
   * api server when a configuration change is detected
   * @memberof SzSearchComponent
   */
  @Input() getAttributesOnConfigChange = true;

  /**
   * do any additional component set up
   * @internal
   */
  public ngOnInit(): void {
    this.createEntitySearchForm();
    this.apiConfigService.parametersChanged.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => {
        return this.getAttributesOnConfigChange;
       })
    ).subscribe(
      (cfg: SzRestConfiguration) => {
        //console.info('@senzing/sdk-components-ng/sz-search[ngOnInit]->apiConfigService.parametersChanged: ', cfg);
        this.updateAttributeTypes();
      }
    );
    // make immediate request
    if(!this.waitForConfigChange){
      this.updateAttributeTypes();
    }
    // detect layout changes
    let bpSubArr = [];
    this.layoutBreakpoints.forEach( (bpObj: any) => {
      if(bpObj.minWidth && bpObj.maxWidth){
        // in between
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px) and (max-width: ${bpObj.maxWidth}px)`);
      } else if(bpObj.minWidth){
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px)`);
      } else if(bpObj.maxWidth){
        bpSubArr.push(`(max-width: ${bpObj.maxWidth}px)`);
      }
    });
    const layoutChanges = this.breakpointObserver.observe(bpSubArr);

    layoutChanges.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => { return !this.forceLayout })
    ).subscribe( (state: BreakpointState) => {

      const cssQueryMatches = [];
      // get array of media query matches
      for(let k in state.breakpoints){
        const val = state.breakpoints[k];
        if(val == true) {
          // find key in layoutBreakpoints
          cssQueryMatches.push( k )
        }
      }
      // get array of layoutBreakpoints objects that match media queries
      const _matches = this.layoutBreakpoints.filter( (_bp) => {
        const _mq = this.getCssQueryFromCriteria(_bp.minWidth, _bp.maxWidth);
        if(cssQueryMatches.indexOf(_mq) >= 0) {
          return true;
        }
        return false;
      });
      // assign matches to local prop
      this.layoutClasses = _matches.map( (_bp) => {
        return _bp.cssClass;
      })
    })
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Pull in the list of attribute types from the api server.
   */
  @Input()
  public updateAttributeTypes = (): void => {
    // get attributes
    this.configService.getAttributeTypes()
    .pipe(
      takeUntil(this.unsubscribe$),
      map( (resp: SzAttributeTypesResponse) => resp.data.attributeTypes ),
      first()
    )
    .subscribe((attributeTypes: SzAttributeType[]) => {
      // yup
      this.inputAttributeTypes = attributeTypes;
      this.cd.markForCheck();
      this.cd.detectChanges();
    }, (err)=> {
      this.searchException.next( err ); //TODO: remove in breaking change release
      this.exception.next( err );
    });
  }

  getCssQueryFromCriteria(minWidth?: number, maxWidth?: number): string | undefined {
    if(minWidth && maxWidth){
      // in between
      return (`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
    } else if(minWidth){
      return (`(min-width: ${minWidth}px)`);
    } else if(maxWidth){
      return (`(max-width: ${maxWidth}px)`);
    }
    return undefined;
  }

  /**
   * gets the current search parameters from the searchService and sets up the search form
   * with current values.
   * @internal
  */
  private createEntitySearchForm(): void {
    const searchParams = this.searchService.getSearchParams();
    //console.log('createEntitySearchForm: ',JSON.parse(JSON.stringify(searchParams)));

    if (searchParams) {

      const {
        NAME_FULL,
        DATE_OF_BIRTH,
        IDENTIFIER,
        IDENTIFIER_TYPE,
        ADDR_FULL,
        PHONE_NUMBER,
        EMAIL_ADDRESS
      } =  searchParams;

      this.entitySearchForm = this.fb.group({
        NAME_FULL: [NAME_FULL],
        DATE_OF_BIRTH: [DATE_OF_BIRTH],
        IDENTIFIER: [IDENTIFIER],
        IDENTIFIER_TYPE: "PASSPORT_NUMBER",
        ADDR_FULL: [ADDR_FULL],
        PHONE_NUMBER: [PHONE_NUMBER],
        EMAIL_ADDRESS: [EMAIL_ADDRESS],
        NAME_TYPE: "PRIMARY"
      });

      //this.submitSearch();
    } else {
      this.entitySearchForm = this.fb.group({
        NAME_FULL: [''],
        DATE_OF_BIRTH: [''],
        IDENTIFIER: [''],
        ADDR_FULL: [''],
        PHONE_NUMBER: [''],
        EMAIL_ADDRESS: [''],
        IDENTIFIER_TYPE: ['']
      });
    }

  }
  /**
   * submits search form on enter press
   * if the submit button is currently hidden
   */
  public onKeyEnter(): void {
    if(this.hiddenFields.searchButton){
      this.submitSearch();
    }
  }

  /**
   * get the current search params from input values
   */
  public getSearchParams(): any {
    let searchParams = JSONScrubber(this.entitySearchForm.value);

    // clear out identifier fields if no identifier specified
    if(searchParams['IDENTIFIER_TYPE'] && !searchParams['IDENTIFIER']){
      // clear this
      searchParams['IDENTIFIER_TYPE'] =  undefined;
    }
    // clear out name fields if name field is empty
    if(searchParams['NAME_TYPE'] && (!searchParams['NAME_FULL'] && !searchParams['COMPANY_NAME_ORG'])) {
      searchParams['NAME_TYPE'] =  undefined;
    }
    // proxy name value to company name
    if (searchParams['NAME_FULL']) {
      searchParams['COMPANY_NAME_ORG'] = searchParams['NAME_FULL'];
    }
    // default identifier type to passport if none selected
    if(searchParams['IDENTIFIER_TYPE'] && searchParams['IDENTIFIER']){
      // use the "IDENTIFIER_TYPE" as the key
      // and the "IDENTIFIER" as the value
      searchParams[ (searchParams['IDENTIFIER_TYPE']) ] = searchParams['IDENTIFIER'];
      // after transmutation null out old key/value
      searchParams['IDENTIFIER'] = undefined;
      searchParams['IDENTIFIER_TYPE'] =  undefined;
    }
    if(searchParams['IDENTIFIER_TYPE'] && searchParams['IDENTIFIER']){
      // use the "IDENTIFIER_TYPE" as the key
      // and the "IDENTIFIER" as the value
      searchParams[ (searchParams['IDENTIFIER_TYPE']) ] = searchParams['IDENTIFIER'];
      // after transmutation null out old key/value
      searchParams['IDENTIFIER'] = undefined;
      searchParams['IDENTIFIER_TYPE'] =  undefined;
    }
    // after mods scrub nulls
    searchParams = JSONScrubber(searchParams);
    return searchParams;
  }

  /**
   * submit current search params to search service.
   * when search service returns a result it publishes the result
   * through the resultsChange event emitter, and
   * any parameter changes through the paramsChange emmitter.
   */
  public submitSearch(): void {
    const searchParams = this.getSearchParams();

    if(Object.keys(searchParams).length <= 0){
      // do not perform search if criteria are empty
      this.searchException.next(new Error("null criteria")); //TODO: remove in breaking change release
      this.exception.next( new Error("null criteria") );
      return;
    }
    this.searchStart.emit(searchParams);

    this.searchService.searchByAttributes(searchParams).pipe(
      takeUntil(this.unsubscribe$)
    )
    .subscribe((res) => {
      const totalResults = res ? res.length : 0;
      this.searchResultsJSON = JSON.stringify(res, null, 4);
      this.searchEnd.emit(totalResults);
      this.searchService.setSearchResults(res);
      this.searchResults.next(res);
    }, (err)=>{
      this.searchEnd.emit();
      this.searchException.next( err ); //TODO: remove in breaking change release
      this.exception.next( err );
    });

    this.searchParameters.next(this.searchService.getSearchParams());
  }
  /**
   * clear the search params and form inputs.
   */
  public clearSearch(): void {
    this.resultsCleared.emit();
    this.entitySearchForm.reset();
    //this.searchService.clearSearchCriteria();
  }
}
