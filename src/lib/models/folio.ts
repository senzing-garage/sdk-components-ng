import { SzEntitySearchParams } from './entity-search';

// -----------------------  start base folio classes -------------------------
/**
 * A abstract class representing a generic SzFolioItem.
 */
export abstract class SzFolioItem {
  /** the name of the folio item */
  abstract _name: string;
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
  public get name (): string {
    return this._name;
  }
  public set name (value: string) {
    this._name = value;
  }
}

/**
 * A collection base class containing common
 * properties and methods for interacting with a
 * collection of SzFolioItem based items.
 */
export abstract class SzFolio {
  /** the collection of SzFolioItem's */
  abstract items: SzFolioItem[];
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
 */
export class SzSearchParamsFolioItem extends SzFolioItem {
  _data: SzEntitySearchParams;
  /** if set the name should be used when displaying the item to the user */
  _name: string;

  public override get data (): SzEntitySearchParams {
    return this._data;
  }
  public override set data (value: SzEntitySearchParams) {
    this._data = value;
  }
  public override get name (): string {
    return this._name;
  }
  public override set name (value: string) {
    this._name = value;
  }

  constructor(data: SzEntitySearchParams) {
    super(); // must call super()
    this.data = data;
  }
}

/**
 * A folio representing a collection of searches
 * @export
 */
export class SzSearchParamsFolio extends SzFolio {
  /** the search parameter sets */
  items: SzSearchParamsFolioItem[];
  /** the name of the search set */
  override name: string;

  constructor( items?: SzSearchParamsFolioItem[]) {
    super(); // must call super()

    if (items) { this.items = items; }
  }
}
// -----------------------    end search form folios   -------------------------

/**
 * A folio item specific to being used in the search history folio. It
 * extends the SzSearchParamsFolioItem class.
 *
 * @export
 */
export class SzSearchHistoryFolioItem extends SzSearchParamsFolioItem {
  public override get name(): string {
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
 */
export class SzSearchHistoryFolio extends SzSearchParamsFolio {
  /**
   * the collection of search parameters used in the last X searches
   */
  override items: SzSearchHistoryFolioItem[];
  /** hardcoded to 'Search History' */
  public _name: string = 'Search History';
  /** The number of searches back to store in the folio */
  public maxItems: number = 20;
  /** update mode. when a user searches for something that is already
   * in the search history should the item be moved to the top of the
   * stack, updated in place, or ignored. possible values are -1(ignore), 0(replace), 1(update position)
   */
  public updateMode = 1;

  /** gets the history folio items in decending chronological order */
  public get history(): SzSearchHistoryFolioItem[] {
    let _items: SzSearchParamsFolioItem[] = [];
    _items = _items.concat(this.items).reverse();
    return _items;
  }

  constructor(items?: SzSearchHistoryFolioItem[]) {
    super(); // must call super()

    if (items) {
      this.items = items;
    }
  }
  /**
   * Add a new search parameter set to the stack
   */
  public override add( item: SzSearchHistoryFolioItem, overwrite:boolean = true ): Boolean {
    let _exists = this.exists(item);
    let retVal = false;
    if( overwrite || !_exists){
      this.items.push( item );
      this.items = this.trimItemsTo(this.maxItems);
      retVal = true;
      // console.log('added SzSearchHistoryFolioItem: ', item);
    } else if (_exists) {
      // already exists
      let _indexOf = this.indexOf(item);
      retVal = false; // set to false, but if we replace set to true

      if(this.updateMode === 0 && this.items && this.items[ _indexOf ]) {
        // just update
        this.items[ _indexOf ] = item;
      } else if (this.updateMode === 1){
        // remove from existing position
        if(_indexOf > -1 && this.items.splice && _indexOf < (this.items.length - 1)) {
          this.items.splice(_indexOf, 1);
        }
        // add at new index
        this.items.push( item );
        console.warn('updated already existing item('+ _indexOf +'). moved to top of stack ', this.items );
        retVal = true;
      }
    }
    return retVal;
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
      let _items = SzSearchHistoryFolio.FolioItemsFromJSON(data.items);
      this.items = this.trimItemsTo(this.maxItems, _items);
    }
  }
  /** used internally to keep stack at appropriate length */
  public trimItemsTo(len: number, items?: SzSearchHistoryFolioItem[]): SzSearchHistoryFolioItem[] {
    let _retVal = (items) ? items : this.items;
    if(len && _retVal && _retVal.length > len) {
      let _startIndex = (_retVal.length - len) - 1;
      if(_startIndex >= 0 && _retVal[_startIndex] && _retVal.slice) {
        _retVal = _retVal.slice( _startIndex );
      }
    }
    return _retVal;
  }

  /** whether or not the folio item passed in already exists in collection */
  exists(item: SzSearchHistoryFolioItem): boolean {
    let retVal = false;
    if(item && this.items && this.items.length > 0) {
      retVal = this.items.some( (hItem: SzSearchHistoryFolioItem) => {
        return (JSON.stringify(hItem.data) == JSON.stringify(item.data));
      });
    }
    return retVal;
  }
  /** returns the index position of an existing folio item */
  indexOf(item: SzSearchHistoryFolioItem): number {
    let retVal = -1;
    if(item && this.items && this.items.length > 0 && this.items.findIndex) {
      retVal = this.items.findIndex( (hItem: SzSearchHistoryFolioItem) => {
        return (JSON.stringify(hItem.data) == JSON.stringify(item.data));
      });
    }
    return retVal;
  }

  /**
   * returns an array of "SzSearchHistoryFolio" that is created from the
   * 'items' model that 'toJSONObject' returns.
   */
  static FolioItemsFromJSON( itemsJson: [] ): SzSearchHistoryFolioItem[] {
    let _items = itemsJson.map( (item) => {
      return new SzSearchHistoryFolioItem( item );
    });
    return  _items;
  }
}
// ------------------------ end search history folios -------------------------
