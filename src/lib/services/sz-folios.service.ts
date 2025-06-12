import { Injectable, Output, EventEmitter } from '@angular/core';

import { SzSearchHistoryFolio, SzSearchParamsFolio, SzSearchHistoryFolioItem } from '../models/folio';
import { SzSearchService } from './sz-search.service';
import { SzSearchEvent } from '../services/sz-search.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { SzPrefsService } from './sz-prefs.service';
/**
 * A service providing access to top level Folios for things like
 * "Saved Searches", "Search History", "Saved Projects"
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzFoliosService {
  /** the collection that holds the users saved searches */
  public searches: SzSearchParamsFolio[] = [];

  /** convenience proxy getter to prefs search history location */
  public get search_history(): SzSearchHistoryFolio {
    return this.prefs.searchForm.searchHistory;
  }
  /** convenience proxy setter to prefs search history location */
  public set search_history(value: SzSearchHistoryFolio) {
    this.prefs.searchForm.searchHistory = value;
  }
  /** the behavior subject used for broadcasting the searchHistoryUpdated event */
  private search_history$ = new BehaviorSubject( this.prefs.searchForm.searchHistory );
  /** the observable that can be listened for when the search history is updated */
  public  searchHistoryUpdated: Observable<SzSearchHistoryFolio> = this.search_history$.asObservable();

  constructor(
    private prefs: SzPrefsService,
    public searchService: SzSearchService) {

    // on user search, add search params to history stack
    this.searchService.searchPerformed.subscribe( (evt: SzSearchEvent) => {
      //console.log('SzFoliosService searchPerformed', this.search_history.items);
      this.addToSearchHistory(evt);
    });

    //console.log('SzFoliosService.search_history ', this.prefs.searchForm.searchHistory, this.search_history);
    if( this.prefs ) {
      this.prefs.prefsChanged.subscribe( (
        json
      ) => {
        if(json.searchForm && json.searchForm.rememberLastSearches && this.search_history && this.search_history.maxItems) {
          this.search_history.maxItems = json.searchForm.rememberLastSearches;
        }
        //console.warn('SzSearchHistoryFolio.prefsChanged: ', json.searchForm, json, this.prefs.searchForm.rememberLastSearches);
      });
    }
  }

  /** add search to history stack */
  public addToSearchHistory(data: SzSearchEvent) {
    let newSearchHistoryItem = new SzSearchHistoryFolioItem(data.params);
    if (!this.search_history) {
      // what??? o.O
      // no. make it so.
      this.prefs.searchForm.searchHistory = new SzSearchHistoryFolio( [newSearchHistoryItem] );
      console.log('SzFoliosService.addToSearchHistory: CREATED BRAND NEW FOLIO!!', this.search_history );
    } else if(this.search_history && this.search_history.add) {
      const _added = this.search_history.add( newSearchHistoryItem, false );
      if( _added ){
        this.search_history$.next( this.search_history );
        console.log('SzFoliosService.addToSearchHistory: ('+ _added +')', this.search_history, this.prefs.searchForm);
        // emit change event manually since we are not using built in prefs setter
        // ie: "this.prefs.searchForm.searchHistory = SzSearchHistoryFolio"
        this.prefs.searchForm.prefsChanged.next( this.prefs.searchForm.toJSONObject() );
      }
    }
  }
}
