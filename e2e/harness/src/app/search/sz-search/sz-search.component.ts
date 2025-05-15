

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { tap, filter } from 'rxjs/operators';

import {
  EntityDataService,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams, SzSearchService, JSONScrubber } from '@senzing/sdk-components-ng';

/**
 * @internal
 */
interface SzSearchFormParams {
  name?: string[];
  email?: string[];
  dob?: string[];
  identifier?: string[];
  address?: string[];
  phoneNumber?: string[];
  type?: string[];
};
@Component({
    selector: 'app-sz-search',
    templateUrl: './sz-search.component.html',
    styleUrls: ['./sz-search.component.scss'],
    standalone: false
})
export class SzSearchComponentTest implements OnInit {
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
   * collection of mapping attributes. this is usually populated from the mapping attributes
   * query from the search service.
   * @memberof SzSearchComponent
   * @internal
   */
  //private matchingAttributes: SzMappingAttr[];
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
  entitySearchForm: UntypedFormGroup;
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
    this.searchService.setSearchParam('name',value);

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
    this.searchService.setSearchParam('email',value);

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
  /* end tag input setters */

  constructor(private fb: UntypedFormBuilder, private entityService: EntityDataService, private searchService: SzSearchService) {}

  /**
   * do any additional component set up
   * @internal
   */
  public ngOnInit(): void {
    this.createEntitySearchForm();

    // get attributes
    /*
    this.searchService.getMappingAttributes()
    .subscribe((attrs: SzMappingAttr[])=>{
      this.matchingAttributes = attrs.filter( (attr: SzMappingAttr) => {
        return (this.allowedTypeAttributes.indexOf( attr.code) > -1)
      });
      console.log('sz-search.getMappingAttributes: ', this.matchingAttributes);
    });
    */
  }

  /**
   * gets the current search parameters from the searchService and sets up the search form
   * with current values.
   * @internal
  */
  private createEntitySearchForm(): void {

    let searchParams = this.searchService.getSearchParams();

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
    const searchParams = JSONScrubber(this.entitySearchForm.value);

    if (searchParams['IDENTIFIER'] && !searchParams['IDENTIFIER_TYPE']) {
      searchParams['IDENTIFIER_TYPE'] = 'PASSPORT_NUMBER';
    }

    if (searchParams['NAME_FULL']) {
      searchParams['COMPANY_NAME_ORG'] = searchParams['NAME_FULL'];
    }

    console.log('@senzing/sdk/search/sz-search/sz-search.component.submitSearch: ', searchParams);

    this.searchStart.emit(searchParams);

    this.searchService.searchByAttributes(searchParams)
    .subscribe((res) => {
      const totalResults = res ? res.length : 0;
      this.searchResultsJSON = JSON.stringify(res, null, 4);
      this.searchEnd.emit(totalResults);
      this.searchResults.next(res);

      console.log('@senzing/sdk/search/sz-search/sz-search.component.submitSearch: results ', res);
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

  /**
   * returns an ordered list of fields to use in the pulldown list.
   * @internal
   * @returns SzMappingAttr[]
   */
  /*
  public orderedAttributes(): SzMappingAttr[] {
    if(this.matchingAttributes && this.matchingAttributes.sort){
      return this.matchingAttributes.sort((a, b) => {
        let returnVal = 0;

        if (a.code.match(/^PASSPORT/)) {
          returnVal = returnVal - 1;
        }

        if (b.code.match(/^PASSPORT/)) {
          returnVal = returnVal + 1;
        }

        return returnVal;
      });
    }
    return this.matchingAttributes;
  }*/
}
