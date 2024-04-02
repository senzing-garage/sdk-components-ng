import { Component, HostBinding, Input, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef, AfterContentInit, AfterViewInit } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { camelToKebabCase, underscoresToDashes, getMapKeyByValue } from '../../common/utils';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzCrossSourceSummaryCategoryType, SzCrossSourceSummarySelectionEvent, SzCrossSourceSummarySelectionClickEvent } from '../../models/stats';

export interface dataSourceSelectionChangeEvent {
  dataSource1?: string,
  dataSource2?: string
}

/**
 * Wrapper component for the comparing stats of one datasource 
 * with their mutual stat type of another datasource. Uses the 
 * Venn Diagram chart to show the overlap and a special Data Table 
 * specific to displaying a sample set from the selected type of stats
 * for the two selected data sources.
 *
 * @internal
 * @example <!-- (Angular) -->
 * <sz-cross-source-statistics></sz-cross-source-statistics>
 *
 */
@Component({
  selector: 'sz-cross-source-statistics',
  templateUrl: './sz-cross-source-statistics.component.html',
  styleUrls: ['./sz-cross-source-statistics.component.scss']
})
export class SzCrossSourceStatistics implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  /** when a datasource section on one side or both of the venn diagram is clicked this event is emitted */
  @Output() sourceStatisticClick: EventEmitter<SzCrossSourceSummarySelectionClickEvent> = new EventEmitter();
  @Output() dataSourceSelectionChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleSourcesChange: EventEmitter<dataSourceSelectionChangeEvent> = new EventEmitter();
  @Output() sampleTypeChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();
  @Output() sampleParametersChange: EventEmitter<SzCrossSourceSummarySelectionEvent> = new EventEmitter();

  constructor(private dataMartService: SzDataMartService) {}
  ngOnInit() {
    this.dataMartService.onSampleTypeChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((statType: SzCrossSourceSummaryCategoryType) => {
      let _evtPayload = {
        dataSource1: this.dataMartService.sampleDataSource1,
        dataSource2: this.dataMartService.sampleDataSource2,
        matchLevel: this.dataMartService.sampleMatchLevel,
        statType: statType
      }
      this.sampleTypeChange.emit(_evtPayload);
    });
    this.dataMartService.onDataSourceSelected.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((dataSource: string) => {
      this.dataSourceSelectionChange.emit({
        dataSource1: this.dataMartService.dataSource1,
        dataSource2: this.dataMartService.dataSource2
      });
    });
    this.dataMartService.onSampleDataSourceChange.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((event: {dataSource1?: string, dataSource2?: string}) => {
      this.sampleSourcesChange.emit(event);
    })
  }
  ngAfterViewInit() {}
  //ngAfterContentInit

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  /** when user clicks a source stat, change it in the service */
  onSourceStatClicked(evt: SzCrossSourceSummarySelectionClickEvent) {
    console.log(`SzCrossSourceStatistics.onSourceStatClicked: `, evt);
    if(!evt.dataSource1 && evt.dataSource2) {
      // flip-flop if only one ds is defined
      this.dataMartService.sampleDataSource1  = evt.dataSource2;
      this.dataMartService.sampleDataSource2  = undefined;
    } else if((evt.dataSource1 && !evt.dataSource2) || ((evt.dataSource1 === evt.dataSource2) && evt.dataSource1 !== undefined)) {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = undefined;
    } else {
      this.dataMartService.sampleDataSource1  = evt.dataSource1;
      this.dataMartService.sampleDataSource2  = evt.dataSource2;
    }
    this.dataMartService.sampleMatchLevel   = evt.matchLevel;
    this.dataMartService.sampleStatType     = evt.statType as SzCrossSourceSummaryCategoryType;

    // simplify the event payload passed back
    let _parametersEvt: SzCrossSourceSummarySelectionEvent = {
      matchLevel: evt.matchLevel,
      statType: evt.statType
    }
    if(this.dataMartService.sampleDataSource1)  _parametersEvt.dataSource1 = this.dataMartService.sampleDataSource1;
    if(this.dataMartService.sampleDataSource2)  _parametersEvt.dataSource2 = this.dataMartService.sampleDataSource1;

    this.sampleParametersChange.emit(_parametersEvt);
    this.sourceStatisticClick.emit(evt);  // emit the raw event jic someone needs to use stopPropagation or access to the DOM node

  }
}