import { Component, ChangeDetectorRef, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { Observable, Subject, takeUntil, throwError, zip } from 'rxjs';

import { SzDataTable } from '../../shared/data-table/sz-data-table.component';
import { SzCrossSourceSummaryCategoryType, SzStatSampleEntityTableItem, SzStatSampleEntityTableRow } from '../../models/stats';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { SzEntityData, SzMatchedRecord } from '@senzing/rest-api-client-ng';
import { interpolateTemplate } from '../../common/utils';

/**
 * Data Table with specific overrides and formatting for displaying 
 * sample results from the cross source summary component.
 */
@Component({
  selector: 'sz-cross-source-results',
  templateUrl: './sz-cross-source-results.data-table.html',
  styleUrls: ['./sz-cross-source-results.data-table.scss']
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

    private get matchLevel() {
      return this.dataMartService.sampleMatchLevel;
    }
    public get colDataCount(): Map<string, number> {
      return this._colDataCount;
    }
    
    override get cellFormatters() {
      return {
        'addressData': (addresses: string[]) => {
          let retVal = '';
          if(addresses && addresses.length > 0) {
            let retStr = addresses.map((value: string) => {
              return `${value}`;
            });
            retVal = '<div class="sz-stat-table-cell address">'+ retStr.join('</div><div class="sz-stat-table-cell address">')+'</div>'
          }
          return retVal;
        }
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

    constructor(
      public prefs: SzPrefsService,
      private cd: ChangeDetectorRef,
      private cssService: SzCSSClassService,
      private dataMartService: SzDataMartService,
    ) {
        super();
    }

    override ngOnInit() {
      // listen for match level change(changes visible columns)
      this.dataMartService.onSampleMatchLevelChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSampleMatchLevelChange.bind(this));

      // listen for new sampleset data
      this.dataMartService.onSampleResultChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(this.onSampleSetDataChange.bind(this));
    }
    private rowCount  = 0;
    private headerCellCount = this.selectableColumns.size;
    private cellIndex = this.headerCellCount + 1;

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
      }
    }

    rowGroupStyle(item: SzStatSampleEntityTableItem) {
      let retVal = '';
      retVal += '--total-row-count: '+ this.getTotalRowCount(item.rows) +';';
      retVal += ' --selected-datasources-row-count: '+ this.getRowCountInSelectedDataSources(item.rows) +';';
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
      } else {
        // we still need columns sooo...
        console.warn(`NO column map for MATCH LEVEL ${matchLevel}`);
        this._selectableColumns = this._matchLevelToColumnsMap.get(1);
      }
      // refresh the cols list so that grid column style is correct
      let _colsForMatchLevel    = new Map<string, string>([...this._cols].filter((_col)=>{
        return this._selectableColumns.includes(_col[0]);
      }));
      this._selectedColumns     = _colsForMatchLevel;
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

    getTotalRowCount(rows: SzStatSampleEntityTableRow[]) {
      return rows && rows.length ? rows.length : 0;
    }

    getRowCountInSelectedDataSources(rows: SzStatSampleEntityTableRow[]) {
      let retVal = 0;
      if(rows) {
        let rowsInSelectedDataSources = rows.filter((row) => {
          return (row.dataSource !== undefined && [this.dataMartService.dataSource1, this.dataMartService.dataSource2].indexOf(row.dataSource) > -1) ? 1 : 0;
        });
        retVal  = rowsInSelectedDataSources && rowsInSelectedDataSources.length ? rowsInSelectedDataSources.length : retVal;
      }
      return retVal;
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

    private onSampleSetDataChange(data: SzEntityData[] | undefined) {
      if(data === undefined) {
        this.data = [];
      }
      this.resetRenderingIndexes();
      // flatten data so we can display it
      let transformed: SzStatSampleEntityTableItem[] = data.map((item) => {
        // base row
        let baseItem = item.resolvedEntity;
        // add "rows: SzStatSampleEntityTableRow[]" // SzStatSampleEntityTableRow
        let rows = item.resolvedEntity.records && item.resolvedEntity.records.map ? item.resolvedEntity.records.map((rec: SzMatchedRecord) => {
          let retVal: SzStatSampleEntityTableRow = rec;
          return retVal;
        }) : undefined;
        return Object.assign(baseItem, {relatedEntities: item.relatedEntities, rows: rows});
      });
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
      });
      console.log(`@senzing/sdk-components-ng/sz-cross-source-results.onSampleSetDataChange()`, data, transformed);
      this.data = transformed;
      this.cd.markForCheck();
    }

}