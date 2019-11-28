import { SzEntitySearchParams } from './entity-search';

export abstract class SzFolioItem {
  abstract name: string;
  abstract _data;
  public get data () {
    return this._data;
  }
  public set data (value: any) {
    this._data = value;
  }
}

export abstract class SzFolio {
  abstract items: SzFolioItem[];
  public name: string;

  public add( item: SzFolioItem ) {
    this.items.push( item );
  }
  // TODO: handle overloads
  public remove( item ) {

  }
}


export class SzSearchParamsFolioItem extends SzFolioItem {
  _data: SzEntitySearchParams;
  name: string;

  constructor(name: string, data: SzEntitySearchParams) {
    super(); // must call super()

    this.data = data;
    this.name = name;
  }
}

export class SzSearchParamsFolio extends SzFolio {
  items: SzSearchParamsFolioItem[];
  name: string;

  constructor(name: string, items?: SzSearchParamsFolioItem[]) {
    super(); // must call super()

    if (items) { this.items = items; }
    this.name = name;
  }
}
