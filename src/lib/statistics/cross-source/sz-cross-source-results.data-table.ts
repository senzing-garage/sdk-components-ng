import { Component, ChangeDetectorRef, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { Observable, Subject, takeUntil, throwError, zip } from 'rxjs';

import { SzDataTable } from '../../shared/data-table/sz-data-table.component';
import { SzCrossSourceSummaryCategoryType, SzStatSampleEntityTableItem, SzStatSampleEntityTableRow } from '../../models/stats';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCSSClassService } from '../../services/sz-css-class.service';
import { SzEntityData, SzMatchedRecord } from '@senzing/rest-api-client-ng';
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
    private _defaultColumns = [
      'Entity ID',
      'More',
      'Match Key',
      'Data Source',
      'Name Data',
      'Attribute Data',
      'Address Data'
    ];
    private _allColumns = [
      'Entity ID',
      'More',
      'ER Code',
      'Match Key',
      'Related Entity ID',
      'Data Source',
      'Record ID',
      'Entity Type',
      'Name Data',
      'Attribute Data',
      'Address Data',
      'Relationship Data'
    ];

    override _colOrder: Map<string,number> = new Map([
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
    ])
    override _cols: Map<string,string> = new Map([
      ['entityId','Entity Id'],
      ['erCode','ER Code'],
      ['matchKey','Match Key'],
      ['dataSource','Data Source'],
      ['recordId','Record ID'],
      ['entityType','Entity Type'],
      ['nameData','Name Data'],
      ['attributeData','Attribute Data'],
      ['addressData','Address Data'],
      ['relationshipData','Relationship Data']
    ])

    override _selectableColumns: string[] = [
      'entityId',
      'erCode',
      'matchKey',
      'dataSource',
      'recordId',
      'entityType',
      'nameData',
      'attributeData',
      'addressData',
      'relationshipData'
    ]
    
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

    constructor(
      public prefs: SzPrefsService,
      private cd: ChangeDetectorRef,
      private cssService: SzCSSClassService,
      private dataMartService: SzDataMartService,
    ) {
        super();
    }

    override ngOnInit() {
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

    override cellStyle(fieldName: string, rowsPreceeding): string {
      let retVal = '';
      let rowOrderPrefix      = 0;
      let rowCellOrderOffset  = this.numberOfColumns * rowsPreceeding;
      if(this._colOrder && this._colOrder.has(fieldName)) {
        retVal += 'order: '+ (rowCellOrderOffset+this._colOrder.get(fieldName))+';';
      }
      return retVal;
    }

    resetRenderingIndexes() {
      this.rowCount   = 0;
      this.cellIndex  = 0;
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
      })
      console.log(`@senzing/sdk-components-ng/sz-cross-source-results.onSampleSetDataChange()`, data, transformed);
      this.data = transformed;
    }

}