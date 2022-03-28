import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzEntityData, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntitiesResponse, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
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
      console.log('SzWhyEntitiesComparisonComponent.getWhyData()', resData);
    })
    /*
    .subscribe((resData: SzWhyEntityResponse) => {
      this._isLoading = false;
      this.loading.emit(false);
      let matchedRecords:SzMatchedRecord[] = [];
      if(resData.data.entities && resData.data.entities.length > 0) {
        resData.data.entities.forEach((_data: SzEntityData) => {
          if(_data.resolvedEntity && _data.resolvedEntity.records) {
            matchedRecords = matchedRecords.concat(_data.resolvedEntity.records);
          }
        });
      }
      let formattedData = this.formatWhyDataForDataTable(resData.data.whyResults, matchedRecords);
      //this.columnsToDisplay   = formattedData.columns;
      this._columnsToDisplay  = formattedData.columns;
      //this.columnsToDisplay   = formattedData.columns;
      this.dataToDisplay      = formattedData.data;
      this.dataSource.setData(this.dataToDisplay);
      this.gotColumnDefs = true;  
      console.log('SzWhyEntityComponent.getWhyData: ', resData.data, formattedData);
    })
    */
  }
  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getWhyData() {
    return this.entityData.whyEntities(this.entityIds[0].toString(), this.entityIds[1].toString())
    //return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, false, SzFeatureMode.NONE, false, false)
  }
  formatWhyDataForDataTable(data: SzWhyEntityResult[], entityRecords: SzMatchedRecord[]): any {
    let internalIds   = data.map((matchWhyResult) => { return matchWhyResult.perspective.internalId; });
    let columnKeys    = internalIds;
    let internalIdRow = {title:'Internal Id'};
    let dataSourceRow = {title:'Data Sources'};
    let whyKeyRow     = {title:'Why Result'};
    let featureKeys   = [];
    let features      = {};
    if(this.recordsToShow && this.recordsToShow.length > 0) {
      // only show specific records
      let filteredInternalIds     = data.filter((matchWhyResult) => {
        let hasSelectionMatch = matchWhyResult.perspective.focusRecords.some((frId: SzFocusRecordId) => {
          let focusRecordInSelection = this.recordsToShow.find((rToShow: SzRecordId) => {
            return rToShow.id == frId.recordId && rToShow.src == frId.dataSource;
          })
          return focusRecordInSelection !== undefined ? true : false;
        })
        return hasSelectionMatch ? true : false;
      }).map((matchWhyResult) => {
        return matchWhyResult.perspective.internalId;
      });
      if(filteredInternalIds && filteredInternalIds.length > 0) {
        // we found at least one
        internalIds   = filteredInternalIds;
        columnKeys    = internalIds;
      }
      console.warn('formatWhyDataForDataTable: filtered internal ids? ',filteredInternalIds);
    }

    columnKeys.forEach((colKey, _index) => {
      internalIdRow[ colKey ] = colKey;
    });
    data.map((matchWhyResult) => { 
      // datasources
      dataSourceRow[ matchWhyResult.perspective.internalId ]  = matchWhyResult.perspective.focusRecords.map((record) => {
        return record.dataSource +':'+ record.recordId;
      }).join('\n');
      // why keys
      whyKeyRow[ matchWhyResult.perspective.internalId ]      = matchWhyResult.matchInfo.whyKey + '\n'+ matchWhyResult.matchInfo.resolutionRule;
      // for each member of matchInfo.featureScores create a new row to add to result
      let featureRowKeys  = Object.keys( matchWhyResult.matchInfo.featureScores ); 
      featureRowKeys.forEach((keyStr) => {
        if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }
        let featValueForColumn = matchWhyResult.matchInfo.featureScores[ keyStr ].map((featScore: SzFeatureScore) => {
          let retFeatValue = featScore.inboundFeature.featureValue;
          if(featScore.featureType === 'NAME' && featScore.nameScoringDetails) {
            retFeatValue = retFeatValue +'\n\t'+ featScore.candidateFeature.featureValue +`(full:${featScore.nameScoringDetails.fullNameScore}|giv:${featScore.nameScoringDetails.givenNameScore}|sur:${featScore.nameScoringDetails.surnameScore})`;
          } else if(featScore.featureType === 'DOB' && featScore.scoringBucket == "SAME") {
            retFeatValue = retFeatValue;
          } else {
            retFeatValue = retFeatValue +'\n\t'+ featScore.candidateFeature.featureValue;
          }
          return retFeatValue;
        }).join('\n');
        // append feature
        if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
        features[keyStr][ matchWhyResult.perspective.internalId ] = featValueForColumn;
      });
      
      // see if we have any identifier data to show
      if(entityRecords && matchWhyResult.perspective && matchWhyResult.perspective.focusRecords) {
        let focusRecordIds = matchWhyResult.perspective.focusRecords.map((fRec) => { return fRec.recordId; })
        let matchingRecord = entityRecords.find((entityRecord) => {
          return focusRecordIds.indexOf(entityRecord.recordId) > -1;
        });
        if(matchingRecord && matchingRecord.identifierData) {
          //console.log(`has entity records: ${matchingRecord.recordId}|${matchWhyResult.perspective.internalId}|${matchWhyResult.perspective.focusRecords.map((v)=>{ return v.recordId}).join(',')}`, matchingRecord.identifierData);
          matchingRecord.identifierData.forEach((identifierField: string) => {
            // should be `key:value` pair
            if(identifierField && identifierField.indexOf(':') > -1) {
              // has key
              let identifierFields = identifierField.split(':');
              let keyStr = identifierFields[0];
              if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }
              if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
              features[keyStr][ matchWhyResult.perspective.internalId ] = identifierFields[1];
              //console.log(`added "${keyStr}" field for ${matchWhyResult.perspective.internalId}`, features[keyStr][ matchWhyResult.perspective.internalId ]);
            } else {
              // no key???
              //console.log('no identifier field for '+matchWhyResult.perspective.internalId);
            }
          });
        }
      }
      // now get the candidate key info
      
      if(matchWhyResult.matchInfo.candidateKeys) {
        let candidateKeys = Object.keys(matchWhyResult.matchInfo.candidateKeys).filter((cKeyName) => {
          return cKeyName && cKeyName.substring && cKeyName.indexOf('_KEY') > -1;
        });
        candidateKeys.forEach((kStr) => {
          let cKeyArrValue = matchWhyResult.matchInfo.candidateKeys[ kStr ];
          if(cKeyArrValue && cKeyArrValue.map) {
            let cKeyValue = cKeyArrValue.map((ckArrVal, ind) => {
              //return (ckArrVal.featureValue && ckArrVal.featureValue.trim) ? ckArrVal.featureValue.trim() : ckArrVal.featureValue;
              let rVal = ' '+ ckArrVal.featureValue.trim()
              //return (ind === 0) ? ind+'|'+rVal : ' '+ rVal;
              return rVal;
            }).sort().map((cStrVal, ind) => {
              return ind === 0 ? cStrVal : cStrVal;
            }).join('\n');
            //console.log(`adding ${kStr} to features (${featureKeys.join('|')})`, cKeyValue, cKeyValue.substring(0,1));
            if(!featureKeys.includes( kStr )){ featureKeys.push(kStr); }
            if(!features[kStr] || features[kStr] === undefined) { features[kStr] = {title: kStr}; }
            features[kStr][ matchWhyResult.perspective.internalId ] = cKeyValue.trim();
          }
        });
      }
    });

    // we're reformatting for a horizontal datatable
    // instead of the standard vertical datatable
    // so we change columns in to rows, and rows in to columns
    let retVal = [];
    // internalId's is the first row
    retVal.push( internalIdRow );
    // datasources are the second row
    retVal.push( dataSourceRow );
    // add feature rows
    featureKeys.forEach((featureKeyStr) => {
      retVal.push( features[ featureKeyStr ] );
    });

    return {
      columns: ['title'].concat(columnKeys.map((kNum: number) => { return kNum.toString(); })),
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