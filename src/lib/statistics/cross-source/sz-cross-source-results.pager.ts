import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit, ViewChild } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';
import { SzCrossSourceSummary, SzDataSourcesResponseData, SzSummaryStats } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatMenu } from '@angular/material/menu';

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
    private _totalCount : number = 0;
    private _sampleCount : number | null = null;
    private _filteredCount : number | null = null;
    private _pageSize : number = 50;
    private _firstRecord : number = 0;
    private _lastRecord : number = 0;
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

    public get sampled() : boolean {
        return (this.sampleCount !== null && this.sampleCount !== undefined
                && this.sampleCount < (this.filtered ? this.filteredCount : this.totalCount));
    }
    
    public get filtered() : boolean {
        return (this.filteredCount !== null && this.filteredCount !== undefined
                && this.filteredCount <= this.totalCount);
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
    
    public get availableCount() : number {
        if (this.sampled) {
          return this.sampleCount;
        }
        if (this.filtered) {
          return this.filteredCount;
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
    
    public get filters() : {key: string, value: string, disabled?: boolean}[] {
        return this._filters;
    }
    
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
    
    public isFilterDisabled(key: string, value: string) {
        return this._disabledFilters.some(f => (f.key === key && f.value === value));
    }
    
    public get filterKeys(): string[] {
        return this._filterKeys;
    }
    
    public getFiltersByKey(key: string) : string[] {
        const result = this._filterValuesByKey[key];
        if (!result) return [];
        return result;
    }
    
    public clearFilters(key: string | undefined | null = undefined,
                          value : string | undefined | null = undefined)
    {
        let filtersToClear;
        if (!key && !value) {
          filtersToClear = this.filters;
    
        } else if (!value) {
          filtersToClear = this.filters.filter(f => f.key === key);
    
        } else {
          filtersToClear = this.filters.filter(f => f.key === key && f.value === value);
    
        }
        if (filtersToClear && filtersToClear.length > 0) {
          this.clearFiltersEmitter.emit(filtersToClear);
    
        }
    }
    
    public get pageSize() : number {
        return this._pageSize;
    }
    
    @Input("pageSize")
    public set pageSize(size: number) {
        if (this._pageSize === size) return;
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
    
    @Output("clearFilters") clearFiltersEmitter : EventEmitter<{key: string, value: string}[]>
        = new EventEmitter<{key: string, value: string}[]>();
    
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
        this._firstRecord = 1;
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
                                pageSize: this.pageSize });
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
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });
    }
    
    public goNextPage() {
        if ((this._firstRecord + this.pageSize) > this.totalCount) return;
        this._firstRecord += this.pageSize;
        this._lastRecord = this._firstRecord + this.pageSize - 1;
        if (this._lastRecord > this.availableCount) {
          this._lastRecord = this.availableCount;
        }
        this.selectedPage.emit({from: this.firstRecord,
                                to: this.lastRecord,
                                page: this.page,
                                pageSize: this.pageSize });
    }
    
    public goLastPage() {
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
    }
    
    public get sampleClickable() : boolean {
        return this._sampleClickable;
    }
    
    ngOnInit() {
        this._sampleClickable = (this.sampleClicked.observers.length > 0);
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