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
  styleUrls: ['./sz-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  private matchingAttributes: SzAttributeType[];

  @Input('attributeTypes')
  public set inputAttributeTypes(value: SzAttributeType[]) {
    // strip out non-identifiers
    value = value.filter( (attr: SzAttributeType) => {
      return (attr.attributeClass === 'IDENTIFIER')
    });

    // filter out by specific codes
    if(this.allowedTypeAttributes && this.allowedTypeAttributes.length > 0){
      value = value.filter( (attr: SzAttributeType) => {
        return (this.allowedTypeAttributes.indexOf( attr.attributeCode) > -1)
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
      return this.matchingAttributes.sort((a, b) => {
        let returnVal = 0;

        if (a.attributeCode.match(/^PASSPORT/)) {
          returnVal = returnVal - 1;
        }

        if (b.attributeCode.match(/^PASSPORT/)) {
          returnVal = returnVal + 1;
        }

        return returnVal;
      });
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
      tap( (resp: any)=> console.log(resp) ),
      map( (resp: SzAttributeTypesResponse) => resp.data.attributeTypes ),
      first()
    )
    .subscribe((attributeTypes: SzAttributeType[]) => {
      // yup
      this.inputAttributeTypes = attributeTypes;
      this.ref.markForCheck();
      this.ref.detectChanges();
    }, (err)=>{
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

    console.log('@senzing/sdk/search/sz-search/sz-search.component.submitSearch: ', searchParams);

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
