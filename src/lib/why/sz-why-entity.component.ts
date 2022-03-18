import { Component, OnInit, Input, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityDataService, SzAttributeSearchResult, SzEntityData, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzMatchedRecord, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';

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
  templateUrl: './sz-why-entities.component.html',
  styleUrls: ['./sz-why-entities.component.scss']
})
export class SzWhyEntityComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input()
  entityId: SzEntityIdentifier;

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
      console.log('SzWhyEntityComponent.getWhyData: ', resData.data.whyResults, formattedData);
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

    return retVal;
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
