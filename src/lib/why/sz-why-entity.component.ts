import { Component, OnInit, Input, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {DataSource} from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzEntityData, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzMatchedRecord, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';

/*
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}*/

class ExampleDataSource extends DataSource<any> {
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

/*
const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];*/

/**
 * Display the "Why" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity&gt;&lt;/sz-wc-why-entity&gt;<br/>
 */
@Component({
  selector: 'sz-why-entity',
  templateUrl: './sz-why-entity.component.html',
  styleUrls: ['./sz-why-entity.component.scss']
})
export class SzWhyEntityComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input()
  entityId: SzEntityIdentifier;
  private _tableData: any[] = [];

  private _columnsToDisplay: string[] = [];
  public get displayedColumns(): string[] {
    return this._columnsToDisplay;
  }
  private dataToDisplay = [];
  public dataSource = new ExampleDataSource(this.dataToDisplay);
  public gotColumnDefs = false;

  constructor(private entityData: EntityDataService) {

  }
  ngOnInit() {
    this.getWhyData().subscribe((resData: SzWhyEntityResponse) => {
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
  }
  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getWhyData() {
    return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, false, SzFeatureMode.NONE, false, false)
  }
  formatWhyDataForDataTable(data: SzWhyEntityResult[], entityRecords: SzMatchedRecord[]): any {
    let retData = [];
    let rows = [
      'perspective.internalId',
      'perspective.focusRecords',
      'matchInfo.whyKey',
      'matchInfo.resolutionRule',
      'forEach(matchInfo.featureScores)',
      'forEach((resolvedEntity.records.recordId == perspective.focusRecords.recordId).identifierData)'
    ]
    let internalIds   = data.map((matchWhyResult) => { return matchWhyResult.perspective.internalId; });
    let columnKeys    = internalIds;
    let internalIdRow = {title:'Internal Id'};
    let dataSourceRow = {title:'Data Sources'};
    let whyKeyRow     = {title:'Why Result'};
    let featureKeys   = [];
    let features      = {};

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
      /*
      if(matchWhyResult.matchInfo.candidateKeys) {
        let candidateKeys = Object.keys(matchWhyResult.matchInfo.candidateKeys);
        candidateKeys.forEach((kStr) => {
          let cKeyArrValue = matchWhyResult.matchInfo.candidateKeys[ kStr ];
          if(cKeyArrValue && cKeyArrValue.map) {
            let cKeyValue = cKeyArrValue.map((ckArrVal) => {
              return ckArrVal.featureValue;
            }).join('\n');
            if(!featureKeys.includes( kStr )){ featureKeys.push(kStr); }
            features[kStr][ matchWhyResult.perspective.internalId ] = cKeyValue;
          }
        });
      }*/
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
  selector: 'sz-dialog-why-entity',
  templateUrl: 'sz-why-entity-dialog.component.html',
  styleUrls: ['sz-why-entity-dialog.component.scss']
})
export class SzWhyEntityDialog {
  private _entityId: SzEntityIdentifier;
  public get entityId(): SzEntityIdentifier {
    return this._entityId;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: { entityId: SzEntityIdentifier }) {
    if(data && data.entityId) {
      this._entityId = data.entityId;
    }
  }
}
