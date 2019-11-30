import { SzEntitySearchParams } from './entity-search';

// -----------------------  start base folio classes -------------------------

export abstract class SzFolioItem {
  abstract name: string;
  abstract _data;
  public get data ()  {
    return this._data;
  }
  public set data (value: any) {
    this._data = value;
  }
}

export abstract class SzFolio {
  abstract items: SzFolioItem[] = [];
  public name: string;

  public add( item: SzFolioItem ) {
    this.items.push( item );
  }
  // TODO: handle overloads
  public remove( item ) {

  }
}
// -----------------------   end base folio classes  -------------------------


// -----------------------  start search form folios -------------------------
export class SzSearchParamsFolioItem extends SzFolioItem {
  _data: SzEntitySearchParams;
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

export class SzSearchParamsFolio extends SzFolio {
  items: SzSearchParamsFolioItem[];
  name: string;

  constructor( items?: SzSearchParamsFolioItem[]) {
    super(); // must call super()

    if (items) { this.items = items; }
    if (name) { this.name = name; }
  }
}
// -----------------------    end search form folios   -------------------------

// ----------------------- start search history folios -------------------------
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

export class SzSearchHistoryFolio extends SzSearchParamsFolio {
  items: SzSearchHistoryFolioItem[];
  public name: string = 'Search History';
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

  public add( item: SzSearchHistoryFolioItem ) {
    this.items.push( item );
    if(this.maxItems && this.items.length > this.maxItems) {
      // remove first item (which chronologically will be farthest back in time)
      let removedItem = this.items.shift();
      console.warn('tempArr : ', this.items);
    }
  }

  public toJSONObject(): {name?: string, items: any} {
    let _items = this.items.map( (item: SzSearchHistoryFolioItem) => {
      return item.data;
    })
    return {
      name: this.name,
      items: _items
    }
  }

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

  static FolioItemsFromJSON( itemsJson: [] ): SzSearchHistoryFolioItem[] {
    let _items = itemsJson.map( (item) => {
      return new SzSearchHistoryFolioItem( item );
    });
    return  _items;
  }
}
// ------------------------ end search history folios -------------------------
