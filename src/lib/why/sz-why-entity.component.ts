import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzCandidateKey, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityFeatureDetail, SzEntityFeatureStatistics, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { filter, forkJoin, Observable, ReplaySubject, Subject, zip, zipAll } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzWhyEntityColumn, SzWhyEntityHTMLFragment, SzWhyFeatureRow } from '../models/data-why';
import { SzCSSClassService } from '../services/sz-css-class.service';



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
  /**
   * place to store the original data given back from the network response, but before 
   * processing transforms and formatting.
   * @internal
   */
  private _data: SzWhyEntityResult[];
  /**
   * entity nodes returned in the why response from the server.
   * @internal
   */
  private _entities: SzEntityData[];
  /**
   * stats for each feature found in the entity. 
   * @internal 
   */
  private _featureStatsById: Map<number, SzEntityFeatureDetail>;
  /** data thats ready to be used for UI/UX rendering, multiple fields
   * concatenated in to meta-fields, embedded line breaks, html tags etc.
   */
  private _formattedData;
  /** 
   * an array of the columns to display in the table
   * @internal 
   */
  private _headers: string[];
  /** returns true when waiting for network requests to complete. 
   * @internal
   */
  private _isLoading = false;
  /** features in the order found in the server config 
   * @internal
   */
  private _orderedFeatureTypes: string[] | undefined;
  /** 
   * rows that will be rendered vertically. auto generated from #getRowsFromData 
   * @internal
   */
  private _rows: SzWhyFeatureRow[] = [
    {key: 'INTERNAL_ID',   title: 'Internal ID'},
    {key: 'DATA_SOURCES',  title: 'Data Sources'},
    {key: 'WHY_RESULT',    title: 'Why Result'}
  ];
  /** 
   * shaped data is data that has been extended, hoisted, joined etc but not 
   * necessarily containing data that can be directly rendered.
   * @internal
   */
  private _shapedData;

  // -------------------------- component input and output parameters --------------------------
  /** the entity id to display the why report for. */
  @Input()  entityId: SzEntityIdentifier;
  /** if more than two records the view can be limited to just explicitly listed ones */
  @Input()  recordsToShow: SzRecordId[] | undefined;
  /** returns true when waiting for network requests to complete */
  @Output() loading: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** when the respone from the server is returned this even is emitted */
  @Output() onResult: EventEmitter<SzWhyEntityResult[]>     = new EventEmitter<SzWhyEntityResult[]>();
  /** when the row definitions(that list all the fields that will be displayed) have been 
   * pulled from the results this even is emitted */
  @Output() onRowsChanged: EventEmitter<SzWhyFeatureRow[]>  = new EventEmitter<SzWhyFeatureRow[]>();

  // ----------------------------------- getters and setters -----------------------------------
  /** return the preformatted data after the transforms and renderers have generated 
   * html compatible rows etc.
  */
  public get formattedData() {
    return this._formattedData;
  }
  /**  */
  public get headers() {
    return this._headers;
  }
  /** returns true when waiting for network requests to complete. */
  public get isLoading(): boolean {
    return this._isLoading;
  }
  /** returns true when waiting for network requests to complete. 
   * @internal
   */
  public set isLoading(value: boolean) {
    this._isLoading = value;
  }
  /**
   * returns a Object who's keys correspond to a particular type of 'featureType' of each type of feature 
   * in the "matchInfo.featureScores" result of why api response.
   * @internal
   */
  private get renderers() {
    let fBId = this._featureStatsById;
    let _colors = {'CLOSE':'green','SAME':'green'};
    let featureIsInMatchKey = (f, mk): boolean => {
      let _r = false;
      if(mk) {
        _r = mk.indexOf(f) > -1;
      }
      return _r;
    } 
    return {
      'NAME': (data: (SzFeatureScore | SzCandidateKey)[], fieldName?: string, mk?: string) => {
        let retVal = '';
        let _filteredData = data;
        if(data && data.filter && data.some) {
          let hasSame       = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'SAME'; });
          let hasClose      = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'CLOSE'; });
          let hasPlausible  = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'PLAUSIBLE'; });
          let hasNoChance   = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'NO_CHANCE'; });
          let filterBuckets = hasSame ? ['SAME'] : (hasClose ? ['CLOSE'] : (hasPlausible ? ['PLAUSIBLE']: (hasNoChance ? ['NO_CHANCE'] : false)));
          _filteredData = filterBuckets && filterBuckets.length > 0 ? data.filter((addrScore) => {
            return (filterBuckets as string[]).indexOf((addrScore as SzFeatureScore).scoringBucket) > -1;
          }) : data;
        }
        _filteredData.forEach((_feature, i) => {
          let le = (i < _filteredData.length-1) ? '\n': '';
          if((_feature as SzFeatureScore).inboundFeature || (_feature as SzFeatureScore).candidateFeature) {
            let f = (_feature as SzFeatureScore);
            let c = _colors[f.scoringBucket] && featureIsInMatchKey('NAME', mk) ? 'color-'+ _colors[f.scoringBucket] : '';
            if(f.inboundFeature) { 
              retVal += `<span class="${c}">`+f.inboundFeature.featureValue;
              let stats = fBId && fBId.has(f.inboundFeature.featureId) ? fBId.get(f.inboundFeature.featureId) : false;
              if(stats && stats.statistics && stats.statistics.entityCount) {
                retVal += ` [${stats.statistics.entityCount}]`;
              }
              retVal += le;
              if(f.inboundFeature.featureId !== f.candidateFeature.featureId) {
                // add nesting
                retVal += '\n<span class="child-same"></span>';
              }
            }
            if(f.candidateFeature && ((f.inboundFeature && f.inboundFeature.featureId !== f.candidateFeature.featureId) || !f.inboundFeature)) {
              retVal += `${f.candidateFeature.featureValue}${le}`;
              if(f.nameScoringDetails) {
                let _nameScoreValues  = [];
                if(f.nameScoringDetails.fullNameScore)    { _nameScoreValues.push(`full:${f.nameScoringDetails.fullNameScore}`);}
                if(f.nameScoringDetails.orgNameScore)     { _nameScoreValues.push(`org:${f.nameScoringDetails.orgNameScore}`);}
                if(f.nameScoringDetails.givenNameScore)   { _nameScoreValues.push(`giv:${f.nameScoringDetails.givenNameScore}`);}
                if(f.nameScoringDetails.surnameScore)     { _nameScoreValues.push(`sur:${f.nameScoringDetails.surnameScore}`);}
                if(f.nameScoringDetails.generationScore)  { _nameScoreValues.push(`gen:${f.nameScoringDetails.generationScore}`);}

                retVal += (_nameScoreValues.length > 0 ? `(${_nameScoreValues.join('|')})` : '');
                retVal += '</span>'+le;
              }
            } else if(f.inboundFeature) {
              retVal += '</span>'
            }
          }
        });
        return retVal;
      },
      'ADDRESS': (data: (SzFeatureScore | SzCandidateKey)[], fieldName?: string, mk?: string) => {
        let retVal = '';
        let _filteredData = data;
        if(data && data.filter && data.some) {
          let limitToXResults = 1;
          let hasSame       = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'SAME'; });
          let hasClose      = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'CLOSE'; });
          let hasPlausible  = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'PLAUSIBLE'; });
          let hasNoChance   = data.some((_a)=>{ return (_a as SzFeatureScore).scoringBucket === 'NO_CHANCE'; });
          let filterBuckets = hasSame ? ['SAME'] : (hasClose ? ['CLOSE'] : (hasPlausible ? ['PLAUSIBLE']: (hasNoChance ? ['NO_CHANCE'] : false)));
          _filteredData = filterBuckets && filterBuckets.length > 0 ? data.filter((addrScore) => {
            let isFeatureScore = (addrScore as SzFeatureScore).scoringBucket;
            return isFeatureScore ? (filterBuckets as string[]).indexOf((addrScore as SzFeatureScore).scoringBucket) > -1 : true;
          }) : data;
          if(limitToXResults > 0){ _filteredData = _filteredData.slice(undefined, limitToXResults) }
        }
        if(_filteredData && _filteredData.forEach) {
          _filteredData.forEach((a, i) => {
            let le = (i < _filteredData.length-1) ? '\n': '';
            if((a as SzFeatureScore).candidateFeature) {
              let _a = (a as SzFeatureScore);
              let c = _colors[_a.scoringBucket] && featureIsInMatchKey('ADDRESS', mk) ? 'color-'+ _colors[_a.scoringBucket] : '';
              if(_a.inboundFeature) {
                retVal += `<span class="${c}">${_a.inboundFeature.featureValue}`;
                let stats = fBId && fBId.has(_a.inboundFeature.featureId) ? fBId.get(_a.inboundFeature.featureId) : false;
                if(stats && stats.statistics && stats.statistics.entityCount) {
                  retVal += ` [${stats.statistics.entityCount}]`;
                }
                retVal += '\n<span class="child-same"></span>';
              }
              retVal += `${_a.candidateFeature.featureValue}`;
              if(_a.score) { retVal += ` (full: ${_a.score})`};
              retVal += '</span>';
            }
          });
        }
        return retVal;
      },
      'DATA_SOURCES': (data: SzFocusRecordId[], fieldName?: string, mk?: string) => {
        let retVal = '';
        data.forEach((r, i) => {
          let le = (i < data.length-1) ? '\n': '';
          retVal += `<span class="color-ds">${r.dataSource}</span>: ${r.recordId}${le}`;
        });
        return retVal;
      },
      'WHY_RESULT': (data: {key: string, rule: string}, fieldName?: string, mk?: string) => {
        // colorize match key
        let _value = data && data.key ? data.key : '';
        if(data && data.key) {
          // tokenize
          let _pairs  = data.key.split('+').filter((t)=>{ return t !== undefined && t !== null && t.trim() !== ''; });
          let _values = _pairs.map((t)=>{ return t.indexOf('-') > -1 ? {prefix: '-', value: t.replaceAll('-','')} : {prefix: '+', value: t}});
          // now put it back together with colors
          _value = _values.map((t) => { return `<span class="${t.prefix === '-' ? 'color-red' : 'color-green'}">${t.prefix+t.value}</span>`; }).join('');
          return `<span class="color-mk">${_value}</span>\n`+ (data && data.rule ? `<span class="indented"></span>Principle: ${data.rule}`:'');
        } else {
          return `<span class="color-red">not found!</span>\n`;
        }
      },
      default: (data: (SzFeatureScore | SzCandidateKey | SzEntityFeature)[], fieldName?: string, mk?: string): string | string[] | SzWhyEntityHTMLFragment => {
        let retVal = '';
        if(data && data.forEach){
          data.forEach((_feature, i) => {
            let le = (i < data.length-1) ? '\n': '';
            if((_feature as SzEntityFeature).primaryValue) {
              // this is a entity feature, make sure we're not duplicating values
              let f = (_feature as SzEntityFeature);
              let stats = fBId && fBId.has(f.primaryId) ? fBId.get(f.primaryId).statistics : false;
              retVal += f.primaryValue;
              if(stats && stats.entityCount) {
                retVal += ` [${stats.entityCount}]`;
              }
              retVal += le;
            } else if((_feature as SzFeatureScore).candidateFeature) {
              // feature score
              let f = (_feature as SzFeatureScore);
              let c = _colors[f.scoringBucket] && featureIsInMatchKey(fieldName, mk) ? 'color-'+ _colors[f.scoringBucket] : '';
              let stats = fBId && fBId.has(f.candidateFeature.featureId) ? fBId.get(f.candidateFeature.featureId).statistics : false;
              retVal += `<span class="${c}">`+f.candidateFeature.featureValue;
              if(stats && stats.entityCount) {
                retVal += ` [${stats.entityCount}]`;
              }
              retVal += '</span>'+le;
            } else if((_feature as SzCandidateKey).featureType) {
              // candidate key
              let f = (_feature as SzCandidateKey);
              let stats = fBId && fBId.has(f.featureId) ? fBId.get(f.featureId).statistics : false;
              retVal += f.featureValue;
              if(stats && stats.entityCount) {
                retVal += ` [${stats.entityCount}]`;
              }
              retVal += le;
            } else if(_feature) {
              // nnnnnooooooot suuuuure, maybe single value???
              // just call toString on it for now
              retVal += new String(_feature);
              retVal += le;
            }
          });
        }
        return retVal;
      }
    }
  }
  /** return the list of all rows that will be displayed in thecomponent */
  public get rows() {
    return this._rows;
  }

  constructor(
    public configDataService: SzConfigDataService,
    private entityData: EntityDataService) {
  }
  ngOnInit() {
    this._isLoading = true;
    this.loading.emit(true);

    zip(
      this.getWhyData(),
      this.getOrderedFeatures()
    ).subscribe({
      next: (results) => {
        this._isLoading = false;
        this.loading.emit(false);
        this._data          = results[0].data.whyResults;
        this._entities      = results[0].data.entities;
        // add any fields defined in initial _rows value to the beginning of the order
        // custom/meta fields go first basically
        this._orderedFeatureTypes = this._rows.map((fr)=>{ return fr.key}).concat(results[1]);
        this._featureStatsById  = this.getFeatureStatsByIdFromEntityData(this._entities);
        console.log(`SzWhyEntityComponent._featureStatsById: `, this._featureStatsById);

        this._shapedData    = this.transformData(this._data, this._entities);
        this._formattedData = this.formatData(this._shapedData);
        // now that we have all our "results" grab the features so we 
        // can iterate by those and blank out cells that are missing
        this._rows          = this.getRowsFromData(this._shapedData, this._orderedFeatureTypes);
        this._headers       = this.getHeadersFromData(this._shapedData);
        console.warn('SzWhyEntityComponent.getWhyData: ', results, this._rows, this._shapedData);
        this.onResult.emit(this._data);
        this.onRowsChanged.emit(this._rows);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // --------------------------- data manipulation subs and routines ---------------------------

  /** call the /why api endpoint and return a observeable */
  private getWhyData() {
    return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
  }
  /** get the features in the order found in the server config */
  private getOrderedFeatures() {
    return this.configDataService.getOrderedFeatures(true);
  }

  /** when iterating over each cell for the table this method is called to pull the field value
   * from the "formattedRows" which contain html markup.
   */
  public getRowValuesForData(rowKey: string, data?: SzWhyEntityColumn[]) {
    let retVal = [];
    data = data && data !== undefined ? data : this._formattedData;
    if(data && data.forEach) {
      data.forEach((dC) => {
        if(dC.formattedRows && dC.formattedRows[rowKey]) {
          retVal.push(dC.formattedRows[rowKey])
        } else {
          retVal.push(undefined);
        }
      });
    }
    return retVal;
  }
  /**
   * get an array of the columns to display in the table.
   * @internal
   */
  private getHeadersFromData(data: SzWhyEntityColumn[]) {
    let cells = [];
    if(data && data.length) {
      cells = data.map((dC) => {
        return dC.internalId;
      });
    }
    return cells;
  }
  /**
   * generate a array of rows to display from the data provided. Returns an array of all unique field values 
   * found in each why result.
   * @internal
   */
  private getRowsFromData(data: SzWhyEntityColumn[], orderedFeatureTypes?: string[]): SzWhyFeatureRow[] {
      let _rows         = this._rows;
      data.forEach((res) => {
        let _featuresOfResult = res.rows;
        let _keysOfFeatures = Object.keys(_featuresOfResult);
        _keysOfFeatures.forEach((fKey)=> {
          let rowAlreadyDefined = _rows.some((f) => {
            return f.key === fKey;
          });
          if(!rowAlreadyDefined) {
            // add feature to list
            _rows.push({key: fKey, title: fKey});
          }
        });
      });
      // if we have features from config we should return the  
      // values in that order
      if(orderedFeatureTypes && orderedFeatureTypes.length > 0) {
        _rows.sort((
            a: SzWhyFeatureRow, 
            b: SzWhyFeatureRow
        ) => {
          return orderedFeatureTypes.indexOf(a.key) - orderedFeatureTypes.indexOf(b.key);
        });
      }
      return _rows;
  }
  /** generate a map of feature stats, keyed by id so we can get things like "duplicate" counts and 
   * other meta data for display.
   * @internal
   */
  private getFeatureStatsByIdFromEntityData(entities: SzEntityData[]): Map<number, SzEntityFeatureDetail> {
    let retVal: Map<number, SzEntityFeatureDetail>;
    if(entities && entities.length > 0) {
      entities.forEach((rEntRes) => {
        let _resolvedEnt = rEntRes.resolvedEntity;
        if(_resolvedEnt && _resolvedEnt.features) {
          for(let _fName in _resolvedEnt.features) {
            let _fTypeArray = _resolvedEnt.features[_fName];
            if(_fTypeArray && _fTypeArray.forEach) {
              _fTypeArray.forEach((_feat) => {
                if(!retVal) {
                  // make sure we've got a map initialized
                  retVal = new Map<number, SzEntityFeatureDetail>();
                }
                // do "primaryValue" first
                if(retVal.has(_feat.primaryId)) {
                  // ruh roh
                  console.warn(`Ruh Roh! (feature stat by id overwrite): ${_feat.primaryId}`);
                } else {
                  // for each item in the details array create an entry by the items internal featureId
                  if(_feat && _feat.featureDetails && _feat.featureDetails.forEach) {
                    _feat.featureDetails.forEach((_featDetailItem) => {
                      if(!retVal.has(_featDetailItem.internalId)) {
                        // add stat
                        retVal.set(_featDetailItem.internalId, _featDetailItem);
                      }
                    });
                  }
                }
              });
            }
          }
        }
      });
    }
    if(retVal && retVal.size > 0) {
      // sort array by id's fer goblin-sake
      retVal = new Map([...retVal.entries()].sort((a, b) => {
        if ( a[0] < b[0] ){
          return -1;
        }
        if ( a[0] > b[0] ){
          return 1;
        }
        return 0;
      }));
    }
    return retVal;
  }
  /** 
   * Add "formattedRows" that correspond to the string renderer output of each item in each collection returned from the result of
   * #transformData's rows property. The result of each item is a string or collection of strings that is the result of either a 
   * renderer specific for that feature type, or the 'default' renderer found in this.renderers.default.
   * @internal
   */
  private formatData(data: SzWhyEntityColumn[], ): SzWhyEntityColumn[] {
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
  private transformData(data: SzWhyEntityResult[], entities: SzEntityData[]): SzWhyEntityColumn[] {
    let _internalIds   = data.map((matchWhyResult) => { return matchWhyResult.perspective.internalId; });
    let _featureKeys  = [];
    let _rows         = this._rows;
    // first create a map of all features found in "resolvedEntitie"'s by featureId for stat lookup
    
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
