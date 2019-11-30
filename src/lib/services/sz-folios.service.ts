import { Injectable, Output, EventEmitter } from '@angular/core';

import { SzSearchHistoryFolio, SzSearchParamsFolio, SzSearchHistoryFolioItem } from '../models/folio';
import { SzSearchService } from './sz-search.service';
import { SzSearchEvent } from '../services/sz-search.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { SzPrefsService } from './sz-prefs.service';

@Injectable({
  providedIn: 'root'
})
export class SzFoliosService {
  /** the collection that holds the users saved searches */
  public searches: SzSearchParamsFolio[] = [];

  /** the top lvl folio that holds last "X" searches performed */
  public  search_history: SzSearchHistoryFolio = new SzSearchHistoryFolio();
  private search_history$ = new BehaviorSubject( this.search_history );
  public  searchHistoryUpdated: Observable<SzSearchHistoryFolio> = this.search_history$.asObservable();

  constructor(
    private prefs: SzPrefsService,
    public searchService: SzSearchService) {
    // on user search, add search params to history stack
    this.searchService.resultsChanged.subscribe( (data) => {
      //console.warn('SzFoliosService.searchService.resultsChanged: ', data);
    });
    this.searchService.parametersChanged.subscribe( (data) => {
      //console.warn('SzFoliosService.searchService.parametersChanged', data);
    });
    this.searchService.searchPerformed.subscribe( (evt: SzSearchEvent) => {
      //console.warn('!!SzFoliosService!! searchPerformed', this.search_history.items);
      this.addToSearchHistory(evt);
    });

    // make sure initial value of "search_history" folios are current with that
    // from prefs storage
    this.search_history = this.prefs.searchForm.searchHistory;
    console.warn('SzFoliosService.search_history ', this.prefs.searchForm.searchHistory);

    this.prefs.prefsChanged.subscribe( (
      json
    ) => {
      console.warn('SzFoliosService.prefsChanged: ', json, this.prefs.searchForm);
    });
  }

  public addToSearchHistory(data: SzSearchEvent) {
    let newSearchHistoryItem = new SzSearchHistoryFolioItem(data.params);
    this.search_history.add( newSearchHistoryItem );
    this.search_history$.next( this.search_history );
    this.prefs.searchForm.searchHistory = this.search_history;

    console.warn('!!SzFoliosService.addToSearchHistory !!\n\r', this.prefs.searchForm.searchHistory, this.search_history.toJSONObject());
  }
}
