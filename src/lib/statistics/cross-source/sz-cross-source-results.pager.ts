import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit, ViewChild, HostBinding } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue, isNotNull } from '../../common/utils';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatSampleSetPageChangeEvent } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatMenu } from '@angular/material/menu';
import { SzBoundType } from '@senzing/rest-api-client-ng';

/**
 * paging component for navigating through the sampling data table results.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-pager></sz-cross-source-pager>
 *
 */
@Component({
  selector: 'sz-cross-source-pager',
  templateUrl: './sz-cross-source-results.pager.html',
  styleUrls: ['./sz-cross-source-results.pager.scss']
})
export class SzCrossSourcePagingComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public loading: boolean = false;
    private _totalCount : number = 0;
    private _sampleCount : number | null = null;
    private _filteredCount : number | null = null;
    private _pageSize : number = 50;
    
    private _firstRecord : number = 0;
    private _lastRecord : number = 0;

    private _afterPageCount: number = 0;
    private _beforePageCount: number = 0;
    private _maximumValue: string | number;
    private _minimumValue: string | number;
    private _pageMaximumValue: string | number;
    private _pageMinimumValue: string | number;
    private _pageItemCount: number = 0;

    private _pageSizeOptions : number[] = [ 10, 25, 50, 75, 100 ];
    private _filters : {key: string, value: string, disabled?: boolean}[] = [];
    private _filterKeys : string[];
    private _filterValuesByKey : {[key: string]: string[]} = {};
    private _disabledFilters : {key: string, value: string}[] = [];
    private _sampleClickable : boolean = false;

    @Output("sampleClicked")
    public sampleClicked : EventEmitter<boolean> = new EventEmitter<boolean>();
  
    @ViewChild("pageField")
    private pageField: ElementRef;
  
    @ViewChild("pageSizeField")
    private pageSizeField: MatSelect;
  
    @ViewChild("filterMenu")
    public filterMenu: MatMenu;

    @HostBinding("class.loading") get isLoading() {
      return this.loading;
    }

    public get sampled() : boolean {
        return (this.sampleCount !== null && this.sampleCount !== undefined
                && this.sampleCount < (this.filtered ? this.filteredCount : this.totalCount));
    }
    
    public get filtered() : boolean {
      return isNotNull(this.dataMartService.sampleSetMatchKey);
    }
    
    public get sampleCount() : number | null {
        return this._sampleCount;
    }
    
    public get totalCount() : number {
        return this._totalCount;
    }
    
    public get filteredCount() : number {
        return this._filteredCount;
    }

    public get unFilteredCount() : number {
        let retVal  = 0;
        if(this.dataMartService && this.dataMartService.sampleSetUnfilteredCount) {
          retVal = this.dataMartService.sampleSetUnfilteredCount;
        }
        return retVal;
    }

    public get sampleSetUnfilteredCount() {
      return this.dataMartService.sampleSetUnfilteredCount;
    }
    
    public get availableCount() : number {
        if (this.sampled) {
          return this.sampleCount;
        }
        if( this.isFiltered) {
          //return this.unFilteredCount;
        }
        return this.totalCount;
    }
    
    _editingPage: boolean = false;
    _preEditPage: number | undefined = undefined;
    _editingPageSize: boolean = false;
    _preEditPageSize: number | undefined = undefined;
    
    public get editingPage() : boolean {
        return this._editingPage;
    }
    
    public set editingPage(editing: boolean) {
        if (editing == true) {
          this._preEditPage = this.page;
        }
        this._editingPage = editing;
        if (editing) {
          setTimeout(() => {
            this.pageField.nativeElement.focus();
            this.pageField.nativeElement.value = "" + this.page;
          }, 100);
        }
    }
    
    public get editingPageSize() : boolean {
        return this._editingPageSize;
    }
    
    public set editingPageSize(editing: boolean) {
        if (editing == true) {
          this._preEditPageSize = this.pageSize;
        }
        this._editingPageSize = editing;
        if (editing) {
          setTimeout(() => {
            this.pageSizeField.value = this.pageSize;
            this.pageSizeField.focus();
            this.pageSizeField.open();
          }, 100);
        }
    }
    
    
    public get pageSizeOptions() : number[] {
        return this._pageSizeOptions.slice(0);
    }
    
    @Input("pageSizeOptions")
    public set pageSizeOptions(options: number[]) {
        if ((typeof options) === "string") {
          let tokens = ("" + options).trim().split(",");
          this._pageSizeOptions = [];
          tokens.forEach(t => {
            let count = Number(t.trim());
            if (!isNaN(count)) {
              this._pageSizeOptions.push(count);
            }
          });
        } else {
          this._pageSizeOptions = options;
        }
    }
    
    @Input("sampleCount")
    public set sampleCount(count: number) {
        this._sampleCount = count;
    }
    
    @Input("totalCount")
    public set totalCount(count: number) {
        this._totalCount = count;
    }
    
    @Input("filteredCount")
    public set filteredCount(count: number) {
        this._filteredCount = count;
    }
    
    /*public get filters() : {key: string, value: string, disabled?: boolean}[] {
        return this._filters;
    }*/
    
    /*
    @Input("filters")
    public set filters(filters:  {key: string, value: string, disabled?: boolean}[]) {
        this._filters = filters.slice();
        this._disabledFilters = [];
        this._filterKeys = [];
        this._filterValuesByKey = {};
        this._filters.forEach(f => {
          if (f.disabled) {
            this._disabledFilters.push(f);
          }
          let values = this._filterValuesByKey[f.key];
          if (!values) {
            values = [];
            this._filterValuesByKey[f.key] = values;
            this._filterKeys.push(f.key);
          }
          values.push(f.value);
        });
    }
    */
  public get filters() {
    let retVal = [];
    if(this.dataMartService) {
      if(isNotNull(this.dataMartService.sampleSetMatchKey)){
        retVal.push({key: 'matchKey', name: 'Match Key', value: this.dataMartService.sampleSetMatchKey});
      }
      if(isNotNull(this.dataMartService.sampleSetPrinciple)){
        retVal.push({key: 'principle', name: 'Principle', value: this.dataMartService.sampleSetPrinciple});
      }
    }
    return retVal;
  }

    public get isFiltered(): boolean {
      let retVal = false;
      if(this.dataMartService) {
        if(isNotNull(this.dataMartService.sampleSetMatchKey)) {
          retVal = true;
        }
        if(isNotNull(this.dataMartService.sampleSetPrinciple)) {
          retVal = true;
        }
      }
      return retVal
    }
    
    public clearFilters(key: string | undefined | null = undefined,
                          value : string | undefined | null = undefined)
    {
      console.log(`clearFilters(${key}, ${value})`);
      if(key === 'matchKey') {
        let _oVal = this.dataMartService.sampleSetMatchKey;
        this.dataMartService.sampleSetMatchKey = undefined;
        console.log(`\tcleared sampleSetMatchKey: ${this.dataMartService.sampleSetMatchKey} | "${_oVal}"`);
      }
      if(key === 'principle') {
        this.dataMartService.sampleSetPrinciple = undefined;
        console.log(`\tcleared sampleSetPrinciple: ${this.dataMartService.sampleSetPrinciple}`);
      }
    }
    
    public get pageSize() : number {
        return this._pageSize;
    }
    
    @Input("pageSize")
    public set pageSize(size: number) {
        if (this._pageSize === size) return;
        /*
        this._pageSize = size;
    
        let pageNumber = Math.ceil(this._firstRecord / size);
    
        if (pageNumber < 1) pageNumber = 1;
        if (pageNumber > this.pageCount) pageNumber = this.pageCount;
    
        this._firstRecord = ((pageNumber - 1) * this.pageSize) + 1;
        if (this._firstRecord < 1) {
          this._firstRecord = 1;
        }
    
        this._lastRecord = this._firstRecord + this.pageSize -1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }
        if (this._lastRecord < 1) {
          this._lastRecord = 1;
        }
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });
        */
      this.dataMartService.sampleSetPageSize = size;
    }
    
    public onSampleClicked(event: MouseEvent) {
        this.sampleClicked.emit(this.sampled);
    }
    
    public get firstRecord() : number {
        return this.availableCount === 0 ? 0 : this._firstRecord;
    }
    
    @Input("firstRecord")
    public set firstRecord(recordNumber: number) {
        this._firstRecord = recordNumber;
    }
    
    public get lastRecord() : number {
        return this.availableCount === 0 ? 0 : this._lastRecord;
    }
    
    @Input("lastRecord")
    public set lastRecord(recordNumber: number) {
        this._lastRecord = recordNumber;
    }
    
    @Output("page-change") selectedPage: EventEmitter<{from: number, to: number, page: number, pageSize: number}>
        = new EventEmitter<{from: number, to:number, page: number, pageSize: number}>();
    
    public get isFirstPage() : boolean {
        return this.firstRecord <= 1;
    }
    
    public get hasPreviousPage() : boolean {
        return this.firstRecord > 1;
    }
    
    public get hasNextPage() : boolean {
        return this.lastRecord < this.availableCount;
    }
    
    public get isLastPage() : boolean {
        let max = this.availableCount;
        if (max < 1) max = 0;
        let result = (this.lastRecord >= max);
        return result;
    }
    
    public get page() : number {
        return Math.ceil(this.firstRecord / this.pageSize);
    }
    
    public handlePageEditBlur(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.editingPage) return;
        const target : HTMLInputElement = <HTMLInputElement> event.target;
        const page = (!target.value && target.value.length === 0)
                     ? 1 : Number(target.value);
        this.page = page;
        this.editingPage = false;
    }
    
    public handlePageEditKeyUp(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.editingPage) return;
        const target : HTMLInputElement = <HTMLInputElement> event.target;
        const page = (!target.value && target.value.length === 0)
                     ? 1 : Number(target.value);
        if (event.keyCode === 13) {
          this.editingPage = false;
          this.page = page;
        } else if (event.keyCode === 27) {
          if (this._preEditPage !== undefined) {
            this.page = <number> this._preEditPage;
          }
          this.editingPage = false;
        }
    }
    
    public handlePageSizeEditBlur(event: Event) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        if (!this.editingPageSize) return;
        this.pageSize = this.pageSizeField.value;
        this.editingPageSize = false;
    }
    
    public handlePageSizeEditChange(event: MatSelectChange) {
        //if (event.preventDefault) event.preventDefault();
        //if (event.stopPropagation) event.stopPropagation();
        if (!this.editingPageSize) return;

        this.pageSize = this.pageSizeField.value;
        this.editingPageSize = false;
    }
    
    public handlePageSizeEditKeyUp(event: KeyboardEvent) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        if (!this.editingPageSize) return;
        const target : HTMLInputElement = <HTMLInputElement> event.target;
        const page = (!target.value && target.value.length === 0)
                     ? 1 : Number(target.value);
        if (event.keyCode === 13) {
          this.pageSize = this.pageSizeField.value;
          this.editingPageSize = false;
        } else if (event.keyCode === 27) {
          if (this._preEditPageSize !== undefined) {
            this.pageSize = <number> this._preEditPageSize;
          }
          this.editingPageSize = false;
        }
    }
    
    @Input("page")
    public set page(pageNumber : number) {
        if (pageNumber === this.page) return;
    
        if (pageNumber < 1) pageNumber = 1;
        if (pageNumber > this.pageCount) pageNumber = this.pageCount;
    
        this._firstRecord = ((pageNumber - 1) * this.pageSize) + 1;
        if (this._firstRecord < 1) {
          this._firstRecord = 1;
        }
    
        this._lastRecord = this._firstRecord + this.pageSize -1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }
        if (this._lastRecord < 1) {
          this._lastRecord = 1;
        }
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });
    }
    
    public get pageIndex() : number {
        return this.page - 1;
    }
    
    public get pageCount() : number {
        return Math.ceil(this.availableCount / this.pageSize);
    }
    
    public get pageDigits() : number {
        return Math.ceil(Math.log(this.pageCount) / Math.log(10));
    }
    
    public goFirstPage() {
      //if(this._minimumValue) {
        this.dataMartService.sampleSetBound      = undefined;
      //}
        /*this._firstRecord = 1;
        this._lastRecord = this._firstRecord + this.pageSize - 1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }
        if (this._lastRecord < 0) {
          this._lastRecord = 0;
        }
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });*/
    }
    public goLastPage() {
      //if(this._maximumValue) {
        //this.dataMartService.sampleSetBoundType   = SzBoundType.INCLUSIVEUPPER;
        this.dataMartService.sampleSetBound       = 'max';
        // figure out what the pageSize of the last page should be. use "totalCount % pageSize"
        //this.dataMartService.sampleSetPageSize    =  this._totalCount % this.dataMartService.sampleSetPageSize;
        console.log(`goLastPage: `, this.dataMartService.sampleSetPageSize, this._totalCount, this._totalCount % this.dataMartService.sampleSetPageSize);
        //this.dataMartService.sampleSetBound     = this._maximumValue as string;
      //}
    }

    
    
    public goPreviousPage() {
        this._firstRecord -= this.pageSize;
        if (this._firstRecord < 1) {
          this._firstRecord = 1;
        }
    
        this._lastRecord = this._firstRecord + this.pageSize - 1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }
        if (this._lastRecord < 1) {
          this._lastRecord = 1;
        }
        // sample page indexes are "0" based
        // and since we now have the next page value held internally
        // we just need to tell the datamart to grab the current page we're
        // on that we dont have data for yet.
        console.log(`goPreviousPage: pageIndex = ${this.pageIndex}`);
        this.dataMartService.sampleSetBoundType  = this.pageIndex > 0 ? SzBoundType.EXCLUSIVELOWER : SzBoundType.INCLUSIVELOWER;
        this.dataMartService.sampleSetPage = this.pageIndex;

        /*this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });*/
    }
    
    public goNextPage() {
        if ((this._firstRecord + this.pageSize) > this.totalCount) return;
        this._firstRecord += this.pageSize;
        this._lastRecord = this._firstRecord + this.pageSize - 1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }

        // sample page indexes are "0" based
        // and since we now have the next page value held internally
        // we just need to tell the datamart to grab the current page we're
        // on that we dont have data for yet.
        console.log(`goNextPage: pageIndex = ${this.pageIndex}`);
        this.dataMartService.sampleSetBoundType  = this.pageIndex > 0 ? SzBoundType.EXCLUSIVELOWER : SzBoundType.INCLUSIVELOWER;
        this.dataMartService.sampleSetPage = this.pageIndex;

        /*this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });*/
    }
    
    /*public goLastPage() {
        this._firstRecord = ((this.pageCount - 1) * this.pageSize) + 1;
        if (this._firstRecord < 1) {
          this._firstRecord = 1;
        }
    
        this._lastRecord = this.availableCount;
        if (this._lastRecord < 1) {
          this._lastRecord = 1;
        }
    
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });
    }*/
    
    public get sampleClickable() : boolean {
        return this._sampleClickable;
    }
    
  ngOnInit() {
    this._sampleClickable = (this.sampleClicked.observers.length > 0);

    // listen for sampleset page changes
    this.dataMartService.onSamplePageChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(this.onDataMartSamplePageChange.bind(this));
    
    // listing for loading
    this.dataMartService.onSampleRequest.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((loading) => {
      console.log(`SzCrossSourcePagingComponent.onSampleRequest: ${loading}`);
      this.loading = loading;
    })
  }

  private onDataMartSamplePageChange(event: SzStatSampleSetPageChangeEvent) {
    console.info(`onDataMartSamplePageChange: `, event);
    
    this._totalCount        = event.totalCount;
    this._afterPageCount    = event.afterPageCount;
    this._beforePageCount   = event.beforePageCount;
    if(event && event.bound !== 'max' && event.bound !== 'max:max') {
      // for the very last page we can't pull the pagesize from that page because it may be 
      // less than the actual page size preference
      this._pageSize          = event.pageSize;
    }
    this._maximumValue      = event.maximumValue;
    this._minimumValue      = event.minimumValue;
    this._pageMaximumValue  = event.pageMaximumValue;
    this._pageMinimumValue  = event.pageMinimumValue;
    this._pageItemCount     = event.pageItemCount;

    // calc the page item spread
    this._firstRecord       = this._beforePageCount === 0 ? 1 : this._beforePageCount + (this._pageItemCount > 0 ? 1 : 0);
    this._lastRecord        = this._beforePageCount + this._pageItemCount;

    //this._firstRecord       = this._beforePageCount === 0 ? 1 : (this._beforePageCount * this.pageSize);
    //this._lastRecord        = this._beforePageCount === 0 ?  this._pageItemCount : this._firstRecord + this._pageItemCount;
  }
    
  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private cssService: SzCSSClassService,
    private dataMartService: SzDataMartService
  ) {}
  /**
  * unsubscribe when component is destroyed
  */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}