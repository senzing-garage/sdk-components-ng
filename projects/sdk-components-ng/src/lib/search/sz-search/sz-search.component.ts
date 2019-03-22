import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject  } from 'rxjs';
import { map, tap, mapTo, first } from 'rxjs/operators';

import {
  ConfigService,
  SzAttributeSearchResult,
  SzAttributeType,
  SzAttributeTypesResponse,
  SzAttributeTypesResponseData
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../../models/entity-search';
import { SzSearchService } from '../../services/sz-search.service';
import { JSONScrubber } from '../../common/utils';

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

/** @internal */
const parseBool = (value: any): boolean => {
  if (!value || value === undefined) {
    return false;
  } else if (typeof value === 'string') {
    return (value.toLowerCase().trim() === 'true') ? true : false;
  } else if (value > 0) { return true; }
  return false;
};

/**
 * Provides a search box component that can execute search queries and return results.
 *
 * @example
 * <sz-search
 * name="Isa Creepr"
 * (resultsChange)="myResultsHandler($event)"
 * (searchStart)="showSpinner()"
 * (searchEnd)="hideSpinner()">
 * @export
 */
@Component({
  selector: 'sz-search',
  templateUrl: './sz-search.component.html',
  styleUrls: ['./sz-search.component.scss']
})
export class SzSearchComponent implements OnInit {
  /**
   * populate the search fields with an pre-existing set of search parameters.
   */
  @Input() searchValue: SzEntitySearchParams;

  /**
   * whether or not to show the search box label
   * @memberof SzSearchComponent
   */
  @Input() showSearchLabel = true;
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
  @Output('resultsChange')
  searchResults: Subject<SzAttributeSearchResult[]> = new Subject<SzAttributeSearchResult[]>();
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

  // ---------------------- individual field visibility setters ----------------------------------
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


  @Input() public set disableNINNumberOption(value: any) { if(value) {        this.disableIdentifierOption('NIN_NUMBER'); }}
  @Input() public set disableACCTNUMOption(value: any) { if(value) {          this.disableIdentifierOption('ACCOUNT_NUMBER'); }}
  @Input() public set disableSSNOption(value: any) { if(value) {              this.disableIdentifierOption('SSN_NUMBER'); }}
  @Input() public set disableSSNLAST4Option(value: any) { if(value) {         this.disableIdentifierOption('SSN_LAST4'); }}
  @Input() public set disableDRLICOption(value: any) { if(value) {            this.disableIdentifierOption('DRIVERS_LICENSE_NUMBER'); }}
  @Input() public set disablePassportOption(value: any) { if(value) {         this.disableIdentifierOption('PASSPORT_NUMBER'); }}
  @Input() public set disableNationalIDOption(value: any) { if(value) {       this.disableIdentifierOption('NATIONAL_ID_NUMBER'); }}
  @Input() public set disableOtherIDOption(value: any) { if(value) {          this.disableIdentifierOption('OTHER_ID_NUMBER'); }}
  @Input() public set disableOtherTaxIDOption(value: any) { if(value) {       this.disableIdentifierOption('TAX_ID_NUMBER'); }}
  @Input() public set trustedIDOption(value: any) { if(value) {               this.disableIdentifierOption('TRUSTED_ID_NUMBER'); }}

  private disableIdentifierOption(value: string) {
    value = value.trim();
    const optionIndex = this.allowedTypeAttributes.indexOf(value);
    if(optionIndex > -1) {
      this.allowedTypeAttributes.splice(optionIndex, 1);
    }
  }
  private enableIdentifierOption(value: string) {
    value = value.trim();
    const optionIndex = this.allowedTypeAttributes.indexOf(value);
    if(optionIndex < 0) {
      this.allowedTypeAttributes.push(value);
    }
  }

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

  @Input('attributeTypes')
  public set inputAttributeTypes(value: SzAttributeType[]) {
    // strip out non-identifiers
    value = value.filter( (attr: SzAttributeType) => {
      return (attr.attributeClass === 'IDENTIFIER');
    });

    // filter out by specific codes
    if(this.allowedTypeAttributes && this.allowedTypeAttributes.length > 0) {
      value = value.filter( (attr: SzAttributeType) => {
        return (this.allowedTypeAttributes.indexOf( attr.attributeCode) > -1);
      });
    }
    this.matchingAttributes = value;
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
  /* end tag input setters */

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private ref: ChangeDetectorRef,
    private searchService: SzSearchService) {

  }

  /**
   * do any additional component set up
   * @internal
   */
  public ngOnInit(): void {
    this.createEntitySearchForm();
    this.updateAttributeTypes();
  }

  /**
   * Pull in the list of attribute types from the api server.
   */
  @Input()
  public updateAttributeTypes = (): void => {
    // get attributes
    this.configService.getAttributeTypes()
    .pipe(
      map( (resp: SzAttributeTypesResponse) => resp.data.attributeTypes ),
      first()
    )
    .subscribe((attributeTypes: SzAttributeType[]) => {
      // yup
      this.inputAttributeTypes = attributeTypes;
      this.ref.markForCheck();
      this.ref.detectChanges();
    }, (err)=> {
      this.searchException.next( err ); //TODO: remove in breaking change release
      this.exception.next( err );
    });
  }

  /**
   * gets the current search parameters from the searchService and sets up the search form
   * with current values.
   * @internal
  */
  private createEntitySearchForm(): void {
    let searchParams = this.searchService.getSearchParams();
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
   * submit current search params to search service.
   * when search service returns a result it publishes the result
   * through the resultsChange event emitter, and
   * any parameter changes through the paramsChange emmitter.
   */
  public submitSearch(): void {
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
    if (searchParams['IDENTIFIER'] && !searchParams['IDENTIFIER_TYPE']) {
      searchParams['IDENTIFIER_TYPE'] = 'PASSPORT_NUMBER';
    }
    // after mods scrub nulls
    searchParams = JSONScrubber(searchParams);

    if(Object.keys(searchParams).length <= 0){
      // do not perform search if criteria are empty
      this.searchException.next(new Error("null criteria")); //TODO: remove in breaking change release
      this.exception.next( new Error("null criteria") );
      return;
    }
    this.searchStart.emit(searchParams);

    this.searchService.searchByAttributes(searchParams)
    .subscribe((res) => {
      const totalResults = res ? res.length : 0;
      this.searchResultsJSON = JSON.stringify(res, null, 4);
      this.searchEnd.emit(totalResults);
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
