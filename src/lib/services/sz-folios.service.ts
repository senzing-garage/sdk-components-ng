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

  /** the top lvl folio that holds last "X" searches performed */
  public  search_history: SzSearchHistoryFolio = new SzSearchHistoryFolio();
  /** the behavior subject used for broadcasting the searchHistoryUpdated event */
  private search_history$ = new BehaviorSubject( this.search_history );
  /** the observeable that can be listend for when the search history is updated */
  public  searchHistoryUpdated: Observable<SzSearchHistoryFolio> = this.search_history$.asObservable();

  constructor(
    private prefs: SzPrefsService,
    public searchService: SzSearchService) {

    // on user search, add search params to history stack
    this.searchService.searchPerformed.subscribe( (evt: SzSearchEvent) => {
      //console.log('SzFoliosService searchPerformed', this.search_history.items);
      this.addToSearchHistory(evt);
    });

    // make sure initial value of "search_history" folios are current with that
    // from prefs storage
    this.search_history =  this.prefs.searchForm.searchHistory ? this.prefs.searchForm.searchHistory : new SzSearchHistoryFolio();
    console.log('SzFoliosService.search_history ', this.prefs.searchForm.searchHistory, this.search_history);
    if( this.prefs ) {
      this.prefs.prefsChanged.subscribe( (
        json
      ) => {
        if(json.searchForm && json.searchForm.rememberLastSearches && this.search_history && this.search_history.maxItems) {
          this.search_history.maxItems = json.searchForm.rememberLastSearches
        }
        //console.log('SzSearchHistoryFolio.prefsChanged: ', json, this.prefs.searchForm.rememberLastSearches);
      });
    }
  }

  public addToSearchHistory(data: SzSearchEvent) {
    let newSearchHistoryItem = new SzSearchHistoryFolioItem(data.params);
    if(this.search_history && this.search_history.add){
      this.search_history.add( newSearchHistoryItem );
      this.search_history$.next( this.search_history );
    }
    this.prefs.searchForm.searchHistory = this.search_history;

    // console.log('SzFoliosService.addToSearchHistory\n\r', this.prefs.searchForm.searchHistory, this.search_history.toJSONObject());
  }
}
