import { Component, Input, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
export class SzDataTable implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _data: any[];
  private _cols: Map<string,string>;
  /** controlling the column order is easier to do as a map since were just using those in css */
  private _colOrder: Map<string,number>;
  private _fieldOrder: string[];
  private _sortBy: string;
  private _columnResizing     = false;
  private _columnBeingResized: HTMLElement;
  private _colSizes: Map<string,string> = new Map<string, string>();
  private _sortOrder: 'DESC' | 'ASC' = 'ASC';

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
  }
  get data() {
    return this._data;
  }
  get cols() {
    let retVal = this._cols ? this._cols : [];
    return retVal;
  }
  get gridStyle(): string {
    let retVal = '';
    if(this._cols && this._cols.size > 0) {
        // append default col values
        retVal += 'grid-template-columns:';
        this._cols.forEach((value, key)=>{
          let _colSize = this._colSizes && this._colSizes.has(key) ? this._colSizes.get(key) : '100px';
          retVal += ' minmax('+_colSize+',auto)';
        });
        retVal += '; ';
        /*retVal += 'grid-template-areas:';
        this._cols.forEach((value, key)=>{
          retVal += ' col-'+key+' drag-'+key;
        });
        retVal += ';';*/
    }
    //console.log(`grid style:`, retVal);
    return retVal;
  }
  get sortOrder(): 'DESC' | 'ASC' {
    return this._sortOrder;
  }
  get numberOfColumns() {
    return this._cols && this._cols.size > 0 ? this._cols.size : 0;
  }

  constructor() {}
  ngOnInit() {}
  ngAfterViewInit() {}

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
                retVal.set(fName, this.breakWordOnCamelCase(fName));
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

  breakWordOnCamelCase(value: string): string {
    const humps = value.replace(/([a-z])([A-Z])/g, '$1 $2').split(" ")
    let retVal = "";

    humps.forEach(word => {    
        retVal = retVal + word.charAt(0).toUpperCase() + word.slice(1) + " "
    });
    return retVal;
  }

  columnStyle(fieldName: string): string {
    let retVal = 'border: 1px solid #666;';
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

  isSortedBy(fieldName: string) {
    return this._sortBy !== undefined && this._sortBy === fieldName;
  }
  sortBy(fieldName: string, sortOrder: 'DESC' | 'ASC') {
    this._sortBy    = fieldName;
    this._sortOrder = sortOrder;
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
        console.log(`resize "${colName}": ${colWidth}  ${cellOffset}/${mouseX}`);
      }
    }
    return;
    if(this._columnResizing && this._columnBeingResized) {
      // set width for column
      console.log(`resize`, this._columnBeingResized);
    }
  }
}