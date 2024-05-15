import { Component, ChangeDetectorRef, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ChangeDetectionStrategy, TemplateRef, ViewContainerRef, ElementRef } from '@angular/core';
import { Observable, Subject, Subscription, filter, fromEvent, take, takeUntil, throwError, zip } from 'rxjs';
import {CdkMenu, CdkMenuItem, CdkContextMenuTrigger} from '@angular/cdk/menu';

import { SzDataTable } from '../../shared/data-table/sz-data-table.component';
import { SzCrossSourceSummaryCategoryType, SzDataTableEntity, SzDataTableRelation, SzStatSampleEntityTableItem, SzStatSampleEntityTableRow, SzStatsSampleTableLoadingEvent } from '../../models/stats';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { SzEntity, SzEntityData, SzMatchedRecord, SzRecord, SzRelation } from '@senzing/rest-api-client-ng';
import { getMapKeyByValue, interpolateTemplate } from '../../common/utils';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

/**
 * Data Table with specific overrides and formatting for displaying 
 * sample results from the cross source summary component.
 */
@Component({
  selector: 'sz-cross-source-results',
  templateUrl: './sz-cross-source-results.data-table.html',
  styleUrls: ['./sz-cross-source-results.data-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SzCrossSourceResultsDataTable extends SzDataTable implements OnInit, OnDestroy {
    /*override _colOrder: Map<string,number> = new Map([
      ['entityId',0],
      ['erCode',1],
      ['matchKey',2],
      ['dataSource',3],
      ['recordId',4],
      ['entityType',5],
      ['nameData',6],
      ['attributeData',7],
      ['addressData',8],
      ['relationshipData',9]
    ])*/
    override _colOrder: Map<string,number> = new Map([
      ['entityId', 0],
      ['resolutionRuleCode', 1],
      ['matchKey', 2],
      ['relatedEntityId', 3],
      ['dataSource', 4],
      ['recordId', 5],
      ['entityType', 6],
      ['nameData', 7],
      ['attributeData', 8],
      ['identifierData', 9],
      ['addressData', 10],
      ['phoneData', 11],
      ['relationshipData', 12],
      ['entityData', 13],
      ['otherData', 14]
    ]);

    private _colDataCount: Map<string, number> = new Map();
    override _cols: Map<string,string> = new Map([
      ['entityId', 'Entity ID'],
      ['resolutionRuleCode', 'ER Code'],
      ['matchKey', 'Match Key'],
      ['relatedEntityId', 'Related Entity'],
      ['dataSource', 'Data Source'],
      ['recordId', 'Record ID'],
      ['entityType', 'Entity Type'],
      ['nameData', 'Name Data'],
      ['attributeData', 'Attribute Data'],
      ['identifierData', 'Identifier Data'],
      ['addressData', 'Address Data'],
      ['phoneData', 'Phone Data'],
      ['relationshipData', 'Relationship Data'],
      ['entityData', 'Entity Data'],
      ['otherData', 'Other Data']
    ])

    override _selectableColumns: string[] = [
      'entityId',
      'resolutionRuleCode',
      'matchKey',
      'relatedEntityId',
      'dataSource',
      'recordId',
      'entityType',
      'nameData',
      'attributeData',
      'identifierData',
      'addressData',
      'phoneData',
      'relationshipData',
      'entityData',
      'otherData'
    ]
    private _selectableColumnsAsMap: Map<string,string> = new Map();

    private _matchLevelToColumnsMap  = new Map<number, string[]>([
      [1,[
        'entityId',
        'resolutionRuleCode',
        'matchKey',
        'dataSource',
        'recordId',
        'entityType',
        'nameData',
        'attributeData',
        'identifierData',
        'addressData',
        'phoneData',
        'relationshipData',
        'entityData',
        'otherData'
      ]],
      [2,[
        'entityId',
        'resolutionRuleCode',
        'matchKey',
        'relatedEntityId',
        'dataSource',
        'recordId',
        'entityType',
        'nameData',
        'attributeData',
        'identifierData',
        'addressData',
        'phoneData',
        'relationshipData',
        'entityData',
        'otherData'
      ]],
      [3,[
        'entityId',
        'resolutionRuleCode',
        'matchKey',
        'relatedEntityId',
        'dataSource',
        'recordId',
        'entityType',
        'nameData',
        'attributeData',
        'identifierData',
        'addressData',
        'phoneData',
        'relationshipData',
        'entityData',
        'otherData'
      ]]
    ]);

    private _expandedEmptyColumns = [];
    private _hasLoadedOnce = false;
    private _isLoading = false;
    private _noData = false;
    @ViewChild('columnPickerRef') columnPickerRef: ElementRef<HTMLElement>;
    private _columnPickerShowing = false;
    private _documentClick$: Subscription;
    @ViewChild('sz_dt_header_context_menu') sz_dt_header_context_menu: TemplateRef<any>;
    contexMenuOverRef: OverlayRef | null;

    private get matchLevel() {
      return this.dataMartService.sampleMatchLevel;
    }
    public get colDataCount(): Map<string, number> {
      return this._colDataCount;
    }
    public get showColumnPickerMenu(): boolean {
      return this._columnPickerShowing;
    }
    
    override get cellFormatters() {
      let dataFieldRenderer = (data: string[]) => {
        let retVal = '';
        if(data && data.length > 0) {
          retVal = data.map((strVal: string) => {
            return `<span class="data-item">${strVal}</span>`;
          }).join('');
        }
        return retVal;
      }
      return {
        'nameData': dataFieldRenderer,
        'identifierData': dataFieldRenderer,
        'addressData': dataFieldRenderer,
        'phoneData': dataFieldRenderer,
        'relationshipData': dataFieldRenderer,
        'otherData': dataFieldRenderer,
      }
    }
    
    /** if singular datasource set css class 'singular' on host */
    @HostBinding("class.sample-type-ambiguous-matches") get classAmbiguousMatches() {
      return this.dataMartService.sampleStatType === SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES;
    }
    @HostBinding("class.sample-type-matches") get classMatches() {
      return this.dataMartService.sampleStatType === SzCrossSourceSummaryCategoryType.MATCHES;
    }
    @HostBinding("class.sample-type-possible-matches") get classPossibleMatches() {
      return this.dataMartService.sampleStatType === SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES;
    }
    @HostBinding("class.sample-type-possible-relations") get classPossibleRelations() {
      return this.dataMartService.sampleStatType === SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS;
    }
    @HostBinding("class.sample-type-disclosed-relations") get classDisclosedRelations() {
      return this.dataMartService.sampleStatType === SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS;
    }
    @HostBinding("class.show-all-columns") get showAllColumns() {
      return this.prefs.dataMart.showAllColumns;
    }
    @HostBinding("class.first-load") get firstLoad() {
      return !this._hasLoadedOnce;
    }
    @HostBinding("class.no-data") get noData() {
      return this._noData;
    }
    @HostBinding("class.loading") get isLoading() {
      return this._isLoading;
    }

    /** aggregate observeable for when the component is "doing stuff" */
    private _loading: Subject<SzStatsSampleTableLoadingEvent> = new Subject();
    @Output() loading: Observable<SzStatsSampleTableLoadingEvent> = this._loading.asObservable();
    private _onNoData: Subject<boolean> = new Subject();
    @Output() onNoData: Observable<boolean> = this._onNoData.asObservable();

    constructor(
      public prefs: SzPrefsService,
      private cd: ChangeDetectorRef,
      private cssService: SzCSSClassService,
      private dataMartService: SzDataMartService,
      public overlay: Overlay,
      public viewContainerRef: ViewContainerRef
    ) {
        super();
    }

    override ngOnInit() {
      // listen for match level change(changes visible columns)
      this.dataMartService.onSampleMatchLevelChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSampleMatchLevelChange.bind(this));
      // listen for new sample set requests
      this.dataMartService.onSampleRequest.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSampleSetRequest.bind(this, 'results table via dataMartService.onSampleRequest'));
      
      // listen for new sampleset data response
      this.dataMartService.onSampleResultChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSampleSetDataChange.bind(this));
      // listen for sampleset page changes
      this.dataMartService.onSamplePageChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onPageChange.bind(this));
      // listen for sampleset no results
      this.dataMartService.onSampleNoResults.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onNoResults.bind(this));

      

      // listen for "loading" event
      this.loading.subscribe((isLoading) =>{
        this._isLoading = isLoading.inflight;
        this.cd.detectChanges();
      });
      // listen for document "click" and close out any menus that may be showing
      this._documentClick$ = fromEvent<MouseEvent>(document, 'click')
        .pipe(
          filter(event => {
            const clickTarget = event.target as HTMLElement;
            if(this._contextMenuShowing) {
              // check the overlay ref
              return !!this.contexMenuOverRef && !this.contexMenuOverRef.overlayElement.contains(clickTarget);
            } else if(this._columnPickerShowing && this.columnPickerRef) {
              // check that it's not inside the picker element
              return !this.columnPickerRef.nativeElement.contains(clickTarget)
            }
            return this._contextMenuShowing || this._columnPickerShowing;
          })
        ).subscribe((event) => this.onDocumentClick(event));
      // get and listen for prefs change
      this.prefs.dataMart.prefsChanged.pipe(
        takeUntil(this.unsubscribe$),
      ).subscribe( this.onPrefsChange.bind(this) );
    }
    override get selectableColumns(): Map<string,string> {
      return this._selectableColumnsAsMap;
    }
    private rowCount  = 0;
    private headerCellCount = this.selectableColumns.size;
    private cellIndex = this.headerCellCount + 1;

    private generateSelectableColumnsMap() {
      let _sCols = this._cols ? this._cols : new Map<string,string>();
      if(this._selectableColumns && this._selectableColumns.length > 0) {
        // only return columns in data AND in selectable list
        let _pear = new Map<string,string>(
          [..._sCols]
          .filter(([k,v])=>{
            return this._selectableColumns.includes(k);
          }));
        if(_pear.size > 0){
          _sCols = _pear;
        }
      }
      this._selectableColumnsAsMap = _sCols;
    }

    getCellOrder(columnName: string, rowsPreceeding: number) {
      let rowCellOrderOffset  = this.numberOfColumns * rowsPreceeding;
      let retVal  = 0;
      if(this._colOrder && this._colOrder.has(columnName)) {
        retVal = (rowCellOrderOffset+this._colOrder.get(columnName));
      }
      return retVal;
    }

    resetTableIndexes() {
      this.rowCount   = 0;
      this.cellIndex  = 0;
    }

    incrementRowCount() {
      this.rowCount++;
      return this.rowCount;
    }

    getRowIndex() {
      return this.rowCount;
    }

    public getRowCountForField(fieldName: string): number {
      return this._colDataCount && this._colDataCount.has(fieldName) ? this._colDataCount.get(fieldName) : 0;
    }

    public isEmpty(value: any) {
      if(!value || value === null) { return true; }
      if(value && (value as string).trim && ((value as string).trim()) === '') {
        return false;
      } else if((value as number) > -1) {
        return false;
      }
      return true;
    }

    public toggleRowExpansion(rowGroupElement?: HTMLElement) {
      //console.log(`toggleRowExpansion() `, rowGroupElement);
      if(rowGroupElement) {
        if(rowGroupElement.classList.contains('expanded')) {
          rowGroupElement.classList.remove('expanded');
        } else {
          rowGroupElement.classList.add('expanded');
        }
        this.cd.markForCheck();
      }
    }

    rowGroupStyle(item?: SzStatSampleEntityTableItem) {
      let retVal = '';
      retVal += '--column-count: '+ this.getColCount() +';';
      if(item) {
        retVal += '--total-row-count: '+ this.getTotalRowCount(item) +';';
        retVal += ' --selected-datasources-row-count: '+ this.getRowCountInSelectedDataSources(item) +';';  
      }
      return retVal;
    }

    resetRenderingIndexes() {
      this.rowCount   = 0;
      this.cellIndex  = 0;
    }

    /**
     * When the match level changes we need to change which columns are displayed. This method 
     * is called when that change is made in the datamart service.
     * @param matchLevel Whe  
     */
    private onSampleMatchLevelChange(matchLevel: number) {
      if(this._matchLevelToColumnsMap.has(matchLevel)) {
        this._selectableColumns   = this._matchLevelToColumnsMap.get(matchLevel);
        this.generateSelectableColumnsMap();
      } else {
        // we still need columns sooo...
        console.warn(`NO column map for MATCH LEVEL ${matchLevel}`);
        this._selectableColumns = this._matchLevelToColumnsMap.get(1);
        this.generateSelectableColumnsMap();
      }
      // refresh the cols list so that grid column style is correct
      let _colsForMatchLevel    = new Map<string, string>([...this._cols].filter((_col)=>{
        return this._selectableColumns.includes(_col[0]);
      }));
      this._selectedColumns     = _colsForMatchLevel;
    }

    /** proxy handler for when prefs have changed externally */
    private onPrefsChange(prefs: any) {
      // update view manually
      this.cd.detectChanges();
    }

    public getRowCellOrder(fieldName: string) {
      let retVal = 0;
      if(this._colOrder && this._colOrder.has(fieldName)) { 
        retVal = this._colOrder.get(fieldName);
      }
      return retVal;
    }

    public getRowSpanForEntityIdCell(rows: SzStatSampleEntityTableRow[]) {
      let retVal = 0;
      if(rows) {
        let rowsInSelectedDataSources = rows.filter((row) => {
          return (row.dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(row.dataSource) > -1) ? 1 : 0;
        });
      }
      return retVal;
    }

    public getColCount() {
      let retVal = 1;
      if(this.selectedColumns) {
        retVal = this.selectedColumns.size;
      }
      return retVal;
    }

    getTotalRowCount(item: SzStatSampleEntityTableItem) {
      let retVal      = 0;
      if(item.rows && item.rows.length) {
        retVal      = item.rows.length;
      }
      if(item.relatedEntity) {
        retVal++;
        if(item.relatedEntity.rows && item.relatedEntity.rows.length) {
          retVal    += item.relatedEntity.rows.length;
        }
      }
      return retVal;
    }

    getRowCountInSelectedDataSources(item: SzStatSampleEntityTableItem) {
      let retVal = 0;
      if(item.rows && item.rows.length) {
        let rowsInSelectedDataSources = item.rows.filter((row) => {
          return (row.dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(row.dataSource) > -1) ? 1 : 0;
        });
        retVal  = rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : retVal;
      }
      if(item.relatedEntity) {
        retVal  = retVal + 1;
        if(item.relatedEntity.rows && item.relatedEntity.rows.length) {
          //retVal    += item.relatedEntity.rows.length;
          let rowsInSelectedDataSources = item.relatedEntity.rows.filter((row) => {
            return (row.dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(row.dataSource) > -1) ? 1 : 0;
          });
          retVal  += rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : 0;
        }
      }
      return retVal;

      /*if(rows) {
        let rowsInSelectedDataSources = rows.filter((row) => {
          return (row.dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(row.dataSource) > -1) ? 1 : 0;
        });
        retVal  = rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : retVal;
      }
      return retVal;*/
    }

    override get gridStyle(): string {
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
            if([0, undefined].includes(this._colDataCount.get(key)) && !this._expandedEmptyColumns.includes(key) && !this.showAllColumns) {
              // no data and not expanded
              retVal += ' 20px'; // no data
            } else {
              retVal += ' minmax('+_colSize+',auto)';
            }
          });
          retVal += '; ';
      }
      return retVal;
    }

    toggleColumnSelection(fieldName: string, event: MouseEvent) {
      // filter out checkbox clicks cause it'll double up the call and cancel itself out
      if(event.target && event.currentTarget && event.target !== event.currentTarget){
        console.warn(`cancelled out column toggle`, event.target);
        return true;
      }
      //console.warn(`toggleColumnSelection(${fieldName})`, this.isColumnVisible(fieldName), event.target, event.currentTarget);
      let _cSelected = this.isColumnVisible(fieldName);
      this.selectColumn(fieldName, !_cSelected);
      if(event && event.stopPropagation) {
        event.stopPropagation();
        return true;
      }
      this.cd.detectChanges();
      return true;
    }

    isColumnExpanded(columnKey: string): boolean {
      if(columnKey) {
        return this._expandedEmptyColumns.includes(columnKey);
      }
      return false;
    }

    toggleNoDataLabel(columnKey: string) {
      if(columnKey) {
        let _cIndex = this._expandedEmptyColumns.indexOf(columnKey);
        console.log(`toggleNoDataLabel(${columnKey}): ${this._expandedEmptyColumns[_cIndex]}`,_cIndex );
        if(_cIndex > -1 && this._expandedEmptyColumns[_cIndex]) {
          // column is expanded, collapse it
          this._expandedEmptyColumns.splice(_cIndex, 1);
        } else {
          // add it
          this._expandedEmptyColumns.push(columnKey);
        }
        this.cd.markForCheck();
      } else {
        console.warn(`toggleNoDataLabel: no element`);
      }
    }

    public replaceText(template: string, value: any) {
      return interpolateTemplate(template, value);
    }

    getGridColumnSizes() {
      let _currentGridSizes = this.gridStyle;
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
          console.log(`${key} count: ${this._colDataCount.get(key)}`, this._colDataCount.get(key) === 0);
          if(this._colDataCount.get(key) === 0) {
            retVal += ' 10px'; // no data
          } else {
            retVal += ' minmax('+_colSize+',auto)';
          }
        });
        retVal += '; ';
      }
      window.alert('Grid Sizes:\n\r'+_currentGridSizes)
    }

    get selectedDataSource1(): string | undefined {
      return this.dataMartService.dataSource1;
    }
    get selectedDataSource2(): string | undefined {
      return this.dataMartService.dataSource2;
    }

    public isDataSourceSelected(dataSource: string) {
      return (dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(dataSource) > -1) ? true : false;
    }
    private onSampleSetRequest(source: string, isInProgress: boolean | undefined) {
      console.warn(`SzCrossSourceResultsDataTable.onSampleSetRequest: ${isInProgress}`);
      this._loading.next({inflight: isInProgress, source: source});
    }

    // when new sample set data has changed
    private onSampleSetDataChange(data: SzEntityData[] | SzRelation[] | undefined) {
      if(data === undefined) {
        this.data = [];
        this._noData = true;
        this._onNoData.next(true);
      } else {
        this._hasLoadedOnce = true;
      }
      this.resetRenderingIndexes();
      // flatten/normalize data so we can display it
      let transformed: SzStatSampleEntityTableItem[] = data.map((item: SzEntityData | SzRelation) => {
        // is it a relation or a entity
        let isRelation = (item as SzEntityData).resolvedEntity ? false : true;
        if(isRelation) {
          let baseItem  = (item as SzRelation).entity;
          let relItem   = (item as SzRelation).relatedEntity;
          // add "rows: SzStatSampleEntityTableRow[]" // SzStatSampleEntityTableRow
          let _entRows = baseItem.records && baseItem.records.map ? baseItem.records.map((rec: SzRecord) => {
            let retVal: SzStatSampleEntityTableRow = rec;
            return retVal;
          }) : undefined;
          let _relRows = relItem.records && relItem.records.map ? relItem.records.map((rec: SzRecord) => {
            let retVal: SzStatSampleEntityTableRow = rec;
            return retVal;
          }) : undefined;
          return Object.assign(baseItem, {relatedEntity: Object.assign((item as SzRelation).relatedEntity, {rows: _relRows, relatedEntityId: (item as SzRelation).relatedEntity.entityId}), rows: _entRows});
        } else {
          // base row
          let baseItem = (item as SzEntityData).resolvedEntity;
          // add "rows: SzStatSampleEntityTableRow[]" // SzStatSampleEntityTableRow
          let rows = baseItem.records && baseItem.records.map ? baseItem.records.map((rec: SzMatchedRecord) => {
            let retVal: SzStatSampleEntityTableRow = rec;
            return retVal;
          }) : undefined;
          return Object.assign(baseItem, {relatedEntities: (item as SzEntityData).relatedEntities, rows: rows});
        }
      });
      if(transformed && transformed.length > 0) {
        this._noData = false;
      } else {
        console.warn('!!no data available!!');
        this._noData = true;
      }
      
      // get data counts
      transformed.forEach((item) =>{
        // for each column
        this._selectableColumns.forEach((colName) => {
          let _eCount = this._colDataCount.has(colName) ? this._colDataCount.get(colName) : 0;
          if(item[colName] !== undefined && item[colName] !== null) {
            this._colDataCount.set(colName, _eCount+1);
          }
        });
        if(item.rows && item.rows.length > 0) {
          item.rows.forEach((rowItem) => {
            this._selectableColumns.forEach((colName) => {
              let _eCount = this._colDataCount.has(colName) ? this._colDataCount.get(colName) : 0;
              if(rowItem[colName] !== undefined && rowItem[colName] !== null) {
                this._colDataCount.set(colName, _eCount+1);
              }
            });
          })
        }
        if(item.relatedEntity) {
          this._selectableColumns.forEach((colName) => {
            let _eCount = this._colDataCount.has(colName) ? this._colDataCount.get(colName) : 0;
            if(item.relatedEntity[colName] !== undefined && item.relatedEntity[colName] !== null) {
              this._colDataCount.set(colName, _eCount+1);
            }
          });
          if(item.relatedEntity.rows) {
            item.relatedEntity.rows.forEach((rowItem) => {
              this._selectableColumns.forEach((colName) => {
                let _eCount = this._colDataCount.has(colName) ? this._colDataCount.get(colName) : 0;
                if(rowItem[colName] !== undefined && rowItem[colName] !== null) {
                  this._colDataCount.set(colName, _eCount+1);
                }
              });
            })
          }
        }
      });
      console.warn(`@senzing/sdk-components-ng/sz-cross-source-results.onSampleSetDataChange()`, data, transformed);
      this.data     = transformed;
      this._loading.next({inflight: false, source: 'SzCrossSourceResultsDataTable.onSampleSetDataChange'});
      this.cd.markForCheck();
    }

    private onDocumentClick(event: MouseEvent) {
      // just close any menu's
      if(this._columnPickerShowing) {
        this._columnPickerShowing = false;
      }
      if(this.contexMenuOverRef) {
        this.contexMenuOverRef.dispose();
        this.contexMenuOverRef    = undefined;
        this._contextMenuShowing  = false;
      }
      this.cd.detectChanges();
    }

    private _contextMenuShowing = false;
    public onHeaderContextMenu(event: MouseEvent, col: any) {
      if(event && event.preventDefault) {
        event.preventDefault();
      }
      let x = event.x;
      let y = event.y;

      this._contextMenuShowing = true;
      const positionStrategy = this.overlay.position()
        .flexibleConnectedTo({ x, y })
        .withPositions([
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
          }
        ]);

      this.contexMenuOverRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.close()
      });

      this.contexMenuOverRef.attach(new TemplatePortal(this.sz_dt_header_context_menu, this.viewContainerRef, {
        $implicit: col
      }));
    }

    public debug(obj) {
      console.log(`debug: `, obj);
    }

    public onPageChange(event) {
      console.log(`onPageChange: `, event);
    }

    public onNoResults(hasResults: boolean) {
      this._noData    = hasResults;
      this._isLoading = false;
      this.cd.detectChanges();
    }

    public handleSampleClicked(event) {
      console.log(`handleSampleClicked: `, event);
    }
    public clearFilters(event) {
      console.log(`clearFilters: `, event);
    }
    

    override moveColumn(fieldName: string, orderModifier: number) {
      let currentIndex    = this._colOrder.get(fieldName);
      let newIndex        = currentIndex + orderModifier;
      let shiftLeft       = orderModifier === -1;
      let shiftRight      = orderModifier === +1;
  
      console.log(`moveColumn('${fieldName}', ${orderModifier}): ${newIndex}`);
  
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
        // first col is always entityId so real jump to gront starts 
        // at the second index pos
        if(newIndex === 2) {
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

    public toggleColumnPicker(event: MouseEvent) {
      this._columnPickerShowing = !this._columnPickerShowing;
      this.cd.detectChanges();
    }
}