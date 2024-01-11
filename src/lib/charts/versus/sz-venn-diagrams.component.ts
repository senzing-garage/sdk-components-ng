import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';

import { SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatCountsForDataSources } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';

/**
 * Embeddable Donut Graph showing how many 
 * records belong to which datasources for the repository in a visual way. 
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-venn-diagrams></sz-venn-diagrams>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-venn-diagrams></sz-wc-venn-diagrams>
 *
 */
@Component({
  selector: 'sz-venn-diagrams',
  templateUrl: './sz-venn-diagrams.component.html',
  styleUrls: ['./sz-venn-diagrams.component.scss']
})
export class SzVennDiagramsComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private dataMartService: SzDataMartService,
    private dataSourcesService: SzDataSourcesService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {

  }
}