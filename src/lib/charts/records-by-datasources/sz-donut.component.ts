import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SzGraphPrefs, SzPrefsService } from '../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { SzEntityData, SzEntityIdentifier, SzEntityNetworkData } from '@senzing/rest-api-client-ng';
//import { SzGraphControlComponent } from './sz-graph-control.component';
//import { SzGraphNodeFilterPair, SzEntityNetworkMatchKeyTokens, SzMatchKeyTokenComposite, SzNetworkGraphInputs, SzMatchKeyTokenFilterScope } from '../../models/graph';
import { parseBool, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource } from '../../models/data-sources';
import { SzDataMartService } from '../../services/sz-datamart.service';

/**
 * Embeddable Donut Graph showing how many 
 * records belong to which datasources for the repository in a visual way. 
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-records-stats-donut (dataSourceClick)="onEntityClick($event)"></sz-graph>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-records-stats-donut></sz-wc-records-stats-donut>
 *
 * @example <!-- (WC) by DOM -->
 * <sz-wc-records-stats-donut id="sz-wc-records-stats-donut"></sz-wc-records-stats-donut>
 * <script>
 * document.getElementById('sz-wc-records-stats-donut');
 * document.getElementById('sz-wc-records-stats-donut').addEventListener('dataSourceClick', (data) => { console.log('datasource clicked on!', data); })
 * </script>
 */
@Component({
  selector: 'sz-record-counts-donut',
  templateUrl: './sz-donut.component.html',
  styleUrls: ['./sz-donut.component.scss']
})
export class SzRecordStatsDonutChart implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _recordCountsByDataSource: Map<string, SzRecordCountDataSource>;

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private dataMartService: SzDataMartService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // get data sources

    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((recordCounts: SzRecordCountDataSource[])=>{

    })
  }

  private getDataSources(): Observable<SzRecordCountDataSource[]> {
    let retObsSub = new Subject<SzRecordCountDataSource[]>
    let retVal    = retObsSub.asObservable();
    this.dataMartService.getRecordCounts().subscribe((response)=>{
      console.info(`SzRecordStatsDonutChart.getDataSources(): response: `, response);
    });
    // retrieve the stub data
    return retVal;
  }
}