import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzDataSourceRecordSummary, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzRecordId, SzWhyEntitiesResponse, SzWhyEntitiesResponseData } from '@senzing/rest-api-client-ng';
import { BehaviorSubject, Observable, ReplaySubject, Subject, takeUntil, throwError } from 'rxjs';
import { debounceTime, filter } from "rxjs/operators";

import { parseSzIdentifier } from '../common/utils';
import { SzPrefsService } from '../services/sz-prefs.service';

class SzWhyEntitiesDataSource extends DataSource<any> {
  private _dataStream = new ReplaySubject<any[]>();

  constructor(initialData: any[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<any[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: any[]) {
    this._dataStream.next(data);
  }
}

/**
 * Display the "Why" information for entities
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entities&gt;&lt;/sz-why-entities&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entities&gt;&lt;/sz-wc-why-entities&gt;<br/>
 */
@Component({
  selector: 'sz-why-entities',
  templateUrl: './sz-why-entities.component.html',
  styleUrls: ['./sz-why-entities.component.scss']
})
export class SzWhyEntitiesComparisonComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input()
  entityIds: SzEntityIdentifier[];

  private _tableData: any[] = [];
  private _isLoading = false;
  @Output()
  loading: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** if more than two records the view can be limited to just explicitly listed ones */
  @Input() recordsToShow: SzRecordId[] | undefined;

  private _columnsToDisplay: string[] = [];
  public get displayedColumns(): string[] {
    return this._columnsToDisplay;
  }
  public get isLoading(): boolean {
    return this._isLoading;
  }
  public set isLoading(value: boolean) {
    this._isLoading = value;
  }
  private dataToDisplay = [];
  public dataSource = new SzWhyEntitiesDataSource(this.dataToDisplay);
  public gotColumnDefs = false;

  constructor(private entityData: EntityDataService) {
  }
  ngOnInit() {
    this._isLoading = true;
    this.loading.emit(true);

    this.getWhyData()
    .subscribe((resData: SzWhyEntitiesResponse) => {
      this._isLoading = false;
      this.loading.emit(false);

      if(resData.data.entities && resData.data.entities.length > 0) {
        resData.data.entities.forEach((_data: SzEntityData) => {
          if(_data.resolvedEntity && _data.resolvedEntity.records) {
            //matchedRecords = matchedRecords.concat(_data.resolvedEntity.records);
          }
        });
      }
      let formattedData = this.formatWhyDataForDataTable(resData.data);
      this._columnsToDisplay  = formattedData.columns;
      this.dataToDisplay      = formattedData.data;
      this.dataSource.setData(this.dataToDisplay);
      this.gotColumnDefs = true;
    }, (error) => {
      console.warn(error);
    });
  }
  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getWhyData() {
    if(this.entityIds && this.entityIds.length == 2) {
      return this.entityData.whyEntities(this.entityIds[0].toString(), this.entityIds[1].toString(), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
    }
    return throwError(()=> { return new Error("entity id's not specified")})
  }
  formatWhyDataForDataTable(data: SzWhyEntitiesResponseData): any {
    //let entityIds       = data.map((entity)=>{ return entity.resolvedEntity.entityId});
    let whyResult       = (data && data.whyResult) ? data.whyResult : undefined;
    let internalIds     = data.entities.map((entity) => { return entity.resolvedEntity.entityId; });
    let columnKeys      = internalIds;
    let entityIdRow     = {title:'Entity ID'};
    let dataSourceRow   = {title:'Data Sources'};
    let reltionshipsRow = {title:'Relationships'};
    let whyResRow       = {title:'Why Result'};
    let featureKeys     = [];
    let features        = {}

    columnKeys.forEach((colKey, _index) => {
      entityIdRow[ colKey ] = colKey;
    });


    console.log(`Why Not result: `,internalIds, data);

    data.entities.forEach((entity: SzEntityData) => {
      // first get all the datasources present in recods
      let _dsForEntity = [];
      entity.resolvedEntity.recordSummaries.forEach((rsum: SzDataSourceRecordSummary) => {
        let _entriesToAdd = rsum.topRecordIds.map((_dsRecKey) => {
          return rsum.dataSource +':'+ _dsRecKey +'\n\r';
        })
        _dsForEntity = _dsForEntity.concat(_entriesToAdd);
      });
      dataSourceRow[ entity.resolvedEntity.entityId ] = _dsForEntity.join('');

      // now do relationships
      if(entity.relatedEntities && entity.relatedEntities.length > 0) {
        // filter down to just the ones in the query
        let relatedQueried = entity.relatedEntities.filter((relEnt) => { return internalIds.indexOf(relEnt.entityId) > -1; });
        reltionshipsRow[ entity.resolvedEntity.entityId ] = '';
        relatedQueried.forEach((relEnt) => {
          reltionshipsRow[ entity.resolvedEntity.entityId ] += `${relEnt.matchKey}\n\r  to ${relEnt.entityId}`
        });
      }
      
      // now do why result
      if(whyResult) {
        if(whyResult.matchInfo && whyResult.matchInfo.matchLevel === 'NO_MATCH') {
          whyResRow[ entity.resolvedEntity.entityId ] = 'not found!'; // matchWhyResult.matchInfo.matchLevel;
        } else if(whyResult.matchInfo) {
          whyResRow[ entity.resolvedEntity.entityId ] = `${whyResult.matchInfo.whyKey}`
        } else {
          whyResRow[ entity.resolvedEntity.entityId ] = '';
        }
      }

      // do features
      if(entity.resolvedEntity.features) {
        // add each feature to list
        let featureRowKeys = Object.keys(entity.resolvedEntity.features);
        featureRowKeys.forEach((keyStr) => {
          if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }

          let featValueForColumn = entity.resolvedEntity.features[ keyStr ].map((entFeature: SzEntityFeature) => {
            let retFeatValue = entFeature.primaryValue;
            if(entFeature.featureDetails) {
              // for each feature detail (should always be 1??)
              entFeature.featureDetails.forEach((featDetail) => {
                if(featDetail.statistics && featDetail.statistics.entityCount) {
                  retFeatValue += ` [${featDetail.statistics.entityCount}]`;
                }
              });
            }
            /*
            // do special formatting things for certain cases
            switch(keyStr) {
              case 'NAME':
                break;
            }*/
            return retFeatValue;
          }).join('\n');
          // append feature
          if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
          features[keyStr][ entity.resolvedEntity.entityId ] = featValueForColumn;
        });
      }
    });

    // we're reformatting for a horizontal datatable
    // instead of the standard vertical datatable
    // so we change columns in to rows, and rows in to columns
    let retVal = [];
    // internalId's is the first row
    retVal.push( entityIdRow );
    // data sources are the second row
    retVal.push( dataSourceRow );
    // relationships are the third row
    retVal.push( reltionshipsRow );
    // why result(s) are the fourth row
    retVal.push( whyResRow );
    // add feature rows
    if(featureKeys) {
      // reorder keys
      let defaultOrder        = [
        'AMBIGUOUS_ENTITY',
        'NAME',
        'DOB',
        'ADDRESS',
        'PHONE',
        'NAME_KEY',
        'ADDR_KEY',
        'PHONE_KEY'
      ].filter((oFeatKey) => { return featureKeys.indexOf(oFeatKey) > -1;});
      let orderedFeatureKeys  = defaultOrder.concat(featureKeys.filter((uoFeatKey) => { return defaultOrder.indexOf(uoFeatKey) < 0; }));
      
      orderedFeatureKeys.forEach((featureKeyStr) => {
        retVal.push( features[ featureKeyStr ] );
      });
    }

    return {
      columns: ['title'].concat(columnKeys.map((entityId: number) => { return entityId.toString(); })),
      data: retVal
    };
  }
}


@Component({
  selector: 'sz-dialog-why-entities',
  styleUrls: ['sz-why-entities-dialog.component.scss'],
  templateUrl: 'sz-why-entities-dialog.component.html'
})
export class SzWhyEntitiesDialog implements OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private _entities: SzEntityIdentifier[] = [];
  private _showOkButton = true;
  private _isLoading = true;
  private _isMaximized = false;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
  private set maximized(value: boolean) { this._isMaximized = value; }

  @ViewChild('whyEntitiesTag') whyEntitiesTag: SzWhyEntitiesComparisonComponent;

  public get title(): string {
    let retVal = `Why NOT for Entities (${this.entities.join(', ')})`;
    return retVal
  }

  public okButtonText: string = "Ok";
  public get showDialogActions(): boolean {
    return this._showOkButton;
  }

  public get entities(): SzEntityIdentifier[] {
    return this._entities;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    if(data && data.entities) {
      this._entities = data.entities;
    }
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  public onDataLoading(isLoading: boolean) {
    this._isLoading = isLoading;
  }
  public toggleMaximized() {
    this.maximized = !this.maximized;
  }
  public onDoubleClick(event) {
    this.toggleMaximized();
  }
}