import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityDataService, SzDetailLevel, SzEntityData, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntitiesResult, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { Observable, Subject, takeUntil, zip } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzWhyEntityColumn, SzWhyFeatureRow } from '../models/data-why';
import { SzCSSClassService } from '../services/sz-css-class.service';
import { SzWhyReportBaseComponent } from './sz-why-report-base.component';

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
export class SzWhyEntityComponent extends SzWhyReportBaseComponent implements OnInit, OnDestroy {
  protected override _data: SzWhyEntityResult[] | SzWhyEntitiesResult;
  // -------------------------- component input and output parameters --------------------------
  /** the entity id to display the why report for. */
  @Input()  override entityId: SzEntityIdentifier;
  /** when the respone from the server is returned this event is emitted */
  @Output() onResult: EventEmitter<SzWhyEntityResult[] | SzWhyEntitiesResult>     = new EventEmitter<SzWhyEntityResult[] | SzWhyEntitiesResult>();
  // ----------------------------------- getters and setters -----------------------------------

  constructor(
    override configDataService: SzConfigDataService,
    override entityData: EntityDataService) {
      super(configDataService, entityData);
  }
  override ngOnInit() {
    this._isLoading = true;
    this.loading.emit(true);

    zip(
      this.getData(),
      this.getOrderedFeatures()
    ).pipe(
        takeUntil(this.unsubscribe$)
    ).subscribe({
        next: this.onDataResponse.bind(this),
        error: (err) => {
            this._isLoading = false;
            if(err && err.url && err.url.indexOf && err.url.indexOf('configs/active') > -1) {
                // ok, we're going to try one more time without the active config
                this._isLoading = true;
                this.getData().pipe(
                    takeUntil(this.unsubscribe$)
                ).subscribe((res) => {
                    this.onDataResponse([res, undefined]);
                })
            }
        }
    });
  }

  // --------------------------- data manipulation subs and routines ---------------------------

  /** call the /why api endpoint and return a observeable */
  override getData(): Observable<SzWhyEntityResponse> {
    return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
  }
  /**
   * when the api requests respond this method properly sets up all the 
   * properties that get set/generated from some part of those requests
   * @interal
   */
  protected override onDataResponse(results: [SzWhyEntityResponse, string[]]) {
    this._isLoading = false;
    this.loading.emit(false);
    this._data          = results[0].data.whyResults;
    this._entities      = results[0].data.entities;
    // add any fields defined in initial _rows value to the beginning of the order
    // custom/meta fields go first basically
    if(results[1]){ 
      this._orderedFeatureTypes = this._rows.map((fr)=>{ return fr.key}).concat(results[1]);
    }
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
  }
  /**
   * Extends the data response from the why api with data found "rows" that can be more directly utilized by the rendering template.
   * Every why result column gets additional fields like "dataSources", "internalId", "rows", "whyResult" that are pulled, hoisted, 
   * or joined from other places. 
   * @internal
   */
  override transformData(data: SzWhyEntityResult[], entities: SzEntityData[]): SzWhyEntityColumn[] {
    console.log(`transformData: `, data);
    //console.log(`_featureStatsById: `, _featureStatsById);
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
                /*
                console.log(`${_fKey} existing: `,_tempRes.rows[_fKey]);
                let _featuresOmittingExsiting = entityForInternalId.features[_fKey].filter((_eFeat) => {
                  let alreadyHasFeat = _tempRes.rows[_fKey].some((_rowFeat) => {
                    let _retVal = false;
                    if((_rowFeat as SzCandidateKey).featureId) {
                      _retVal = (_rowFeat as SzCandidateKey).featureId === _eFeat.primaryId
                    }
                    if((_rowFeat as SzEntityFeature).primaryId) {
                      _retVal = (_rowFeat as SzEntityFeature).primaryId === _eFeat.primaryId
                    }
                    if((_rowFeat as SzFeatureScore).candidateFeature) {
                      _retVal = (_rowFeat as SzFeatureScore).candidateFeature.featureId === _eFeat.primaryId
                    }
                    return _retVal;
                  });
                  return !alreadyHasFeat;
                }).sort((a, b)=>{
                  if ( a.primaryValue < b.primaryValue ){
                    return -1;
                  }
                  if ( a.primaryValue > b.primaryValue ){
                    return 1;
                  }
                  return 0;
                });
                console.log(`\t${_fKey} omitted: `, _featuresOmittingExsiting);
                _tempRes.rows[_fKey] = _tempRes.rows[_fKey].concat(_featuresOmittingExsiting);
                */
              }
            }
          }
        }
      }
      return _tempRes;
    });
    return results;
  }
}

/**
 * This is the modal component wrapper used for optional built-in handling of "why" buttons
 * found in the entity detail header and records.
 * @internal
 */
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
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { entityId: SzEntityIdentifier, entityName?:string, records?: SzRecordId[], okButtonText?: string, showOkButton?: boolean },
    private cssClassesService: SzCSSClassService
    ) {
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
}
