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
  private _colOrder: string[];
  private _fieldOrder: string[];

  @Input()
  set data(value: any[]){
    this._data = value;
    // if cols aren't defined just grab everything from the data
    if(!this._cols && this._data && this._data.length > 0 && this._data[0]) {
        this._cols = this.getFieldNamesFromData(this._data);
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
        this._cols.forEach((values, keys)=>{
            retVal += ' minmax(100px,auto)'
        });
        retVal += ';';
    }
    return retVal;
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

  breakWordOnCamelCase(value: string): string {
    const humps = value.replace(/([a-z])([A-Z])/g, '$1 $2').split(" ")
    let retVal = "";

    humps.forEach(word => {    
        retVal = retVal + word.charAt(0).toUpperCase() + word.slice(1) + " "
    });
    return retVal;
  }
}