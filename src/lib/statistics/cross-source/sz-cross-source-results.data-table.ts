import { Component, ChangeDetectorRef, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ChangeDetectionStrategy, TemplateRef, ViewContainerRef, ElementRef } from '@angular/core';
import { Observable, Subject, Subscription, filter, fromEvent, take, takeUntil, throwError, zip } from 'rxjs';
import {CdkMenu, CdkMenuItem, CdkContextMenuTrigger} from '@angular/cdk/menu';
import { MatDialog } from '@angular/material/dialog';

import { SzDataTable } from '../../shared/data-table/sz-data-table.component';
import { SzCrossSourceSummaryCategoryType, SzCrossSourceSummaryCategoryTypeToMatchLevel, SzDataTableEntity, SzDataTableRelation, SzStatSampleEntityTableItem, SzStatSampleEntityTableRow, SzStatSampleEntityTableRowType, SzStatsSampleTableLoadingEvent } from '../../models/stats';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { SzEntity, SzEntityData, SzEntityIdentifier, SzMatchedRecord, SzRecord, SzRelation } from '@senzing/rest-api-client-ng';
import { getMapKeyByValue, interpolateTemplate, parseBool } from '../../common/utils';
import { ConnectionPositionPair, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { SzCrossSourceSummaryMatchKeyPickerDialog } from '../../summary/cross-source/sz-cross-source-matchkey-picker.component';

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

    /** display the columns in this order */
    override _colOrder: Map<string,number> = new Map([
      ['entityId', 0],
      ['resolutionRuleCode', 1],
      ['matchKey', 2],
      ['relatedEntityId', 3],
      ['dataSource', 4],
      ['recordId', 5],
      ['nameData', 6],
      ['attributeData', 7],
      ['identifierData', 8],
      ['addressData', 9],
      ['phoneData', 10],
      ['relationshipData', 11],
      ['entityData', 12],
      ['otherData', 13]
    ]);
    /** 
     * stores how many times a column has data available to be displayed. Used to automatically 
     * collapse columns that have no data available to display
     */
    private _colDataCount: Map<string, number> = new Map();
    /** maps the internal field name of a column to the human readable title */
    override _cols: Map<string,string> = new Map([
      ['entityId', 'Entity ID'],
      ['resolutionRuleCode', 'ER Code'],
      ['matchKey', 'Match Key'],
      ['relatedEntityId', 'Related Entity'],
      ['dataSource', 'Data Source'],
      ['recordId', 'Record ID'],
      ['nameData', 'Name Data'],
      ['attributeData', 'Attribute Data'],
      ['identifierData', 'Identifier Data'],
      ['addressData', 'Address Data'],
      ['phoneData', 'Phone Data'],
      ['relationshipData', 'Relationship Data'],
      ['entityData', 'Entity Data'],
      ['otherData', 'Other Data']
    ])
    /** these columns are available to show/hide in the table */
    override _selectableColumns: string[] = [
      'entityId',
      'resolutionRuleCode',
      'matchKey',
      'relatedEntityId',
      'dataSource',
      'recordId',
      'nameData',
      'attributeData',
      'identifierData',
      'addressData',
      'phoneData',
      'relationshipData',
      'entityData',
      'otherData'
    ]
    private _alwaysVisibleColumns: string[] = ['entityId'];
    private _selectableColumnsAsMap: Map<string,string> = new Map();
    private _visibiltySelectableColumnsAsMap: Map<string,string> = new Map();

    private _matchLevelToColumnsMap  = new Map<number, string[]>([
      [1,[
        'entityId',
        'resolutionRuleCode',
        'matchKey',
        'dataSource',
        'recordId',
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
        /*'resolutionRuleCode',*/
        'matchKey',
        'relatedEntityId',
        'dataSource',
        'recordId',
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
        /*'resolutionRuleCode',*/
        'matchKey',
        'relatedEntityId',
        'dataSource',
        'recordId',
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

    public menuPositions = {
      settings: [
        new ConnectionPositionPair(
          { originX: 'start', originY: 'top' },
          { overlayX: 'end', overlayY: 'top' }
        ),
      ]
    }

    private _expandedEmptyColumns = [];
    private _hasLoadedOnce = false;
    private _isLoading = false;
    private _noData = false;
    @ViewChild('columnPickerRef') columnPickerRef: ElementRef<HTMLElement>;
    private _columnPickerShowing = false;
    private _documentClick$: Subscription;
    @ViewChild('sz_dt_header_context_menu') sz_dt_header_context_menu: TemplateRef<any>;
    contexMenuOverRef: OverlayRef | null;

    /** child ref to table (used for resize overlay calc) */
    @ViewChild('tableRef') tableRef: ElementRef<HTMLElement>;
    /** child ref to column drag resize indicator line */
    @ViewChild('resizeIndicatorRef') resizeIndicatorRef: ElementRef<HTMLElement>;
    
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
          let truncateAfter = this.truncatedLinesGreaterThan > 0 ? this.truncatedLinesGreaterThan : undefined;
          retVal = data.map((strVal: string, lineIndex) => {
            if(truncateAfter && (lineIndex+1) > truncateAfter) {
              return `<span class="data-item hidden">${strVal}</span>`;
            } else {
              return `<span class="data-item">${strVal}</span>`;
            }
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
    /** used to show expansion buttons for table cells that have information truncated */
    public hasTruncatedItems(value: unknown | unknown[]) {
      return this.truncatedItemCount(value) > 0;
    }
    /** used to show how many items are currently being hidden due to truncation */
    public truncatedItemCount(value: unknown | unknown[]): number {
      let truncateAfter = this.truncatedLinesGreaterThan > 0 ? this.truncatedLinesGreaterThan : undefined;
      if(value && truncateAfter > 0 && (value as unknown[]).forEach && (value as unknown[]).length > truncateAfter) {
        return (value as unknown[]).length - truncateAfter;
      }
      return 0;
    }
    public get truncateDataTableCellLines() {
      return this.prefs.dataMart.truncateDataTableCellLines;
    }
    public debugTruncatedItemCount(value: unknown | unknown[]) {
      let truncateAfter = this.truncatedLinesGreaterThan;

      console.log(`debugTruncatedItemCount(${truncateAfter}): `, 
      truncateAfter > 0,
      (value as unknown[]).length > truncateAfter, 
      (value as unknown[]).length - truncateAfter, 
      truncateAfter > 1,
      (value && truncateAfter > 1 && (value as unknown[]).forEach && (value as unknown[]).length > truncateAfter),
      this.truncatedItemCount(value));
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
    @HostBinding("class.truncate-cell-data") get classTruncateLines() {
      return (this.prefs.dataMart.truncateDataTableCellLines as number) > 1 || (this.prefs.dataMart.truncateDataTableCellLines as boolean) === true;
    }
    @HostBinding("class.wrap-lines") get classWrapLines() {
      return this.prefs.dataMart.wrapDataTableCellLines;
    }
    @HostBinding("class.column-resizing") get classColumnResizing() {
      return this._isResizing;
    }

    private get truncatedLinesGreaterThan(): number {
      return ((this.prefs.dataMart.truncateDataTableCellLines as number) > 0) ? (this.prefs.dataMart.truncateDataTableCellLines as number) : (this.prefs.dataMart.truncateDataTableCellLines as boolean) === true ? 1 : -1;
    }


    /** aggregate observeable for when the component is "doing stuff" */
    private _loading: Subject<SzStatsSampleTableLoadingEvent> = new Subject();
    @Output() loading: Observable<SzStatsSampleTableLoadingEvent> = this._loading.asObservable();
    private _onNoData: Subject<boolean> = new Subject();
    @Output() onNoData: Observable<boolean> = this._onNoData.asObservable();
    private _onEntityIdClick: Subject<SzEntityIdentifier> = new Subject();
    @Output() onEntityIdClick: Observable<SzEntityIdentifier> = this._onEntityIdClick.asObservable();

    constructor(
      public prefs: SzPrefsService,
      private cd: ChangeDetectorRef,
      private cssService: SzCSSClassService,
      private dataMartService: SzDataMartService,
      public dialog: MatDialog,
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
    public get visibilitySelectableColumns(): Map<string,string> {
      return this._visibiltySelectableColumnsAsMap;
    }
    private rowCount  = 0;
    private headerCellCount = this.selectableColumns.size;
    private cellIndex = this.headerCellCount + 1;

    private generateSelectableColumnsMap() {
      let _sCols = this._cols ? this._cols : new Map<string,string>();
      let _vCols = this._cols ? this._cols : new Map<string,string>();

      if(this._selectableColumns && this._selectableColumns.length > 0) {
        // only return columns in data AND in selectable list
        let _pear = new Map<string,string>(
          [..._sCols]
          .filter(([k,v])=>{
            return this._selectableColumns.includes(k);
          }));
        let _vis = new Map<string,string>(
          [..._sCols]
          .filter(([k,v])=>{
            return this._selectableColumns.includes(k) && !this._alwaysVisibleColumns.includes(k);
          }));        
        if(_pear.size > 0){
          _sCols  = _pear;
          _vCols  = _vis
        }
      }
      this._selectableColumnsAsMap          = _sCols;
      this._visibiltySelectableColumnsAsMap = _vCols;
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

    /** when a result row has rows that are not visible(ie records that belong to the entity but come from non-selected datasources) 
     * toggle whether or not the additional record rows are visible
    */
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

    /** expand or collapse cell when contents of cell contain items past truncation limit */
    public toggleCellExpando(cellElement?: HTMLElement, event?: MouseEvent) {
      console.log(`toggleCellExpando: `, cellElement, cellElement ? cellElement.classList.contains('expanded') : false);
      if(event && event.stopPropagation) { event.stopPropagation(); }
      if(cellElement) {
        if(cellElement.classList.contains('expanded')) {
          cellElement.classList.remove('expanded');
        } else {
          cellElement.classList.add('expanded');
        }
        this.cd.markForCheck();
      }
    }

    copyElementHTML(ele: HTMLElement, data: any, debug?: any) {
      //console.log(`copy html: `, ele, data,);

      if(typeof ClipboardItem === "undefined") {
        console.warn('copy to clipboard is not available');
        return;
      }
      if(ele) {
        let _valueElement = ele;
        if(ele && ele.classList.contains('sz-dt-cell')) {
          let valuesDiv   = ele.getElementsByClassName('cell-content');
          _valueElement   = (valuesDiv && valuesDiv.length > 0) ? (valuesDiv[0] as HTMLElement) : _valueElement;
        }
        if(_valueElement) {
          window.getSelection().removeAllRanges();
          let range = document.createRange();
          range.selectNode(_valueElement);
          window.getSelection().addRange(range);
          document.execCommand('copy');
          window.getSelection().removeAllRanges();
        }
        //var range = document.createRange();
        //range.selectNode(cell);
        //window.getSelection().addRange(range);
        //document.execCommand('copy')
      }
    }

    copyCellValue(value: any, data?: any) {
      //console.log(`copy cell value: `, value, data);
      if(typeof ClipboardItem === "undefined") {
        console.warn('copy to clipboard is not available');
        return;
      }
      if(value) {
        // get content
        navigator.clipboard.writeText(value).then( (r) => {
          console.log('wrote to clipboard: ', value);
        })
      }
    }

    openEntityById(value: any) {
      console.log(`open entity: `, value);
      this._onEntityIdClick.next(value as SzEntityIdentifier);
    }

    toggleRowExpansionFromMenu(data) {
      console.log(`toggleRowExpansionFromMenu: `, data);

    }

    isShowingAdditionalDataSources(rowGroupElement?: HTMLElement) {
      //console.log(`toggleRowExpansion() `, rowGroupElement);
      if(rowGroupElement) {
        return rowGroupElement.classList.contains('expanded')
      }
      return false;
    }

    hasAdditionalDataSources(rowGroupElement?: HTMLElement) {
      if(rowGroupElement) {
        return rowGroupElement.classList.contains('has-additional-data');
      }
      return false;
    }

    

    rowGroupStyle(item?: SzStatSampleEntityTableItem) {
      let retVal = '';
      retVal += '--column-count: '+ this.getColCount() +';';
      if(item) {
        retVal += ' --entity-row-count: '+ this.getTotalRowCount(item, [SzStatSampleEntityTableRowType.ENTITY_RECORD]) +';';  
        retVal += ' --selected-datasources-entity-row-count: '+ this.getRowCountInSelectedDataSources(item, [SzStatSampleEntityTableRowType.ENTITY_RECORD]) +';';  
        retVal += ' --related-row-count: '+ this.getTotalRowCount(item, [SzStatSampleEntityTableRowType.RELATED_RECORD]) +';';
        retVal += ' --selected-datasources-related-row-count: '+ this.getRowCountInSelectedDataSources(item, [SzStatSampleEntityTableRowType.RELATED_RECORD]) +';';  
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

    /** get the total data table row count for an entity or related entity. Optionally count only row types matching items in the "dataType" parameter. */
    getTotalRowCount(item: SzStatSampleEntityTableItem, dataType?: SzStatSampleEntityTableRowType[]) {
      let retVal      = 0;
      if(!dataType || (dataType && dataType.includes(SzStatSampleEntityTableRowType.ENTITY) && item.dataType === SzStatSampleEntityTableRowType.ENTITY)) {
        retVal++;
      }
      if(item.rows && item.rows.length) {
        if(!dataType) {
          retVal      += item.rows.length;
        } else if(dataType) {
          retVal      += item.rows.filter((row: SzStatSampleEntityTableRow) => {
            return dataType.includes(row.dataType);
          }).length;
        }
      }
      if(item.relatedEntity) {
        if(!dataType || dataType.includes(SzStatSampleEntityTableRowType.RELATED)) {
          retVal++;
        }
        if(item.relatedEntity.rows && item.relatedEntity.rows.length) {
          if(!dataType) {
            retVal    += item.relatedEntity.rows.length;
          } else if(dataType) {
            retVal    += item.relatedEntity.rows.filter((row: SzStatSampleEntityTableRow) => {
              return dataType.includes(row.dataType);
            }).length;
          }
        }
      }
      return retVal;
    }

    /**
     * Get the data table row count for a specific item. This is used to set the expand/collapse row-span for the 
     * entityId cells for the main entity row and it's related entity row (if not statType of "Matches")
     */
    getRowCountInSelectedDataSources(item: SzStatSampleEntityTableItem, dataType?: SzStatSampleEntityTableRowType[]) {
      let retVal = 0;
      if(!dataType || (dataType && dataType.includes(item.dataType))) {
        // how would you check the datasource match on "SzStatSampleEntityTableItem"
        retVal  += 1;
      }
      // count entity records
      if(item.rows && item.rows.length) {
        let _dataSourcesToMatch = this.dataMartService.sampleMatchLevel === SzCrossSourceSummaryCategoryTypeToMatchLevel.MATCHES ? [this.dataMartService.sampleDataSource1, this.dataMartService.sampleDataSource2] : [this.dataMartService.sampleDataSource1];
        let rowsInSelectedDataSources = item.rows.filter((row) => {
          if(!dataType || (dataType && dataType.includes(row.dataType))) {
            return (row.dataSource !== undefined && _dataSourcesToMatch.indexOf(row.dataSource) > -1) ? 1 : 0;
          }
          return false;
        });
        retVal  += (rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : 0);
      }
      if(item.relatedEntity) {
        if(!dataType || (dataType && dataType.includes(item.relatedEntity.dataType))) {
          // how would you check the datasource match on "SzDataTableRelatedEntity"
          retVal  += 1;
        }
        if(item.relatedEntity.rows && item.relatedEntity.rows.length) {
          // check if there is only "1" datasource, if row specifies to only match the second one and it's null flip it over to the first
          let _dataSourcesToMatch = this.dataMartService.sampleMatchLevel === SzCrossSourceSummaryCategoryTypeToMatchLevel.MATCHES ? [this.dataMartService.sampleDataSource1, this.dataMartService.sampleDataSource2] : this.dataMartService.sampleDataSource2 && this.dataMartService.sampleDataSource2 !== undefined ? [this.dataMartService.sampleDataSource2] : [this.dataMartService.sampleDataSource1];
          //retVal    += item.relatedEntity.rows.length;
          let rowsInSelectedDataSources = item.relatedEntity.rows.filter((row) => {
            if(!dataType || (dataType && dataType.includes(row.dataType))) {
              return (row.dataSource !== undefined && _dataSourcesToMatch.indexOf(row.dataSource) > -1) ? 1 : 0;
            }
            return false;
          });
          retVal  += (rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : 0);
        }
      }
      return retVal;
    }
    /** Sets the inline style tag for the entire data table. Mainly used for setting the grid column sizes. */
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
            } else if(this._colSizes && this._colSizes.has(key)) {
              retVal += ` ${_colSize}`;
            } else {
              retVal += ' minmax('+_colSize+',auto)';
            }
          });
          retVal += '; ';
      }
      if(this.classTruncateLines) {
        let _lineCount  = (this.prefs.dataMart.truncateDataTableCellLines as number) > 1 ? (this.prefs.dataMart.truncateDataTableCellLines as number) : 1;
        retVal += `--truncate-line-count: ${_lineCount}`;
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
    /** check whether or not a column is expanded by user. */
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
      return this.dataMartService.sampleDataSource1;
      //return this.dataMartService.dataSource1;
    }
    get selectedDataSource2(): string | undefined {
      return this.dataMartService.sampleDataSource2;
      //return this.dataMartService.dataSource2;
    }

    public isDataSourceSelected(dataSource: string, dataSourceName?: string) {
      // check if there is only "1" datasource, if row specifies to only match the second one and it's null flip it over to the first
      dataSourceName = dataSourceName && dataSourceName === 'sampleDataSource2' &&  this.dataMartService.sampleDataSource2 === undefined ? 'sampleDataSource1' : dataSourceName;
      let _dataSourcesToMatch = this.dataMartService.sampleMatchLevel === SzCrossSourceSummaryCategoryTypeToMatchLevel.MATCHES ? [this.dataMartService.sampleDataSource1, this.dataMartService.sampleDataSource2] : this.dataMartService && this.dataMartService[dataSourceName] ? this.dataMartService[dataSourceName] : [];
      return (dataSource !== undefined && 
        _dataSourcesToMatch
        .indexOf(dataSource) > -1) ? true : false;
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
          // base item is entity
          let baseItem  = (item as SzRelation).entity as SzDataTableEntity;
          baseItem.dataType = SzStatSampleEntityTableRowType.ENTITY;
          // related item is related entity
          let relItem   = (item as SzRelation).relatedEntity as SzDataTableEntity;
          relItem.dataType  = SzStatSampleEntityTableRowType.RELATED;
          
          // add "rows: SzStatSampleEntityTableRow[]" // SzStatSampleEntityTableRow
          let _entRows = baseItem.records && baseItem.records.map ? baseItem.records.map((rec: SzRecord) => {
            let retVal      = Object.assign({dataType: SzStatSampleEntityTableRowType.ENTITY_RECORD}, rec);
            return retVal;
          }) : undefined;

          let _relRows = relItem.records && relItem.records.map ? relItem.records.map((rec: SzRecord) => {
            let retVal      = Object.assign({dataType: SzStatSampleEntityTableRowType.RELATED_RECORD}, rec);
            return retVal;
          }) : undefined;

          // mash them up in to one object
          return Object.assign(baseItem, {
            relatedEntity: Object.assign(
              (item as SzRelation).relatedEntity, 
              {
                rows: _relRows, 
                relatedEntityId:  (item as SzRelation).relatedEntity.entityId,
                relatedMatchKey:  (item as SzRelation).matchKey,
                relatedMatchType: (item as SzRelation).matchType
              }
            ), rows: _entRows});
        } else {
          // base item is entity
          let baseItem = (item as SzEntityData).resolvedEntity as SzDataTableEntity;
          baseItem.dataType = SzStatSampleEntityTableRowType.ENTITY;

          // add "rows: SzStatSampleEntityTableRow[]" // SzStatSampleEntityTableRow
          let rows = baseItem.records && baseItem.records.map ? baseItem.records.map((rec: SzMatchedRecord) => {
            let retVal: SzStatSampleEntityTableRow = rec;
            retVal.dataType = SzStatSampleEntityTableRowType.ENTITY_RECORD;
            return retVal;
          }) : undefined;
          // mash them up in to one object
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

    override onCellClick(cellName: string, data: any, event?: MouseEvent, element?: HTMLElement) { 
      console.log(`on${cellName}Click: `, event, data);
      if((cellName === 'relatedEntityId' || cellName === 'entityId') && data) {
        this._onEntityIdClick.next(data as SzEntityIdentifier);
      }
      this.cellClick.emit({key: cellName, value: data});
      if(element) {
        //console.log('element: ', element, element.offsetHeight, element.scrollHeight);
      }
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
    
    public openFilterDialog() {
      let _matchKeyCountsData = this.dataMartService.matchKeyCounts;
      let _statType = this.dataMartService.sampleStatType;
      console.log(`openFilterDialog: `, _matchKeyCountsData, _statType);
      if(_matchKeyCountsData) {

        this.dialog.open(SzCrossSourceSummaryMatchKeyPickerDialog, {
          panelClass: 'sz-css-matchkey-picker-dialog-panel',
          minWidth: 200,
          height: 'var(--sz-css-matchkey-picker-dialog-default-height)',
          data: {
            data: _matchKeyCountsData, 
            statType: _statType
          }
        });
      }
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
    public toggleBoolPref(prefName: string, value?: any) {
      /*if(prefName === 'truncateDataTableCellLines') {
        // set it to "1"
        if(this.prefs.dataMart.truncateDataTableCellLines !== undefined) {
          this.prefs.dataMart.truncateDataTableCellLines = undefined;
        } else {
          this.prefs.dataMart.truncateDataTableCellLines = value ? value : 1;
        }
      } else {*/
        // assume bool
        this.prefs.dataMart[prefName] = !this.prefs.dataMart[prefName];
      //}
    }
    public isPrefChecked(prefName: string) {
      if(this.prefs.dataMart && this.prefs.dataMart[prefName] !== undefined) {
        // has pref, might be number, might be boolean
        let prefBool = parseBool(this.prefs.dataMart[prefName]);
        return prefBool;
      }
      return false;
    }
    _isResizing               = false;
    _resizeCellClientXOffset  = 0;
    _resizeCellClientYOffset  = 0;
    _resizeTableHeight        = 0;
    _resizeElement: HTMLElement;
    _resizeMinWidth           = 100;
    _resizeColName: string;
    public onHeaderMouseDown(event: MouseEvent) {
      console.info(`onHeaderMouseDown: `, event);
      if(event && event.target && (event.target as HTMLElement).classList.contains('handle-resize')) {
        // this is a resize handle
        this._resizeElement = (event.target as HTMLElement);
        if(this._resizeElement && this._resizeElement.parentElement) {
          this._resizeCellClientXOffset   = this._resizeElement.parentElement.offsetLeft;
          this._resizeCellClientYOffset   = this._resizeElement.parentElement.offsetTop;
          this._resizeColName             = this._resizeElement.parentElement.getAttribute('data-field-name');
          this._resizeElement.parentElement.classList.add('is-dragging');
          // if "min-width" set on table cell limit resize to that
          if(parseInt(this._resizeElement.parentElement.style.minWidth) > 0) {
            this._resizeMinWidth = parseInt(this._resizeElement.parentElement.style.minWidth);
          }
          // make the indicator the same height as the table
          if(this.tableRef && this.tableRef.nativeElement && this.tableRef.nativeElement.clientHeight) {
            this.resizeIndicatorRef.nativeElement.style.height = this.tableRef.nativeElement.clientHeight +'px';
          }
          // set initial position
          this._setResizeIndicatorPosition(event.clientX);
          console.log(`\tparent offset: ${this._resizeCellClientXOffset}`, this._resizeElement.parentElement.getClientRects());
        }
        this._isResizing    = true;
      }
    }
    override onHeaderMouseMove(event: MouseEvent) {
      if(this._isResizing) {
        console.log(`onHeaderMouseMove: `, event.clientX, (event.clientX - this._resizeCellClientXOffset));
        this._setResizeIndicatorPosition(event.clientX);
        /*
        if(this._resizeElement) {
          if(this._resizeMinWidth > 0) {
            if((event.clientX - this._resizeCellClientXOffset) > this._resizeMinWidth) {
              this._resizeElement.style.left  = (event.clientX - this._resizeCellClientXOffset) +'px';
              if(this.resizeIndicatorRef) {
                this.resizeIndicatorRef.nativeElement.style.left = event.clientX+'px';
                //this._colSizes.set(this._resizeColName, this._resizeElement.style.left);
              }
            }
          } else {
            this._resizeElement.style.left    = (event.clientX - this._resizeCellClientXOffset) +'px';
          }
        }*/
      }
    }
    private _setResizeIndicatorPosition(left: number) {
      if(this._resizeElement) {
        if(this._resizeMinWidth > 0) {
          if((left - this._resizeCellClientXOffset) > this._resizeMinWidth) {
            this._resizeElement.style.left  = (left - this._resizeCellClientXOffset) +'px';
            if(this.resizeIndicatorRef) {
              this.resizeIndicatorRef.nativeElement.style.left = left+'px';
              //this._colSizes.set(this._resizeColName, this._resizeElement.style.left);
            }
          }
        } else {
          this._resizeElement.style.left    = (left - this._resizeCellClientXOffset) +'px';
        }
      }
    }
    public onHeaderMouseUp(event: MouseEvent) {
      console.info(`onHeaderMouseUp: `, event);
      if(this._resizeElement && this._resizeElement.parentElement) {
        this._resizeElement.parentElement.classList.remove('is-dragging');
        let colName = this._resizeElement.parentElement.getAttribute('data-field-name');
        console.log(`\tset new "${colName}" width: ${this._resizeElement.style.left}`);
        if(colName) {
          //this._columnBeingResized.style.width = colWidth+'px';
          this._colSizes.set(colName, this._resizeElement.style.left);
        }
      }
      if(this._resizeElement) {
        // undo the mouse-pinning so it just goes back to it's default style
        this._resizeElement.style.left  = null;
      }
      this.cd.detectChanges();
      this._isResizing              = false;
      this._resizeElement           = undefined;
      this._resizeCellClientXOffset  = undefined;

    }

}