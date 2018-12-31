import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { SzEntitySearchParams } from '../../models/entity-search';
import { SzSearchService } from '../../services/sz-search.service';
import { tap, filter } from 'rxjs/operators';
import { SzSearchResults } from '../../models/responces/search-results/search-results';
import { SzMappingAttr } from '../../models/mapping-attr';

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
  styleUrls: ['./sz-search.component.scss']
})
export class SzSearchComponent implements OnInit {

  /** project id that this search box is bound to */
  @Input()
  public projectId = 1;
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
  private matchingAttributes: SzMappingAttr[];
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
  searchResults: Subject<SzSearchResults> = new Subject<SzSearchResults>();
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
    this.searchService.setSearchParam('name',value);

    if(this.entitySearchForm){
      this.entitySearchForm['name'] = value;
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
      this.entitySearchForm['email'] = value;
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
    this.searchService.setSearchParam('address',value);

    if(this.entitySearchForm){
      this.entitySearchForm['address'] = value;
    }
  }
  /** sets the value of the phone field */
  @Input('phone')
  public set inputPhone(value){
    this.searchService.setSearchParam('phone',value);

    if(this.entitySearchForm){
      this.entitySearchForm['phone'] = value;
    }
  }
  /** sets the value of the identifier field */
  @Input('identifier')
  public set inputIdentifier(value){
    this.searchService.setSearchParam('identifier',value);

    if(this.entitySearchForm){
      this.entitySearchForm['identifier'] = value;
    }
  }
  /** sets the value of the date of birth form field */
  @Input('dob')
  public set inputDob(value){
    this.searchService.setSearchParam('dob',value);

    if(this.entitySearchForm){
      this.entitySearchForm['dob'] = value;
    }
  }
  /* end tag input setters */

  constructor(private fb: FormBuilder, private searchService: SzSearchService) {}

  /**
   * do any additional component set up
   * @internal
   */
  public ngOnInit(): void {
    this.createEntitySearchForm();

    // get attributes
    this.searchService.getMappingAttributes()
    .subscribe((attrs: SzMappingAttr[])=>{
      this.matchingAttributes = attrs.filter( (attr: SzMappingAttr) => {
        return (this.allowedTypeAttributes.indexOf( attr.code) > -1)
      });
      console.log('sz-search.getMappingAttributes: ', this.matchingAttributes);
    });
  }

  /**
   * gets the current search parameters from the searchService and sets up the search form
   * with current values.
   * @internal
  */
  private createEntitySearchForm(): void {
    let searchParams = this.searchService.getSearchParams();

    if (searchParams) {
      const { name, dob, identifier, type, address, phoneNumber, email } = searchParams;
      this.entitySearchForm = this.fb.group({
        name: [name],
        dob: [dob],
        identifier: [identifier],
        address: [address],
        phoneNumber: [phoneNumber],
        email: [email],
        type: [type]
      });

      this.submitSearch();
    } else {
      this.entitySearchForm = this.fb.group({
        name: [''],
        dob: [''],
        identifier: [''],
        address: [''],
        phoneNumber: [''],
        email: [''],
        type: ['']
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
    const searchParams = this.entitySearchForm.value;
    if (searchParams['identifier'] && !searchParams['type']) {
      searchParams['type'] = 'PASSPORT_NUMBER';
    }

    if (searchParams['name']) {
      searchParams['orgName'] = searchParams['name'];
    }
    console.log('@senzing/sdk/search/sz-search/sz-search.component.submitSearch: ', searchParams);

    this.searchStart.emit(searchParams);
    this.searchService.searchByAttributes(searchParams, this.projectId)
    .subscribe((res) => {
      const totalResults = res ? res.discoveredRelationships.length + res.matches.length + res.nameOnlyMatches.length + res.possibleMatches.length : 0;
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
  }


}
