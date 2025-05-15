import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SzEntityRecord, SzAttributeSearchResult, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';
import { SzPrefsService, SzSearchResultsPrefs } from '../../../services/sz-prefs.service';
import { bestEntityName } from '../../../entity/entity-utils';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-search-result-card-header',
    templateUrl: './sz-search-result-card-header.component.html',
    styleUrls: ['./sz-search-result-card-header.component.scss'],
    standalone: false
})
export class SzSearchResultCardHeaderComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _searchResult: SzAttributeSearchResult;

  @Input() showDataSources: boolean = true;
  @Input() showMatchKey: boolean = false;

  @Input() public set searchResult(value: SzAttributeSearchResult) {
    this._searchResult = value;
    //console.log('sz-search-result-card-header.setSearchResult: ', this._searchResult);
  }
  public get searchResult(): SzAttributeSearchResult {
    return this._searchResult;
  }

  @Input() public searchValue: string;
  @Input() public hideBackGroundColor: boolean;
  @Input() public entityData: SzEntityRecord;
  alert = false;

  public get recordSummariesExist(): boolean {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries.length > 0;
    }
    return false;
  }

  public get recordSummaries(): SzDataSourceRecordSummary[] {
    if(this.searchResult && this.searchResult.recordSummaries){
      return this.searchResult.recordSummaries;
    }
    return []
  }

  public get bestName() : string {
    return bestEntityName(this._searchResult);
  }

  public get entityDetailsLinkName(): string { 
    return this.bestName;
  }

  public get matchPills() : { text: string, ambiguous: boolean, plusMinus: string }[] | undefined {
    let retVal = [];
    if(this.searchResult && this.searchResult.matchKey) {
      return this.getPillInfo(this.searchResult.matchKey);
    }

    return undefined;
  };

  private getPillInfo(matchKey): { text: string, ambiguous: boolean, plusMinus: string }[] {
    if(matchKey) {
      const pills = matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .map(item => item.startsWith('+') ? item : `-${item}`)
      .map(item => {
        return { text: item.replace('(Ambiguous)', ''), plusMinus: item.startsWith('+') ? 'plus' : 'minus', ambiguous: (item.indexOf('(Ambiguous)') > -1) };
      });
      return pills;
    }
    return undefined;
  }

  public get entityDetailsLink(): string | boolean {
    if (this._searchResult && this._searchResult.entityId) {
      return `/search/details/${this._searchResult.entityId}`;
    } else if(this._searchResult && this._searchResult.entityId ) {
      //return '/search/by-entity-id/3086';
      return `/search/by-entity-id/${this._searchResult.entityId}`;
    }
    return false;
  }

  constructor(
    private cd: ChangeDetectorRef,
    public prefs: SzPrefsService) {}

  ngOnInit() {
    /*
    this.showMatchKey = this.prefs.searchResults.showMatchKeys;
    this.prefs.searchResults.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );*/
  }

  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: SzSearchResultsPrefs) {
    this.showMatchKey = prefs.showMatchKeys;
    this.cd.detectChanges();
  }

}
