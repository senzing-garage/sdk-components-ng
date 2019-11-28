import { Injectable, Output, EventEmitter } from '@angular/core';

import { SzSearchParamsFolio, SzSearchParamsFolioItem } from '../models/folio';
import { SzSearchService } from './sz-search.service';

@Injectable({
  providedIn: 'root'
})
export class SzFoliosService {
  /** the top lvl folio that holds last "X" searches performed */
  public search_history: SzSearchParamsFolio = new SzSearchParamsFolio("search_history");
  /** the collection that holds the users saved searches */
  public searches: SzSearchParamsFolio[] = [];

  constructor(public searchService: SzSearchService) {
    // on user search, add search params to history stack
    this.searchService.resultsChanged.subscribe( (data) => {
      console.log('SzFoliosService.searchService.resultsChanged: ', data);
    });
    this.searchService.parametersChanged.subscribe( (data) => {
      console.log('SzFoliosService.searchService.parametersChanged', data);
    });
    this.searchService.searchPerformed.subscribe( (data) => {
      console.log('SzFoliosService.searchService.searchPerformed', data);
    });
  }

  public addToSearchHistory(data) {

  }
}
