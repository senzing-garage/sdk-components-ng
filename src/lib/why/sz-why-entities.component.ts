import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzDataSourceRecordSummary, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzRecordId, SzWhyEntitiesResponse, SzWhyEntitiesResponseData, SzWhyEntitiesResult, SzWhyEntityResponseData } from '@senzing/rest-api-client-ng';
import { BehaviorSubject, Observable, ReplaySubject, Subject, takeUntil, throwError, zip } from 'rxjs';
import { debounceTime, filter } from "rxjs/operators";

import { parseSzIdentifier } from '../common/utils';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzWhyEntityComponent } from './sz-why-entity.component';
import { SzWhyEntityColumn, SzWhyFeatureRow } from '../models/data-why';
import { SzWhyReportBaseComponent } from './sz-why-report-base.component';

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
            //console.warn('SzWhyEntityComponent.getWhyData: ', results, this._rows, this._shapedData);
            this.onResult.emit(this._data);
            this.onRowsChanged.emit(this._rows);
            },
            error: (err) => {
            console.error(err);
            }
        });
    }
  
    /** when the respone from the server is returned this even is emitted */
    @Output() onResult: EventEmitter<SzWhyEntitiesResult>     = new EventEmitter<SzWhyEntitiesResult>();

    // --------------------------- data manipulation subs and routines ---------------------------

    @Input() entityIds: SzEntityIdentifier[];

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
        console.log(`transformData: `, data);
        //console.log(`_featureStatsById: `, _featureStatsById);
        let results = [];
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
  public onDataResponse(data: any) {
    let _names: string[];
    console.log(`onDataResponse: `, data);
    /*if(data && data.entities && data.entities.length > 0 && data.entities.forEach) {
      let _title = `Why `;
      data.entities.forEach((entity: SzEntityData, _ind) => {
        let _bName = entity.resolvedEntity.bestName ? entity.resolvedEntity.bestName : entity.resolvedEntity.entityName;
        let _eId = entity.resolvedEntity.entityId;
        _title += `${_bName}(${_eId})` + (_ind === (data.entities.length - 1) ? '' : ' and ');
      })

      _title += ' did not resolve';
      this._title = _title;
    }*/
  }
}