import { Component, HostBinding, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';

export interface SzDataTableCellEvent {
  "key": string,
  "value": any,
  "event"?: MouseEvent
}

/**
 * Embeddable Data Table Component
 * used to display a collection of entities in a spreadsheet format.
 *
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-data-table
          [data]="dataJSON"
          [columns]="col1,col2,col3"
      ></sz-data-table>
 *
 */
@Component({
  selector: 'sz-data-table',
  templateUrl: './sz-data-table.component.html',
  styleUrls: ['./sz-data-table.component.scss']
})
export class SzDataTable implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _data: any[];
  private _cellContentSizes = new Map<HTMLElement, number[]>();
  private _cols: Map<string,string>;
  /** controlling the column order is easier to do as a map since were just using those in css */
  private _colOrder: Map<string,number>;
  private _expandedCells = new Map<string, Map<HTMLElement, number>>();
  private _selectableColumns: string[];
  private _selectedColumns: Map<string,string>;
  private _fieldOrder: string[];
  private _columnResizing     = false;
  private _columnBeingResized: HTMLElement;
  private _colSizes: Map<string,string> = new Map<string, string>();
  private _sortBy: string;
  private _sortDirection: 'DESC' | 'ASC' = 'ASC';
  private _sortOrder: Map<number, number> = new Map<number, number>();
  private _hiddenColumns: string[] = [];
  
  /** name of field in data to be used as the primary key 
   * for storing reverse lookups, row state etc.
   * @required
  */
  @Input()
  get primaryKey() {
    throw new Error('Attribute "primaryKey" is required');
  }
  set primaryKey(value: string){
    let overwriteProperty = true;
    // any time we change this we should check to make sure that it is valid
    if(this._cols && this._cols.size > 0) {
      // check to see if field is in the columns list
      overwriteProperty = this._cols.has(value);
    } else if(this._data && this._data.length > 0) {
      /** 
       * @TODO check to see if field is in the columns list
       **/
    }

    // passed sanity checks
    if(overwriteProperty) {
      // overwrite default value that throws with value supplied
      Object.defineProperty(this, 'primaryKey', {
        value,
        writable: true,
        configurable: true,
      });
    }
  }

  // adds attribute to tag itself
  @HostBinding('attr.sz-data-table')  readOnly = '';

  @Input()
  set data(value: any[]){
    this._data = value;
    // if cols aren't defined just grab everything from the data
    if(!this._cols && this._data && this._data.length > 0 && this._data[0]) {
        this._cols = this.getFieldNamesFromData(this._data);
        if(!this._colOrder){ 
          let _cOrder = this.getColumnOrderFromData(this._data);
          this._colOrder  = _cOrder;
          console.log('set column order: ', _cOrder);
        }
    }
    if(!this._selectedColumns || this._selectedColumns && this._selectedColumns.size < 1) {
      // select all by default
      this._selectedColumns = new Map<string, string>(this._cols);
    }
    // reset these so we can get valid values
    this._cellContentSizes = new Map<HTMLElement, number[]>();
  }
  get data() {
    return this._data;
  }
  @Input()
  set columns(value: string[] |  string){
    if((value as string[]).length === 1){
      this._selectableColumns = [(value as string[])[0]];
    } else if((value as string[]).length > 1){
      this._selectableColumns = (value as string[]);
    } else if((value as string).indexOf(',') > -1){
      // string as 'field1,field2'
      let _v = (value as string).trim().split(',').map((_f)=>{
        return _f.trim();
      }).filter((_fv)=>{
        return _fv !== null && _fv !== '';
      });
      this._selectableColumns = _v;
    } else if((value as string).trim().length > 0){
      this._selectableColumns = [(value as string)];
    }
  }
  get selectableColumns(): Map<string,string> {
    let retVal = this._cols ? this._cols : new Map<string,string>();
    if(this._selectableColumns && this._selectableColumns.length > 0) {
      // only return columns in data AND in selectable list
      let _pear = new Map<string,string>(
        [...retVal]
        .filter(([k,v])=>{
          return this._selectableColumns.includes(k);
        }));
      if(_pear.size > 0){
        retVal = _pear;
      }
    }
    return retVal;
  }
  get selectedColumns(): Map<string,string> {
    let retVal = this._selectedColumns && this._selectedColumns.size > 0 ? this._selectedColumns : (this._cols ? this._cols : new Map<string,string>());
    return retVal;
  }
  /** return ordered columns in sorted by value */
  get orderedColumns(): Map<string, string> {
    let retVal = this._cols;
    if(this._colOrder) {
      //retVal = [...this._colOrder.entries()].sort((a, b) => b[1] - a[1]);
      retVal = new Map([...this._cols.entries()]
      .sort((a, b) => {
        return this._colOrder.get(a[0]) - this._colOrder.get(b[0]);
      }));
    }
    return retVal;
  }
  get gridStyle(): string {
    let retVal = '';
    if(this._cols && this._cols.size > 0) {
        // append default col values
        retVal += 'grid-template-columns:';
        let sortedCols = new Map([...this._selectedColumns.entries()]
        .sort((a, b) => {
          return this._colOrder.get(a[0]) - this._colOrder.get(b[0]);
        }));

        sortedCols.forEach((value, key)=>{
          let _colSize = this._colSizes && this._colSizes.has(key) ? this._colSizes.get(key) : '100px';
          retVal += ' minmax('+_colSize+',auto)';
        });
        retVal += '; ';
        /*this._cols.forEach((value, key)=>{
          let _colSize = this._colSizes && this._colSizes.has(key) ? this._colSizes.get(key) : '100px';
          retVal += ' minmax('+_colSize+',auto)';
        });
        retVal += '; ';*/
        /*retVal += 'grid-template-areas:';
        this._cols.forEach((value, key)=>{
          retVal += ' col-'+key+' drag-'+key;
        });
        retVal += ';';*/
    }
    /*if(this.data) {
      retVal += 'grid-template-rows: min-content';
      this.data.forEach((rowData, index)=>{
        // if row has expanded items, set row to tallest element
        // set height to that items ideal height
        retVal += ' 30px';
      });
    }*/
    //console.log(`grid style:`, retVal);
    return retVal;
  }
  @Output() cellClick: EventEmitter<SzDataTableCellEvent> = new EventEmitter<SzDataTableCellEvent>();

  get sortDirection(): 'DESC' | 'ASC' {
    return this._sortDirection;
  }
  get numberOfColumns() {
    return this._cols && this._cols.size > 0 ? this._cols.size : 0;
  }

  constructor() {}
  ngOnInit() {}
  ngAfterViewInit() {
    // we need to wait until we have data before trying to 
    // get the real sizes of inner content
    this.resetCellSizes();
  }
  //ngAfterContentInit

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getFieldNamesFromData(data): Map<string,string>{
    let retVal = new Map();
    
    this._data.forEach((drow) => {
        let fields = Object.keys(this._data[0]);
        if(fields && fields.length > 0){
            // the beauty of using a map is we don't have to care about whether or not value already exists
            fields.forEach((fName) => {
                retVal.set(fName, this.breakWordOnCamelCase(fName, true));
            })
        }
    });
    return retVal;
  }
  getColumnOrderFromData(data): Map<string,number> {
    let retVal = new Map();
    this._data.forEach((drow) => {
      let fields = Object.keys(this._data[0]);
      if(fields && fields.length > 0){
          // the beauty of using a map is we don't have to care about whether or not value already exists
          fields.forEach((fName, indy) => {
              retVal.set(fName, indy);
          })
      }
    });
    return retVal;
  }

  isColumnSelected(fieldName: string) {
    let retVal = this._selectedColumns && this._selectedColumns.size > 0 ? this._selectedColumns.has(fieldName) : false;
    return retVal;
  }

  selectColumn(fieldName: string, selected: boolean) {
    if(!this._selectedColumns || this._selectedColumns === undefined) {
      this._selectedColumns = new Map<string, string>();
    }
    console.log(`selectColumn(${fieldName}, ${selected})`, this._selectedColumns.get(fieldName), this._cols.get(fieldName));

    if(selected === true && ((this._selectedColumns && !this._selectedColumns.has(fieldName)))) {
      let _mKey = fieldName;
      let _mVal = this._cols.has(fieldName) ? this._cols.get(fieldName) : this.breakWordOnCamelCase(fieldName, true);
      this._selectedColumns.set(_mKey, _mVal);
    } else if(selected === false && this._selectedColumns.has(fieldName)) {
      this._selectedColumns.delete(fieldName);
    }
    console.log('updated selected columns: ', this._selectedColumns);
  }

  breakWordOnCamelCase(value: string, capitalize?: true): string {
    const humps = value.replace(/([a-z])([A-Z])/g, '$1 $2').split(" ")
    let retVal = "";

    humps.forEach(word => {
      retVal = capitalize ? (retVal + word.charAt(0).toUpperCase() + word.slice(1) + " ") : (retVal + word + " ");
    });
    return retVal;
  }

  columnStyle(fieldName: string): string {
    let retVal = '';
    if(this._colOrder && this._colOrder.has(fieldName)) {
      retVal += 'order: '+ this._colOrder.get(fieldName)+';';
    }
    return retVal;
  }
  cellStyle(fieldName: string, rowsPreceeding: number): string {
    let retVal = '';
    let rowOrderPrefix      = 0;
    let rowCellOrderOffset  = this.numberOfColumns * rowsPreceeding;
    if(this._colOrder && this._colOrder.has(fieldName)) {
      retVal += 'order: '+ (rowCellOrderOffset+this._colOrder.get(fieldName))+';';
    }
    return retVal;
  }
  cellClass(fieldName: string, prefix?: string, suffix?: string) {
    return (prefix !== undefined ? prefix+ '-' : '')+ underscoresToDashes(camelToKebabCase(fieldName)) + (suffix !== undefined ? '-' + suffix : '')
  }
  cellValue(value: unknown | unknown[], fieldName?: string) {
    let retVal = value;
    if(!retVal) { return retVal; }
    // get renderer for specific type
    if(Array.isArray(value) ) {
      retVal = value.join(', ');
    } else if (value.toString ) {
      retVal = value.toString();
    }
    // if [object Object] is in output something needs to be rendered better
    /*if(fieldName === 'featureDetails') {
      console.warn(`${fieldName} type: `, 
      (retVal as string).indexOf('object Object'), 
      (value as unknown).constructor === Object,
      Object.prototype.toString.call(value) === "[object Object]");
    }*/
    if(retVal && (retVal as string).indexOf('object Object') > -1) {
      // is json, check if array of object
      if(retVal && (retVal as string).indexOf('[object Object]') > -1) {
        // array of objects
        if(fieldName === 'features') {
          //console.log(`features('${(retVal as string)}'): `,);
        }
        let retStr = [];
        if((value as unknown[]).forEach) {
          (value as unknown[]).forEach((_v)=>{
            // is value an object?
            if(JSON.stringify(_v, null, 4).indexOf('{') > -1) {
              // iterate over each key
              for(const k in _v as object) {
                // if array of objects just traverse
                if(JSON.stringify((_v as object)[k], null, 4).indexOf('[object Object]') > -1 || Object.prototype.toString.call((_v as object)[k]) === "[object Array]"){
                  let _cVal = this.cellValue((_v as object)[k], k);
                  retStr.push('<div class="list">'+_cVal+'</div>');
                } else {
                  retStr.push('<label>'+this.breakWordOnCamelCase(k, true)+'</label>:'+ (_v as object)[k]+'');
                }
              }
            } else if(JSON.stringify(_v, null, 4).indexOf('[object Object]') > -1){
              // array of objects, we better just call this fn recursively
              retStr.push(this.cellValue(_v, fieldName));
            } else {
              // not object
              retStr.push(value.toString());
            }
          });
        } else if((value as unknown).constructor && (value as unknown).constructor === Object) {
          //if(fieldName === 'features'){
            //console.log(`features('${(retVal as string)}'): `,retStr);
            Object.keys(value).forEach((_oKey)=> {
              let _oVal = this.cellValue(value[_oKey], _oKey);
              retStr.push('<label>'+this.breakWordOnCamelCase(_oKey, true)+'</label>:'+ _oVal);
            })
          //}
        } else if(fieldName === 'features') {
          console.warn('features type: ', (value as unknown).constructor);
        }
        retVal = retStr && retStr.length > 1 ? '<div>'+retStr.join('</div><div>')+'</div>' : retStr.length === 1 ? retStr[1] : retVal;
      } else {
        // assume json structure
        retVal = JSON.stringify(value, null, 4);
      }
    }
    return retVal;
  }
  columnOrder(fieldName: string): number {
    let retVal = 0;
    if(this._colOrder){
      if(!this._colOrder.has(fieldName)) {
        console.warn(`could not find "${fieldName}" in `,this._colOrder);
      }
      retVal = this._colOrder.get(fieldName)
    }
    return retVal;
  }

  moveColumn(fieldName: string, orderModifier: number) {
    let currentIndex    = this._colOrder.get(fieldName);
    let newIndex        = currentIndex + orderModifier;
    let shiftLeft       = orderModifier === -1;
    let shiftRight      = orderModifier === +1;

    if(shiftLeft || shiftRight) {
      // simple swap operation
      // swap new position with current one
      let _k            = getMapKeyByValue(this._colOrder, newIndex);
      this._colOrder.set(_k, currentIndex);
      this._colOrder.set(fieldName, newIndex);
    //} else if(shiftRight) {
      // swap 
    } else {
      // were probably jumping more than one item
      if(newIndex === 0) {
        // insert at front
        let newOrderMap = new Map<string, number>()
        console.log('insert at front');
        this._colOrder.set(fieldName, newIndex);
        this._colOrder.forEach((value, key)=>{
          if(key !== fieldName) {
            if(value > currentIndex) {
              // decrement
              this._colOrder.set(key, value-1);
            } else {
              // increment
              this._colOrder.set(key, value+1);
            }
          }
        });
      }
      // insert at new position, then every item 
      // > (lowest new || old) old position && < new position needs to decrement
    }
    console.log(`reordered columns: `, this.orderedColumns, this._colOrder);
  }

  copyCellContent(cell: HTMLElement, json?: any) {
    console.log(`copy cell content: `, cell);
    if(typeof ClipboardItem === "undefined") {
      console.warn('copy to clipboard is not available');
      return;
    }
    if(cell) {
      // get content
      let contentNodes = cell.getElementsByClassName('cell-content');
      let contentNode  = contentNodes.length > 0 ? contentNodes.item(0) : undefined;
      if(contentNode) {
        const content = json ? JSON.stringify(json, undefined, 4) : contentNode.innerHTML;
        navigator.clipboard.writeText(content).then( (r) => {
          (contentNode as HTMLElement).style.opacity = '0.4';
          console.log('wrote to clipboard: ', contentNode, content);
          setTimeout(() => {
            (contentNode as HTMLElement).style.opacity = '1';
          }, 80);
        }, () => {
            // Fallback in case the copy did not work
            alert('could not copy');
        });
      }
    }
  }
  copyRowContent(row: HTMLElement, json: any) {
    console.log(`copy row content: `, row, json);
    if(typeof ClipboardItem === "undefined") {
      console.warn('copy to clipboard is not available');
      return;
    }
    if(row) {
      // get content
        const content = JSON.stringify(json, undefined, 4);
        navigator.clipboard.writeText(content).then( (r) => {
          (row as HTMLElement).style.opacity = '0.4';
          console.log('wrote to clipboard: ', content);
          setTimeout(() => {
            (row as HTMLElement).style.opacity = '1';
          }, 80);
        }, () => {
            // Fallback in case the copy did not work
            alert('could not copy');
        });
    }
  }
  minimizeCol(col: {value: string, key: string}) {
    console.log(`minimize column: `, col);
  }

  isColumnVisible(fieldName: string) {
    return this._selectedColumns && this._selectedColumns.has(fieldName) ? true : false;
  }

  isColumnHidden(fieldName: string) {
    return !this.isColumnVisible(fieldName);
  }

  isSortedBy(fieldName: string) {
    return this._sortBy !== undefined && this._sortBy === fieldName;
  }
  
  sortBy(fieldName: string, sortDirection: 'DESC' | 'ASC') {
    this._sortBy          = fieldName;
    this._sortDirection   = sortDirection;
  }
  onColMouseDown(fieldName: string, event: MouseEvent) {
    // listen for mousemove
    this._columnResizing      = true;
    this._columnBeingResized  = event.target as HTMLElement;
  }
  onResizeMouseDown(fieldName: string, event: MouseEvent) {
    // listen for mousemove
    this._columnResizing        = true;
    let srcEle                  = event.target as HTMLElement;
    this._columnBeingResized    = (srcEle.classList.contains('handle-resize')) ? srcEle.parentElement : srcEle;
    console.log(`handle mdown: `, this._columnBeingResized);
  }
  onResizeMouseUp(fieldName: string, event: MouseEvent) { 
    // stop listening for mousemove
    this._columnResizing      = false;
    this._columnBeingResized  = undefined;
  }
  onColMouseUp(fieldName: string, event: MouseEvent) {
    // stop listening for mousemove
    this._columnResizing      = false;
    this._columnBeingResized  = undefined;
    // grab "width" of element and feed that in to the value(s) for "grid-template-columns" property
    /*let colCell   = this._columnBeingResized ? this._columnBeingResized : event.target as HTMLElement;
    let colWidth  = colCell.style.width;
    console.log(`set column size: "${colWidth}"`, colCell);
    console.log(`grid style: `, this.gridStyle);*/
  }
  onColMouseMove(fieldName: string, event: MouseEvent) {
    return;
    if(this._columnResizing) {
      // grab "width" of element and feed that in to the value(s) for "grid-template-columns" property
      let colCell   = this._columnBeingResized ? this._columnBeingResized : event.target as HTMLElement;
      let colWidth  = colCell.style.width;
      if(parseInt(colWidth) < 100) {
        colWidth = '100px';
        colCell.style.width = colWidth;
      }
      this._colSizes.set(fieldName, colWidth);
    }
  }
  onHeaderMouseMove(event: MouseEvent) {
    if(this._columnResizing && this._columnBeingResized) {
      // get the left/right offset
      let cellOffset  = this._columnBeingResized.offsetLeft;
      // get mouse left/right offset
      let mouseX    = event.pageX;
      let colWidth  = mouseX - cellOffset;
      if(this._columnBeingResized) {
        // get field name attribute
        let colName = this._columnBeingResized.getAttribute('data-field-name');
        if(colName) {
          //this._columnBeingResized.style.width = colWidth+'px';
          this._colSizes.set(colName, colWidth+'px');
        }
        //console.log(`resize "${colName}": ${colWidth}  ${cellOffset}/${mouseX}`);
      }
    }
    return;
    if(this._columnResizing && this._columnBeingResized) {
      // set width for column
      console.log(`resize`, this._columnBeingResized);
    }
  }
  getRowOrderFromData(data): Map<string,number> {
    let retVal = new Map<string, number>();

    return retVal;
  }
  hasExpandedCells(rowRef?: HTMLElement) {
    return false;
  }
  onCellClick(cellName: string, data: any, event?: MouseEvent, element?: HTMLElement) { 
    console.log(`on${cellName}Click: `, event, data);
    this.cellClick.emit({key: cellName, value: data});
    if(element) {
      //console.log('element: ', element, element.offsetHeight, element.scrollHeight);
    }
  }
  resetCellSizes() {
    this._cellContentSizes = new Map<HTMLElement, number[]>();
  }
  getCellSizes(element?: HTMLElement) {
    if(element){
      console.log(`cell size: `, this._cellContentSizes.get(element));
    } else {
      console.log(`cell sizes: `, this._cellContentSizes);
    }
  }
  getContentHeight(element: HTMLElement) {
    return element ? element.scrollHeight : undefined;
  }
  getCellHeight(element: HTMLElement) {
    return element ? element.offsetHeight : undefined;
  }
  getCachedContentHeight(element: HTMLElement) {
    // get from map
    let retVal;
    if(element && this._cellContentSizes.has(element)){
      return this._cellContentSizes.get(element)[1];
    }
    return retVal;
  }
  isCellTruncated(element: HTMLElement) {
    return element ? (element && (element.offsetHeight+5) < element.scrollHeight) : false;
  }
  isCellExpandable(element: HTMLElement) {
    let _sizes = [];
    if(this._cellContentSizes.has(element)) {
      // grab previous values
      // we do this to avoid calculating whether or not
      // something is collapseable after being expanded
      _sizes = this._cellContentSizes.get(element);

    } else if(element) {
      _sizes = [element.offsetHeight+5, element.scrollHeight];
      this._cellContentSizes.set(element, _sizes);
    }
    if(element) { 
      // always grab the scroll height off live
      _sizes[1] = element.scrollHeight;
    }
    if(_sizes && _sizes.length > 0) {
      return _sizes[0] < _sizes[1];
    }
    return false;
  }
  toggleCellExpansion(element: HTMLElement, rowId?: number) {
    if(element && element.hasAttribute && element.hasAttribute('data-row-index')) {
      let rowId               = element.getAttribute('data-row-index');
      let rowHasExpadedCells  = (this._expandedCells.has(rowId));
      if(!rowHasExpadedCells) {
        // easy-peasy, just add
        this._expandedCells.set(rowId, new Map([[element, 0]]));
      } else {
        // check to see if cell exists
        let cellAlreadyExists = this._expandedCells.get(rowId).has(element);
        if(cellAlreadyExists) {
          // expanded, remove it
          this._expandedCells.get(rowId).delete(element);
          console.log(`removed element from expanded `, element, this._expandedCells.get(rowId));
        } else {
          // expand
          this._expandedCells.set(rowId, this._expandedCells.get(rowId).set(element, 0));
          console.log('added element to expanded ', element, this._expandedCells.get(rowId));
          console.log(`is cell expanded? `, this.isCellExpanded(element));
        }
      }
    }
    /*
    if(this._expandedCells.has(rowId)) {
      this._expandedCells.delete(element);
    } else {
      this._expandedCells.set(element, true);
      // set all cells in row to a min-height of this cell
      if(this._rowMinimumHeights.has(rId)) {
        if(this._rowMinimumHeights.get(rId) < element.scrollHeight) {
          this._rowMinimumHeights.set(rId, element.scrollHeight);
        }
      }
      this._rowMinimumHeights.set(rId, element.scrollHeight)
    }*/
  }
  public getRowId(data, index) {
    // if reverse lookup map check that first 

    // if it's not in there use the index
    return index;
  }
  plus(value){ return value+1;}
  isCellExpanded(element: HTMLElement, debug?: boolean) {
    if(element && element.hasAttribute && element.hasAttribute('data-row-index')) {
      let rowId = element.getAttribute('data-row-index');
      let retVal = this._expandedCells.has(rowId) && this._expandedCells.get(rowId).has(element);
      return retVal;
    } else {
      if(debug) {
        console.warn('could not find row id on element, ', element.hasAttribute('data-row-index'), element);
      }
    }
    return false;
  }
}