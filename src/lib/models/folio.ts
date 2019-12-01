import { SzEntitySearchParams } from './entity-search';

// -----------------------  start base folio classes -------------------------
/**
 * A abstract class representing a generic SzFolioItem.
 */
export abstract class SzFolioItem {
  /** the name of the folio item */
  abstract name: string;
  /** the data representing this folio item */
  abstract _data;
  /** the data representing this folio item */
  public get data ()  {
    return this._data;
  }
  /** the data representing this folio item */
  public set data (value: any) {
    this._data = value;
  }
}

/**
 * A collection base class containing common
 * properties and methods for interacting with a
 * collection of SzFolioItem based items.
 */
export abstract class SzFolio {
  /** the collection of SzFolioItem's */
  abstract items: SzFolioItem[] = [];
  /** the name of the folio */
  public name: string;

  /** add a  SzFolioItem to the "items" collection */
  public add( item: SzFolioItem ) {
    this.items.push( item );
  }
  // TODO: handle overloads
  /** remove a SzFolioItem from "items" if it exists */
  public remove( item ) {

  }
}
// -----------------------   end base folio classes  -------------------------


// -----------------------  start search form folios -------------------------
/**
 * a folio item representing a set of search parameters to save a set of
 * search parameters in a folio.
 * @export
 * @class SzSearchParamsFolioItem
 * @extends {SzFolioItem}
 */
export class SzSearchParamsFolioItem extends SzFolioItem {
  _data: SzEntitySearchParams;
  /** if set the name should be used when displaying the item to the user */
  name: string;

  public get data (): SzEntitySearchParams {
    return this._data;
  }
  public set data (value: SzEntitySearchParams) {
    this._data = value;
  }

  constructor(data: SzEntitySearchParams) {
    super(); // must call super()
    this.data = data;
  }
}

/**
 * A folio representing a collection of searches
 * @export
 * @class SzSearchParamsFolio
 * @extends {SzFolio}
 */
export class SzSearchParamsFolio extends SzFolio {
  /** the search parameter sets */
  items: SzSearchParamsFolioItem[];
  /** the name of the search set */
  name: string;

  constructor( items?: SzSearchParamsFolioItem[]) {
    super(); // must call super()

    if (items) { this.items = items; }
    if (name) { this.name = name; }
  }
}
// -----------------------    end search form folios   -------------------------

/**
 * A folio item specific to being used in the search history folio. It
 * extends the SzSearchParamsFolioItem class.
 *
 * @export
 * @class SzSearchHistoryFolioItem
 * @extends {SzSearchParamsFolioItem}
 */
export class SzSearchHistoryFolioItem extends SzSearchParamsFolioItem {
  public get name(): string {
    let retVal;
    if (this.data) {
      if(this.data.NAME_FULL) { retVal = this.data.NAME_FULL; }
    }
    return retVal;
  }
  constructor( data: SzEntitySearchParams ) {
    super(data); // must call super()
  }
}
/**
 * A specialized SzFolio class used for storing the user's search history.
 *
 * @export
 * @class SzSearchHistoryFolio
 * @extends {SzSearchParamsFolio}
 */
export class SzSearchHistoryFolio extends SzSearchParamsFolio {
  /**
   * the collection of search parameters used in the last X searches
   */
  items: SzSearchHistoryFolioItem[];
  /** hardcoded to 'Search History' */
  public name: string = 'Search History';
  /** The number of searches back to store in the folio */
  public maxItems: number = 20;

  /** gets the history folio items in decending chronological order */
  public get history(): SzSearchHistoryFolioItem[] {
    let _items: SzSearchParamsFolioItem[] = [];
    _items = _items.concat(this.items).reverse();
    return _items;
  }

  constructor( items?: SzSearchHistoryFolioItem[]) {
    super(); // must call super()

    if (items) { this.items = items; }
    if (name) { this.name = name; }
  }
  /**
   * Add a new search parameter set to the stack
   */
  public add( item: SzSearchHistoryFolioItem ) {
    this.items.push( item );
    if(this.maxItems && this.items.length > this.maxItems) {
      // remove first item (which chronologically will be farthest back in time)
      let removedItem = this.items.shift();
      console.warn('tempArr : ', this.items);
    }
  }
  /** get a json representation model of this class and its items. */
  public toJSONObject(): {name?: string, items: any} {
    let _items = this.items.map( (item: SzSearchHistoryFolioItem) => {
      return item.data;
    })
    return {
      name: this.name,
      items: _items
    }
  }
  /** set the folios properties via a json model. This is the same model that
   * this.toJSONObject returns */
  public fromJSONObject(data: {name?: string, items: any}) {
    if(data && data.name) { this.name = data.name;}
    if(data && data.items && data.items.map) {
      /*
      let _items = data.items.map( (item) => {
        return new SzSearchHistoryFolioItem( item );
      });*/
      this.items = SzSearchHistoryFolio.FolioItemsFromJSON(data.items);
    }
  }
  /**
   * returns an array of "SzSearchHistoryFolio" that is created from the
   * 'items' model that 'toJSONObject' returns.
   * @static
   * @param {[]} itemsJson
   * @returns {SzSearchHistoryFolioItem[]}
   */
  static FolioItemsFromJSON( itemsJson: [] ): SzSearchHistoryFolioItem[] {
    let _items = itemsJson.map( (item) => {
      return new SzSearchHistoryFolioItem( item );
    });
    return  _items;
  }
}
// ------------------------ end search history folios -------------------------
