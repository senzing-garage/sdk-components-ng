import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzCandidateKey, SzDataSourceRecordSummary, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzRecordId, SzWhyEntitiesResponse, SzWhyEntitiesResponseData, SzWhyEntitiesResult, SzWhyEntityResponseData } from '@senzing/rest-api-client-ng';
import { BehaviorSubject, Observable, ReplaySubject, Subject, takeUntil, throwError, zip } from 'rxjs';
import { debounceTime, filter } from "rxjs/operators";

import { parseSzIdentifier } from '../common/utils';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzWhyEntityComponent } from './sz-why-entity.component';
import { SzWhyEntityColumn, SzWhyFeatureRow } from '../models/data-why';
import { SzWhyReportBaseComponent } from './sz-why-report-base.component';
import * as e from 'express';
import { SzCSSClassService } from '../services/sz-css-class.service';

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
export class SzWhyEntitiesComparisonComponent extends SzWhyReportBaseComponent implements OnInit, OnDestroy {
    /**
     * place to store the original data given back from the network response, but before 
     * processing transforms and formatting.
     * @internal
     */
    protected override _data: SzWhyEntitiesResult;
    /** 
     * rows that will be rendered vertically. auto generated from #getRowsFromData 
     * @internal
     */
    protected override _rows: SzWhyFeatureRow[] = [
        {key: 'ENTITY_ID',      title: 'Entity ID'},
        {key: 'DATA_SOURCES',   title: 'Data Sources'},
        {key: 'WHY_RESULT',     title: 'Why Result'}
    ];

    constructor(
        override configDataService: SzConfigDataService,
        override entityData: EntityDataService) {
        super(configDataService, entityData);
    }
    override ngOnInit() {
        this._isLoading = true;
        this.loading.emit(true);

        zip(
            this.getWhyData(),
            this.getOrderedFeatures()
        ).subscribe({
            next: (results) => {
            this._isLoading = false;
            this.loading.emit(false);
            this._data          = results[0].data.whyResult;
            this._entities      = results[0].data.entities;
            this.onEntitiesChanged.emit(this._entities);
            /** 
             * 
        entityId1?: number;
        entityId2?: number;
        matchInfo?: SzWhyMatchInfo;


        SzWhyEntityResult {
        perspective?: SzWhyPerspective;
        matchInfo?: SzWhyMatchInfo;
        }
            */
            // add any fields defined in initial _rows value to the beginning of the order
            // custom/meta fields go first basically
            this._orderedFeatureTypes = this._rows.map((fr)=>{ return fr.key}).concat(results[1]);
            this._featureStatsById  = this.getFeatureStatsByIdFromEntityData(this._entities);
            //console.log(`SzWhyEntityComponent._featureStatsById: `, this._featureStatsById);

            this._shapedData    = this.transformData(this._data, this._entities);
            this._formattedData = this.formatData(this._shapedData);
            // now that we have all our "results" grab the features so we 
            // can iterate by those and blank out cells that are missing
            this._rows          = this.getRowsFromData(this._shapedData, this._orderedFeatureTypes);
            this._headers       = this.getHeadersFromData(this._shapedData);
            console.warn('SzWhyEntitiesComparisonComponent.rows: ', this._rows);
            this.onResult.emit(this._data);
            this.onRowsChanged.emit(this._rows);
            },
            error: (err) => {
            console.error(err);
            }
        });
    }
  
    /** when the respone from the server is returned this even is emitted */
    @Output() onResult: EventEmitter<SzWhyEntitiesResult>               = new EventEmitter<SzWhyEntitiesResult>();
    @Output() onEntitiesChanged: EventEmitter<SzEntityData[]>           = new EventEmitter<SzEntityData[]>();
    // --------------------------- data manipulation subs and routines ---------------------------

    @Input() entityIds: SzEntityIdentifier[];

    /** override renderers that may be different from "WHY" report */
    protected override get renderers() {
        let _retVal = this._renderers;
        _retVal = Object.assign(_retVal, {
            'NAME': (data: (SzFeatureScore | SzCandidateKey)[], fieldName?: string, mk?: string) => {
                let _retVal = undefined;
                if(data && data.length > 0 && data.forEach) {
                    data.forEach((_d)=>{
                        // for each item render a line
                        if((_d as SzEntityFeature).featureDetails) {
                            // go through each detail item
                            let _feat = (_d as SzEntityFeature);
                            if(_feat.featureDetails && _feat.featureDetails.forEach){
                                _feat.featureDetails.forEach((fd)=>{
                                    // check if it has a duplicate value
                                    // if yes add a '└'
                                    let isDuplicate = false;
                                    if(!_retVal) { _retVal = ``; }
                                    if(!isDuplicate) {
                                        _retVal += fd.featureValue+'\n';
                                    }
                                });
                            }
                        }
                    });
                } else {
                    _retVal += 'undefined';
                }
                console.log(`SzWhyEntitiesComparisonComponent.renderers[${fieldName}]: `, data, (data as SzEntityFeature).featureDetails, _retVal);

                return _retVal;
                //return _retVal ? _retVal : this._renderers['NAME'](data, fieldName, mk);
            },
            'ADDRESS': (data: (SzFeatureScore | SzCandidateKey)[], fieldName?: string, mk?: string) => {
                let _retVal = undefined;
                if(data && data.length > 0 && data.forEach) {
                    data.forEach((_d)=>{
                        // for each item render a line
                        if((_d as SzEntityFeature).featureDetails) {
                            // go through each detail item
                            let _feat = (_d as SzEntityFeature);
                            if(_feat.featureDetails && _feat.featureDetails.forEach){
                                _feat.featureDetails.forEach((fd)=>{
                                    // check if it has a duplicate value
                                    // if yes add a '└'
                                    let isDuplicate = false;
                                    if(!_retVal) { _retVal = ``; }
                                    if(!isDuplicate) {
                                        _retVal += fd.featureValue+'\n';
                                    }
                                });
                            }
                        }
                    });
                } else {
                    _retVal += 'undefined';
                }
                console.log(`SzWhyEntitiesComparisonComponent.renderers[${fieldName}]: `, data, (data as SzEntityFeature).featureDetails, _retVal);
                return _retVal;
            }
        })
        //console.info(`what is going on here??? `, _retVal);
        return _retVal;
    }

    /** call the /why api endpoint and return a observeable */
    protected override getWhyData() {
        if(this.entityIds && this.entityIds.length == 2) {
        return this.entityData.whyEntities(this.entityIds[0].toString(), this.entityIds[1].toString(), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
        }
        return throwError(()=> { return new Error("entity id's not specified")})
    }
    /** 
     * Add "formattedRows" that correspond to the string renderer output of each item in each collection returned from the result of
     * #transformData's rows property. The result of each item is a string or collection of strings that is the result of either a 
     * renderer specific for that feature type, or the 'default' renderer found in this.renderers.default.
     * @internal
     */
    override formatData(data: SzWhyEntityColumn[], ): SzWhyEntityColumn[] {
        let retVal;
        if(data) {
            console.log(`formatData()`, data);
            retVal = data.map((columnData) => {
            let _retVal = Object.assign(columnData, {});
            if(_retVal.rows) {
                // for each row figure out what "renderer" to use
                // for now just use the 'default'
                let mk = columnData.whyResult ? columnData.whyResult.key : undefined;
                for(let fKey in _retVal.rows) {
                if(!_retVal.formattedRows) { _retVal.formattedRows = {}; }
                _retVal.formattedRows[ fKey ] = this.renderers[fKey] ? this.renderers[fKey](_retVal.rows[ fKey ], fKey, mk) : this.renderers.default(_retVal.rows[ fKey ], fKey, mk);
                }
            }
            return columnData;
            });
        }
        return retVal;
    }
    /**
     * Extends the data response from the why api with data found "rows" that can be more directly utilized by the rendering template.
     * Every why result column gets additional fields like "dataSources", "internalId", "rows", "whyResult" that are pulled, hoisted, 
     * or joined from other places. 
     * @internal
     */
    override transformWhyNotResultData(data: SzWhyEntitiesResult, entities: SzEntityData[]): SzWhyEntityColumn[] {
        console.log(`transformWhyNotResultData: ${this.entityIds.join(',')}`, data);
        //console.log(`_featureStatsById: `, _featureStatsById);
        let results:SzWhyEntityColumn[] = [];
        if(entities && entities.length > 0) {
            results = entities.map((ent, entIndex)=>{
                let retObj: SzWhyEntityColumn = Object.assign({
                    rows: Object.assign({
                        'ENTITY_ID': [ent.resolvedEntity.entityId],
                        'WHY_RESULT': (data.matchInfo.matchLevel !== 'NO_MATCH') ? {key: data.matchInfo.whyKey, rule: data.matchInfo.resolutionRule} : undefined
                    })
                }, ent.resolvedEntity);
                // do why info
                if(data && data.matchInfo) {
                    if(data.matchInfo.whyKey && data.matchInfo.resolutionRule) { 
                        retObj.whyResult = {key: data.matchInfo.whyKey, rule: data.matchInfo.resolutionRule };
                    }
                }
                if(ent.resolvedEntity.recordSummaries){
                    retObj.dataSources = ent.resolvedEntity.records.map((r)=>{
                        return r.dataSource+':'+r.recordId
                    });
                    retObj.rows['DATA_SOURCES'] = ent.resolvedEntity.records.map((matchedRecord)=>{
                        return {
                            dataSource: matchedRecord.dataSource,
                            recordId: matchedRecord.recordId
                        } as SzFocusRecordId;
                    })
                }
                return retObj;
            });
            // go over the initial rows
            // now for each item in an entities features, check if it can be found in 
            // the matchInfo results
            results.forEach((ent)=>{
                for(let fKey in ent.features) {

                    if(data.matchInfo && data.matchInfo.featureScores && data.matchInfo.featureScores[fKey]) {
                        // there was some sort of related why not scoring done on feature
                        // double check each one
                        let matchInfoForFeature = data.matchInfo.featureScores[fKey];
                        let fArr = ent.features[fKey];
                        // make sure feat row exists
                        if(!ent.rows) { ent.rows = {}; }
                        if(!ent.rows[fKey]) { ent.rows[fKey] = []; }
                        // add this to "rows"
                        ent.rows[fKey]  = ent.rows[fKey].concat(fArr);
                        // now extend with scoring data
                        ent.rows[fKey] = ent.rows[fKey].map((feat)=> {
                            /*
                            let scoreThatHasFeature = matchInfoForFeature.find((fScore) => {
                                let y = feat.featureDetails.find((fDetail)=>{
                                    let hasCandidateFeature = fDetail.internalId === fScore.candidateFeature.featureId;
                                    let hasInboundFeature   = fDetail.internalId === fScore.inboundFeature.featureId;
                                    return (hasCandidateFeature || hasInboundFeature) ? true : false;
                                });
                                if(y) {
                                    return true;
                                }
                                return false;
                            });
                            // default to "feature"
                            let _valueToAdd: SzEntityFeature | SzFeatureScore = feat;
                            // if this is a scored feature we want the 
                            // extra metadata so we can color etc
                            if(scoreThatHasFeature) {
                                _valueToAdd = scoreThatHasFeature;
                            }
                            // add this to "rows"
                            if(!ent.rows) { ent.rows = {}; }
                            if(!ent.rows[fKey]) { ent.rows[fKey] = []; }
                            ent.rows[fKey].push(_valueToAdd);*/
                            return feat;
                        });
                    } else {
                        // add this to "rows"
                        if(!ent.rows) { ent.rows = {}; }
                        if(!ent.rows[fKey]) { ent.rows[fKey] = []; }
                        ent.rows[fKey]  = ent.features[fKey];
                    }
                }
            });
        }
        console.log(`transformWhyNotResultData: ${this.entityIds.join(',')}`, results);

        /*
        if(data && this.entityIds && this.entityIds.forEach) {
            // first entity id will be values for
            this.entityIds.forEach((entityId, eInd) => {
                let colFeatureKey = eInd === 0 ? 'inboundFeature' : 'candidateFeature'
                // this object will become the column
                let _colTemp: SzWhyEntityColumn = {
                    entityId: (entityId as number)
                }  
                if(data && data.matchInfo) {
                    _colTemp.matchInfo = data.matchInfo;
                    if(data.matchInfo.whyKey && data.matchInfo.resolutionRule) { _colTemp.whyResult = {key: data.matchInfo.whyKey, rule: data.matchInfo.resolutionRule };}
                }
                if(data.matchInfo && data.matchInfo.featureScores) {
                    for(let featKey in data.matchInfo.featureScores) {
                        let featArr = data.matchInfo.featureScores[featKey];
                        if(featArr && featArr.length > 0) {
                            // we should add this to "rows" collection
                            _colTemp.rows[featKey] = featArr;
                        }
                    }
                }
            });
            
        }*/
        /**
         * 
SzWhyEntityColumn extends SzWhyEntityResult, SzWhyPerspective {
    internalId: number,
    dataSources: string[],
    whyResult?: {key: string, rule: string},
    rows: {[key: string]: Array<SzFeatureScore | SzCandidateKey | SzEntityFeature>}
    formattedRows?: {[key: string]: string | string[] | SzWhyEntityHTMLFragment | SzWhyEntityHTMLFragment[] }
}
        */
        return results;
        /*
        let results = data.map((matchWhyResult) => {
        // extend
        let _tempRes: SzWhyEntityColumn = Object.assign({
            internalId: matchWhyResult.perspective.internalId,
            dataSources: matchWhyResult.perspective.focusRecords.map((record) => {
            return record.dataSource +':'+ record.recordId;
            }),
            whyResult: (matchWhyResult.matchInfo.matchLevel !== 'NO_MATCH') ? {key: matchWhyResult.matchInfo.whyKey, rule: matchWhyResult.matchInfo.resolutionRule} : undefined,
            rows: Object.assign({
            'INTERNAL_ID': [matchWhyResult.perspective.internalId],
            'DATA_SOURCES': matchWhyResult.perspective.focusRecords,
            'WHY_RESULT': (matchWhyResult.matchInfo.matchLevel !== 'NO_MATCH') ? {key: matchWhyResult.matchInfo.whyKey, rule: matchWhyResult.matchInfo.resolutionRule} : undefined
            }, matchWhyResult.matchInfo.featureScores)
        },  matchWhyResult.perspective, matchWhyResult);
        for(let k in _tempRes.rows) {
            if(_tempRes && _tempRes.rows && _tempRes.rows[k] && _tempRes.rows[k].sort) {
            _tempRes.rows[k] = _tempRes.rows[k].sort((a, b)=>{
                if ( (a as SzFeatureScore).candidateFeature.featureValue < (b as SzFeatureScore).candidateFeature.featureValue ){
                return -1;
                }
                if ( (a as SzFeatureScore).candidateFeature.featureValue > (b as SzFeatureScore).candidateFeature.featureValue ){
                return 1;
                }
                return 0;
            });
            }
        }
        
        if(matchWhyResult.matchInfo && matchWhyResult.matchInfo.candidateKeys) {
            // add "candidate keys" to features we want to display
            for(let _k in matchWhyResult.matchInfo.candidateKeys) {
            if(!_tempRes.rows[_k]) {
                _tempRes.rows[_k] = matchWhyResult.matchInfo.candidateKeys[_k].sort((a, b)=>{
                if ( a.featureValue < b.featureValue ){
                    return -1;
                }
                if ( a.featureValue > b.featureValue ){
                    return 1;
                }
                return 0;
                });
            } else {
                // selectively add
                // aaaaaaactually, if we already have entries for this field we should probably just 
                // use those instead
                let _featuresOmittingExsiting = matchWhyResult.matchInfo.candidateKeys[_k].filter((_cFeat) => {
                let alreadyHasFeat = _tempRes.rows[_k].some((_rowFeat) => {
                    return (_rowFeat as SzFeatureScore).candidateFeature.featureId === _cFeat.featureId;
                });
                return !alreadyHasFeat;
                }).sort((a, b)=>{
                if ( a.featureValue < b.featureValue ){
                    return -1;
                }
                if ( a.featureValue > b.featureValue ){
                    return 1;
                }
                return 0;
                });
                //_tempRes.rows[_k] = _tempRes.rows[_k].concat(matchWhyResult.matchInfo.candidateKeys[_k]);
                _tempRes.rows[_k] = _tempRes.rows[_k].concat(_featuresOmittingExsiting);
            }
            }
        }
        // list out other "features" that may be present on the resolved entity, but not
        // present in the why result feature scores or candidate keys
        // NOTE: we only do this for the item who's "internalId" is the same as the "entityId"
        if(entities && entities.length > 0 && _tempRes.internalId === _tempRes.entityId) {
            let entityResultForInternalId = entities.find((_entRes) => {
            return _entRes.resolvedEntity && _entRes.resolvedEntity.entityId === _tempRes.internalId;
            });
            if(entityResultForInternalId && entityResultForInternalId.resolvedEntity){
            let entityForInternalId = entityResultForInternalId.resolvedEntity;
            if(entityForInternalId.features) {
                // merge feature data
                for(let _fKey in entityForInternalId.features) {
                if(!_tempRes.rows[_fKey]) {
                    _tempRes.rows[_fKey] = entityForInternalId.features[_fKey];
                } else {
                    // selectively add
                    // hmmmm..... .. actuuuuuaaaaaallly..
                }
                }
            }
            }
        }
        return _tempRes;
        });
        return results;
        */
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
  private _title;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
  private set maximized(value: boolean) { this._isMaximized = value; }

  @ViewChild('whyEntitiesTag') whyEntitiesTag: SzWhyEntitiesComparisonComponent;

  public get title(): string {
    if(this._title) return this._title;

    this._title = `Why NOT for Entities (${this.entities.join(', ')})`;
    return this._title
  }

  public okButtonText: string = "Ok";
  public get showDialogActions(): boolean {
    return this._showOkButton;
  }

  public get entities(): SzEntityIdentifier[] {
    return this._entities;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private cssClassesService: SzCSSClassService) {
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
  public onRowsChanged(data: SzWhyFeatureRow[]) {
    console.warn(`onRowsChanged: `, data);
    if(data && data.length > 8) {
      // set default height to something larger
      this.cssClassesService.setStyle(`body`, "--sz-why-dialog-default-height", `800px`);
    } else {
      this.cssClassesService.setStyle(`body`, "--sz-why-dialog-default-height", `var(--sz-why-dialog-default-height)`);
    }
  }
  public toggleMaximized() {
    //this.maximized = !this.maximized;
    if(!this.maximized) {
      this.maximized = true;
      this.cssClassesService.setStyle(`body`, "--sz-why-dialog-min-height", `98vh`);
    } else {
      this.maximized = false;
      this.cssClassesService.setStyle(`body`, "--sz-why-dialog-min-height", `400px`);
    }
  }
  public onDoubleClick(event) {
    this.toggleMaximized();
  }
  public onEntitiesChanged(entities: SzEntityData[]) {
    let _names: string[];
    console.log(`onEntitiesChanged: `, entities);
    if(entities && entities.length > 0 && entities.forEach) {
      let _title = `Why `;
      entities.forEach((entity: SzEntityData, _ind) => {
        let _bName = entity.resolvedEntity.bestName ? entity.resolvedEntity.bestName : entity.resolvedEntity.entityName;
        let _eId = entity.resolvedEntity.entityId;
        _title += `${_bName}(${_eId})` + (_ind === (entities.length - 1) ? '' : ' and ');
      })

      _title += ' did not resolve';
      this._title = _title;
    }
  }
}