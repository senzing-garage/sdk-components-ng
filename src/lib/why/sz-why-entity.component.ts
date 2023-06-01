import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { EntityDataService, SzAttributeSearchResult, SzCandidateKey, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityFeatureDetail, SzEntityFeatureStatistics, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzMatchedRecord, SzRecordId, SzWhyEntityResponse, SzWhyEntityResult } from '@senzing/rest-api-client-ng';
import { filter, forkJoin, Observable, ReplaySubject, Subject, zip, zipAll } from 'rxjs';
import { parseSzIdentifier } from '../common/utils';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzWhyEntityColumn, SzWhyEntityHTMLFragment, SzWhyFeatureRow } from '../models/data-why';



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
  private _orderedFeatureTypes: string[] | undefined;
  private _data: SzWhyEntityResult[];
  private _entities: SzEntityData[];
  /** data thats ready to be used for UI/UX rendering, multiple fields
   * concatenated in to meta-fields, embedded line breaks, html tags etc.
   */
  private _formattedData;
  /** shaped data is data that has been extended, hoisted, joined etc but not 
   * necessarily containing and data that can be directly rendered.
   */
  private _shapedData;
  /** rows that will be rendered vertically. auto generated from #getRowsFromData */
  private _rows: SzWhyFeatureRow[] = [
    {key: 'INTERNAL_ID',   title: 'Internal ID'},
    {key: 'DATA_SOURCES',  title: 'Data Sources'},
    {key: 'WHY_RESULT',    title: 'Why Result'}
  ];

  private _headers: string[];
  private _featureStatsById: Map<number, SzEntityFeatureDetail>;
  
  public get isLoading(): boolean {
    return this._isLoading;
  }
  public set isLoading(value: boolean) {
    this._isLoading = value;
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

  public get formattedData() {
    return this._formattedData;
  }

  public get headers() {
    return this._headers;
  }
  public get rows() {
    return this._rows;
  }

  getWhyData() {
    return this.entityData.whyEntityByEntityID(parseSzIdentifier(this.entityId), true, true, true, SzDetailLevel.VERBOSE, SzFeatureMode.REPRESENTATIVE, false, false)
  }
  getOrderedFeatures() {
    return this.configDataService.getOrderedFeatures(true);
  }

  getRowValuesForData(rowKey: string, data?: SzWhyEntityColumn[]) {
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

  getHeadersFromData(data: SzWhyEntityColumn[]) {
    let cells = [];
    if(data && data.length) {
      cells = data.map((dC) => {
        return dC.internalId;
      });
    }
    return cells;
  }

  getRowsFromData(data: SzWhyEntityColumn[], orderedFeatureTypes?: string[]) {
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
                //let _featValue: SzWhyFeatureWithStats = _feat;
                if(!retVal) {
                  // make sure we've got a map initialized
                  retVal = new Map<number, SzEntityFeatureDetail>();
                }
                // do "primaryValue" first
                if(retVal.has(_feat.primaryId)) {
                  // ruh roh
                  console.warn(`Ruh Roh! (feature stat by id overwrite): ${_feat.primaryId}`);
                } else {
                 /*if(_featValue && _featValue.featureDetails && _featValue.featureDetails.length === 1) {
                    // lift value up for map lookup
                    _featValue.primaryStatistics = _featValue.featureDetails[0].statistics;
                  } else {
                    // I guuuuuueeessss we... search for one that has its "internalId" set to the 
                    // same as the "primaryId" ??? .. 
                    let statsForPrimary = _featValue.featureDetails.find((fDet) => {
                      return fDet.internalId === _feat.primaryId;
                    });
                    // STARLIFTER YYEEEEEAAH BABY!
                    if(statsForPrimary) {
                      _featValue.primaryStatistics = Object.assign({featureValue: _featValue.primaryValue}, statsForPrimary.statistics);
                    }
                  }*/
                  if(_feat && _feat.featureDetails && _feat.featureDetails.forEach) {
                    _feat.featureDetails.forEach((_featDetailItem) => {
                      if(!retVal.has(_featDetailItem.internalId)) {
                        // add stat
                        retVal.set(_featDetailItem.internalId, _featDetailItem);
                      }
                    });
                  }
                }
                // add "duplicateValues" if they exist
                /*
                if(_feat.duplicateValues && _feat.duplicateValues.length > 0) {
                  if (_feat.featureDetails.length > 0) {
                    // pull the statistics for the item in "featureDetails" whos "featureValue" matches the "duplicateValue" Item
                    let _duplicateValuesToFeatureDetails = _feat.duplicateValues.map((dupeValue) => {
                      return _feat.featureDetails.find((fDet) => {
                        return fDet.featureValue === dupeValue;
                      })
                    }).filter((fVal) => { return fVal && fVal.statistics; })
                    if(_duplicateValuesToFeatureDetails.length > 0) {
                      if(!_featValue.duplicateStatistics) {
                        _featValue.duplicateStatistics = new Map<number, SzEntityFeatureStatistics>();
                      }
                      _duplicateValuesToFeatureDetails.forEach((dupeStat) => {
                        _featValue.duplicateStatistics.set(dupeStat.internalId, 
                          Object.assign({
                            featureValue: dupeStat.featureValue
                          }, dupeStat.statistics) 
                        );
                      });
                    }
                  }
                }*/
                //retVal.set(_feat.primaryId, _featValue);
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
  /** add specific formatted and render ready fields like "rawValue", "formattedValue", "htmlValue" */
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
      /*
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
              }
            }
          }
        }
      }*/
      
      return _tempRes;
    });
    return results;
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
    //this.toggleMaximized();
  }
}
