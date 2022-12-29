import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';

class SzWhyEntityDataSource extends DataSource<any> {
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
 * Display the "Why" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity entityId="5"&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity entityId="5"&gt;&lt;/sz-wc-why-entity&gt;<br/>
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
  public dataSource = new SzWhyEntityDataSource(this.dataToDisplay);
  public gotColumnDefs = false;

  constructor(private entityData: EntityDataService) {
  }
  ngOnInit() {
    this._isLoading = true;
    this.loading.emit(true);

    this.getWhyData().subscribe((resData: SzWhyEntityResponse) => {
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
      let formattedData = this.formatWhyDataForDataTable(resData.data.whyResults, resData.data.entities, matchedRecords);
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
    return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
  }
  formatWhyDataForDataTable(data: SzWhyEntityResult[], entities: SzEntityData[], entityRecords: SzMatchedRecord[]): any {
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
      if(matchWhyResult.matchInfo.matchLevel !== 'NO_MATCH') {
        whyKeyRow[ matchWhyResult.perspective.internalId ]      = matchWhyResult.matchInfo.whyKey + '\n '+ matchWhyResult.matchInfo.resolutionRule;
      } else {
        // -------------------- NO MATCH PULL FROM ENTITY INSTEAD --------------------
        whyKeyRow[ matchWhyResult.perspective.internalId ]      = 'not found!'; // matchWhyResult.matchInfo.matchLevel;
        if(entities && entities.length == 1 && entities[0].resolvedEntity && entities[0].resolvedEntity && entities[0].resolvedEntity.features) {
          let entityData      = entities[0].resolvedEntity;
          let entityFeatures  = entityData.features;
          // for each member of entityData.features create a new row to add to result
          let featureRowKeys  = Object.keys( entityFeatures );
          featureRowKeys.forEach((keyStr) => {
            if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }
            let featValueForColumn = entityFeatures[ keyStr ].map((feature: SzEntityFeature) => {
              let retFeatValue = feature.primaryValue;
              return retFeatValue;
            }).join('\n ');
            // append feature
            if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
            features[keyStr][ matchWhyResult.perspective.internalId ] = featValueForColumn;
          });
        }
      }
      // results with "NO_MATCH" may not have "featureScores"
      if(matchWhyResult.matchInfo && matchWhyResult.matchInfo.featureScores) {
        // for each member of matchInfo.featureScores create a new row to add to result
        let featureRowKeys  = Object.keys( matchWhyResult.matchInfo.featureScores ); 
        featureRowKeys.forEach((keyStr) => {
          if(!featureKeys.includes( keyStr )){ featureKeys.push(keyStr); }
          let featValueForColumn = matchWhyResult.matchInfo.featureScores[ keyStr ].map((featScore: SzFeatureScore) => {
            let retFeatValue = featScore.inboundFeature.featureValue;
            if(featScore.featureType === 'NAME' && featScore.nameScoringDetails) {
              let _nameScoreValues  = [];
              if(featScore.nameScoringDetails.fullNameScore)    { _nameScoreValues.push(`full:${featScore.nameScoringDetails.fullNameScore}`);}
              if(featScore.nameScoringDetails.orgNameScore)     { _nameScoreValues.push(`org:${featScore.nameScoringDetails.orgNameScore}`);}
              if(featScore.nameScoringDetails.givenNameScore)   { _nameScoreValues.push(`giv:${featScore.nameScoringDetails.givenNameScore}`);}
              if(featScore.nameScoringDetails.surnameScore)     { _nameScoreValues.push(`sur:${featScore.nameScoringDetails.surnameScore}`);}
              if(featScore.nameScoringDetails.generationScore)  { _nameScoreValues.push(`gen:${featScore.nameScoringDetails.generationScore}`);}

              retFeatValue = retFeatValue +'\n '+ featScore.candidateFeature.featureValue +(_nameScoreValues.length > 0 ? `(${_nameScoreValues.join('|')})` : '');
            } else if(featScore.featureType === 'DOB' && featScore.scoringBucket == "SAME") {
              retFeatValue = retFeatValue + (featScore.score? ` (${featScore.score})`: '');
            } else {
              retFeatValue = retFeatValue +'\n '+ featScore.candidateFeature.featureValue + (featScore.score? ` (${featScore.score})`: '');
            }
            return retFeatValue;
          }).join('\n');
          // append feature
          if(!features[keyStr] || features[keyStr] === undefined) { features[keyStr] = {title: keyStr}; }
          features[keyStr][ matchWhyResult.perspective.internalId ] = featValueForColumn;
        });
      }
      
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
    // why result
    retVal.push( whyKeyRow );
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
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  
  private _entityId: SzEntityIdentifier;
  private _entityName: string;
  private _recordsToShow: SzRecordId[];
  private _showOkButton = true;
  private _isMaximized = false;
  private _isLoading = true;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  public get recordsToShow(): SzRecordId[] | undefined {
    return this._recordsToShow;
  }
  @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
  private set maximized(value: boolean) { this._isMaximized = value; }

  @ViewChild('whyEntityTag') whyEntityTag: SzWhyEntityComponent;

  public get title(): string {
    let retVal = this._entityName ? `Why for ${this.entityName} (${this.entityId})` : `Why for Entity ${this.entityId}`;
    if(this._recordsToShow && this._recordsToShow.length > 0) {
      // we're only showing specific record(s)
      retVal = `Why for Record`
      if(this._recordsToShow.length > 1) {
        retVal = `Why for Records`
      }
    }
    return retVal
  }

  public okButtonText: string = "Ok";
  public get showDialogActions(): boolean {
    return this._showOkButton;
  }

  public get entityId(): SzEntityIdentifier {
    return this._entityId;
  }
  public get entityName(): string | undefined {
    return this._entityName;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: { entityId: SzEntityIdentifier, entityName?:string, records?: SzRecordId[], okButtonText?: string, showOkButton?: boolean }) {
    if(data) {
      if(data.entityId) {
        this._entityId = data.entityId;
      }
      if(data.entityName) {
        this._entityName = data.entityName;
      }
      if(data.records) {
        this._recordsToShow = data.records;
      }
      if(data.okButtonText) {
        this.okButtonText = data.okButtonText;
      }
      if(data.showOkButton) {
        this._showOkButton = data.showOkButton;
      }
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
