import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzDataSourceRecordSummary, SzEntityData, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntitiesResponse, SzWhyEntitiesResult, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { catchError, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';

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
      let formattedData = this.formatWhyDataForDataTable(resData.data.entities, resData.data.whyResult);
      this._columnsToDisplay  = formattedData.columns;
      this.dataToDisplay      = formattedData.data;
      this.dataSource.setData(this.dataToDisplay);
      this.gotColumnDefs = true;
      console.log('SzWhyEntitiesComparisonComponent.getWhyData()', formattedData, resData.data);
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
      return this.entityData.whyEntities(this.entityIds[0].toString(), this.entityIds[1].toString(), true, true, false, SzFeatureMode.NONE, false, false)
    }
    return throwError(()=> { return new Error("entity id's not specified")})
  }
  formatWhyDataForDataTable(data: SzEntityData[], whyResult: SzWhyEntitiesResult) {
    let entityIds       = data.map((entity)=>{ return entity.resolvedEntity.entityId});
    let columnKeys      = entityIds;
    let entityIdRow     = {title:'Entity ID'};
    let dataSourceRow   = {title:'Data Sources'};
    let reltionshipsRow = {title:'Relationships'};
    let whyResRow       = {title:'Why Result'};
    let featureKeys     = [];
    let features        = {};

    columnKeys.forEach((colKey, _index) => {
      entityIdRow[ colKey ] = colKey;
    });

    data.forEach((entity: SzEntityData) => {
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
      
      // now do why result
      if(whyResult) {
        whyResRow[ entity.resolvedEntity.entityId ] = `${whyResult.matchInfo.whyKey}\n\r${whyResult.matchInfo.resolutionRule}`
      }
      // now do candidate keys
      // for each member of matchInfo.featureScores create a new row to add to result
      let featureRowKeys  = Object.keys( whyResult.matchInfo.featureScores ); 
      featureRowKeys.forEach((keyStr) => {
        if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }
        let featValueForColumn = whyResult.matchInfo.featureScores[ keyStr ].map((featScore: SzFeatureScore) => {
          let retFeatValue = featScore.inboundFeature.featureValue;
          if(featScore.featureType === 'NAME' && featScore.nameScoringDetails) {
            retFeatValue = retFeatValue +'\n\t'+ featScore.candidateFeature.featureValue +`(full:${featScore.nameScoringDetails.fullNameScore}|giv:${featScore.nameScoringDetails.givenNameScore}|sur:${featScore.nameScoringDetails.surnameScore})`;
          } else if(featScore.featureType === 'PHONE' && featScore.scoringBucket == "SAME") {
            retFeatValue = retFeatValue;
          } else if(featScore.featureType === 'DOB' && featScore.scoringBucket == "SAME") {
            retFeatValue = retFeatValue;
          } else {
            retFeatValue = retFeatValue +'\n\t'+ featScore.candidateFeature.featureValue;
          }
          return retFeatValue;
        }).join('\n');
        // append feature
        if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
        features[keyStr][ entity.resolvedEntity.entityId ] = featValueForColumn;
      });
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
    //retVal.push( reltionshipsRow );
    // why result(s) are the fourth row
    retVal.push( whyResRow );
    // add feature rows
    featureKeys.forEach((featureKeyStr) => {
      retVal.push( features[ featureKeyStr ] );
    });

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
export class SzWhyEntitiesDialog {
  private _entities: SzEntityIdentifier[] = [];
  private _showOkButton = true;
  private _isLoading = true;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  @ViewChild('whyEntitiesTag') whyEntitiesTag: SzWhyEntitiesComparisonComponent;

  public get title(): string {
    let retVal = `Why for Entities (${this.entities.join(', ')})`;
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
  public onDataLoading(isLoading: boolean) {
    console.log('SzWhyEntityDialog.isLoading: ', isLoading);
    this._isLoading = isLoading;
  }
}