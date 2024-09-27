import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityDataService, SzCandidateKey, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityFeatureDetail, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzWhyEntitiesResponse, SzWhyEntitiesResult } from '@senzing/rest-api-client-ng';
import { Observable, Subject, takeUntil, throwError, zip } from 'rxjs';

import { getMapFromMatchKey } from '../common/utils';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzEntityFeatureWithScoring, SzWhyEntityColumn, SzWhyEntityHTMLFragment, SzWhyFeatureRow } from '../models/data-why';
import { SzWhyReportBaseComponent } from './sz-why-report-base.component';
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
            this.getData(),
            this.getOrderedFeatures()
        ).pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe({
            next: this.onDataResponse.bind(this),
            error: (err, params?) => {
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
  
    /** when the respone from the server is returned this even is emitted */
    @Output() onResult: EventEmitter<SzWhyEntitiesResult>               = new EventEmitter<SzWhyEntitiesResult>();
    @Output() onEntitiesChanged: EventEmitter<SzEntityData[]>           = new EventEmitter<SzEntityData[]>();
    // --------------------------- data manipulation subs and routines ---------------------------

    @Input() entityIds: SzEntityIdentifier[];

    /** override renderers that may be different from "WHY" report */
    protected override get renderers() {
        let _retVal = this._renderers;
        let fBId    = this._featureStatsById;

        let _colors = {'CLOSE':'green','SAME':'green','NO_CHANCE':'red','PLAUSIBLE':'yellow','UNLIKELY':'yellow'};
        let featureIsInMatchKey = (f, mk): boolean => {
            f = (f === 'SURNAME') ? 'NAME' : f; // convert surname to name field
            let _r = false;
            if(mk) {
                _r = mk.indexOf(f) > -1;
            }
            return _r;
        }
        let featureIsInMatchKey2 = (f: SzEntityFeatureDetail, fieldName: string, featureScores?: SzFeatureScore[], mk?: string | Map<string, {prefix: string, value: string}>) => {
            let retVal = false;
            let matchKeyAsMap = mk && (mk as string).length ? getMapFromMatchKey((mk as string)) : (mk as Map<string, {prefix: string, value: string}>);
            if(matchKeyAsMap && matchKeyAsMap.size > 0 && matchKeyAsMap.has(fieldName)) {
                // if there is a matching score entry for the feature AAAAANNNNNDDD
                // the feature is p
                if(featureScores) {
                    //featWithScoring.featureScores'
                    // just grab the items from featureScores that have the correct id
                    let relevantFeatureScores = featureScores.filter((fs)=>{
                        return fs.candidateFeature.featureId === f.internalId || fs.inboundFeature.featureId === f.internalId;
                        //return fs.inboundFeature.featureId === f.internalId;
                    });
                    if(relevantFeatureScores && relevantFeatureScores.length > 0) {
                        // has at least one feature score that contains this items id
                        let mkAsPair = matchKeyAsMap.get(fieldName);
                        let featureScoreShouldBePositive    = mkAsPair && mkAsPair.prefix === '+';
                        let featureScoreShouldBeNegative    = mkAsPair && mkAsPair.prefix === '-';
                        let scoringBucketsForMK             = featureScoreShouldBeNegative ? ['NO_CHANCE'] : (featureScoreShouldBePositive ? ['CLOSE','SAME','PLAUSIBLE','UNLIKELY'] : []);
                        if(relevantFeatureScores.length > -1) {
                            retVal = scoringBucketsForMK.indexOf(relevantFeatureScores[0].scoringBucket) > -1 ? true : false;
                            //console.log(`is "${relevantFeatureScores[0].scoringBucket}" in [${scoringBucketsForMK.join(',')}] ? ${retVal}`, relevantFeatureScores, f);
                        }
                    }
                }
            }
            return retVal;
        }
        let sortByScore = (data: (SzFeatureScore | SzEntityFeatureWithScoring | SzCandidateKey)[]) => {
             // sort by feature scores if present
             data = data.sort((rowA, rowB)=>{
                let rowAAsScored    = (rowA as SzEntityFeatureWithScoring) && (rowA as SzEntityFeatureWithScoring).score ? (rowA as SzEntityFeatureWithScoring) : (rowA as SzFeatureScore);
                let rowBAsScored    = (rowB as SzEntityFeatureWithScoring) && (rowB as SzEntityFeatureWithScoring).score ? (rowB as SzEntityFeatureWithScoring) : (rowB as SzFeatureScore);
                let rowASortValue   = rowAAsScored.score ? rowAAsScored.score : (rowAAsScored as SzEntityFeatureWithScoring).primaryId;
                let rowBSortValue   = rowBAsScored.score ? rowBAsScored.score : (rowBAsScored as SzEntityFeatureWithScoring).primaryId;

                if(rowA && (rowAAsScored as SzEntityFeatureWithScoring).scoringDetails) {
                    rowASortValue = (rowAAsScored as SzEntityFeatureWithScoring).scoringDetails.score;
                }
                if(rowB && (rowBAsScored as SzEntityFeatureWithScoring).scoringDetails) {
                    rowBSortValue = (rowBAsScored as SzEntityFeatureWithScoring).scoringDetails.score;
                }

                if(rowAAsScored !== undefined && rowBAsScored !== undefined){
                    // we want to list 'descending' from highest score
                    return rowBSortValue - rowASortValue;
                }
                // for items with no scores move to bottom
                return -1;
            });
            return data;
        }
        let addFeatureToResult = (_feat: SzEntityFeatureDetail | SzFeatureScore, _scoreDetails: SzFeatureScore, _entityFeatDetails: SzEntityFeatureDetail[], mk?: string, fieldName?: string, valuesAlreadyAdded?: string[]) => {
            let valueAdded;
            let _retVal                 = '';
            let featIsInScore           = true;
            let stats;
            let featureIsScore          = (_feat as SzFeatureScore).inboundFeature ? true : false;
            let candidateIsInDetails    = false;
            let inboundIsInDetails      = false;
            let detailIds               = _entityFeatDetails.map((featDetail)=>{
                return featDetail.internalId;
            });
            let idsInScore              = [];
            if(_scoreDetails) {
                if(_scoreDetails.candidateFeature) idsInScore.push(_scoreDetails.candidateFeature.featureId);
                if(_scoreDetails.inboundFeature) idsInScore.push(_scoreDetails.inboundFeature.featureId);
            }
            if(featureIsScore) {
                stats           = fBId && fBId.has((_feat as SzFeatureScore).inboundFeature.featureId) ? fBId.get((_feat as SzFeatureScore).inboundFeature.featureId) : false;
                candidateIsInDetails    = detailIds.indexOf((_feat as SzFeatureScore).candidateFeature.featureId) > -1;
                inboundIsInDetails      = detailIds.indexOf((_feat as SzFeatureScore).inboundFeature.featureId) > -1;
            } else {
                featIsInScore   = idsInScore.indexOf((_feat as SzEntityFeatureDetail).internalId) > -1;
                stats           = fBId && fBId.has((_feat as SzEntityFeatureDetail).internalId) ? fBId.get((_feat as SzEntityFeatureDetail).internalId) : false;
            }            
            let c   = _scoreDetails && 
                ((valuesAlreadyAdded && valuesAlreadyAdded.length === 0) || !valuesAlreadyAdded) 
                && _colors[_scoreDetails.scoringBucket] && 
                featIsInScore && 
                featureIsInMatchKey(fieldName, mk) ? 'color-'+ _colors[_scoreDetails.scoringBucket] : '';
            let sb  = (_scoreDetails && _scoreDetails. scoringBucket) ? `score-${_scoreDetails.scoringBucket}` : '';
            let featureValue    = undefined;
            let externalVal     = undefined;
            if((_feat as SzFeatureScore).candidateFeature || (_feat as SzFeatureScore).inboundFeature) { 
                let hasExternalValue    = !candidateIsInDetails || !inboundIsInDetails;
                if(hasExternalValue) {
                    // ok, which one
                    if(candidateIsInDetails && !inboundIsInDetails) {
                        featureValue    = (_feat as SzFeatureScore).candidateFeature.featureValue;
                        externalVal     = (_feat as SzFeatureScore).inboundFeature.featureValue;
                    } else if(!candidateIsInDetails && inboundIsInDetails) {
                        featureValue    = (_feat as SzFeatureScore).inboundFeature.featureValue;
                        externalVal     = (_feat as SzFeatureScore).candidateFeature.featureValue;
                    } else {
                        // both external??
                        externalVal     = [(_feat as SzFeatureScore).inboundFeature.featureValue];
                        if(externalVal.indexOf((_feat as SzFeatureScore).candidateFeature.featureValue) < 0) externalVal.push((_feat as SzFeatureScore).candidateFeature.featureValue);
                        //console.warn(`BOTH EXT values!! ${externalVal}`, externalVal, (_feat as SzFeatureScore));
                    }
                } else {
                    // both local??
                    featureValue        = [(_feat as SzFeatureScore).inboundFeature.featureValue];
                    if(featureValue.indexOf((_feat as SzFeatureScore).candidateFeature.featureValue) < 0) featureValue.push((_feat as SzFeatureScore).candidateFeature.featureValue);
                    //console.warn(`BOTH local values!! ${featureValue}`, featureValue, (_feat as SzFeatureScore));
                }
            } else {
                featureValue    = (_feat as SzEntityFeatureDetail).featureValue;
            }

            if((valuesAlreadyAdded && valuesAlreadyAdded.indexOf(featureValue) == -1) || !valuesAlreadyAdded){
                if(_scoreDetails && ((valuesAlreadyAdded && valuesAlreadyAdded.length === 0) || !valuesAlreadyAdded)){
                    _retVal += `<div class="ws-nowrap line-text ${sb} ${c}">`;
                    if(featIsInScore){
                        valueAdded  = featureValue;
                        _retVal     += featureValue;
                        if(stats && stats.statistics && stats.statistics.entityCount) {
                            _retVal += ` [${stats.statistics.entityCount}]`;
                        }

                        if(['SAME','CLOSE','PLAUSIBLE'].indexOf(_scoreDetails.scoringBucket) > -1 && externalVal) {
                            _retVal += '\n<div><span class="child-node"></span>';
                            _retVal += externalVal;
                        }
                    } else {
                        valueAdded   = featureValue;
                        _retVal     += featureValue;
                        if(stats && stats.statistics && stats.statistics.entityCount) {
                            _retVal += ` [${stats.statistics.entityCount}]`;
                        }
                    }
                    
                    if(_scoreDetails.nameScoringDetails) {
                        let _nameScoreValues  = [];
                        if(_scoreDetails.nameScoringDetails.fullNameScore)    { _nameScoreValues.push(`full:${_scoreDetails.nameScoringDetails.fullNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.orgNameScore)     { _nameScoreValues.push(`org:${_scoreDetails.nameScoringDetails.orgNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.givenNameScore)   { _nameScoreValues.push(`giv:${_scoreDetails.nameScoringDetails.givenNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.surnameScore)     { _nameScoreValues.push(`sur:${_scoreDetails.nameScoringDetails.surnameScore}`);}
                        if(_scoreDetails.nameScoringDetails.generationScore)  { _nameScoreValues.push(`gen:${_scoreDetails.nameScoringDetails.generationScore}`);}
                        _retVal += (_nameScoreValues.length > 0 ? ` (${_nameScoreValues.join('|')})` : '');
                    } else if(_scoreDetails && _scoreDetails.score > -1) {
                        _retVal += ` (${_scoreDetails.score})`;
                    }
                    if(['SAME','CLOSE','PLAUSIBLE'].indexOf(_scoreDetails.scoringBucket) > -1) {
                        _retVal += '</div>\n';
                    }
                    _retVal += '</div>\n';
                } else {
                    valueAdded = featureValue;
                    _retVal += '<div class="ws-nowrap line-text">'+ featureValue;
                    if(_scoreDetails && _scoreDetails.nameScoringDetails) {
                        let _nameScoreValues  = [];
                        if(_scoreDetails.nameScoringDetails.fullNameScore)    { _nameScoreValues.push(`full:${_scoreDetails.nameScoringDetails.fullNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.orgNameScore)     { _nameScoreValues.push(`org:${_scoreDetails.nameScoringDetails.orgNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.givenNameScore)   { _nameScoreValues.push(`giv:${_scoreDetails.nameScoringDetails.givenNameScore}`);}
                        if(_scoreDetails.nameScoringDetails.surnameScore)     { _nameScoreValues.push(`sur:${_scoreDetails.nameScoringDetails.surnameScore}`);}
                        if(_scoreDetails.nameScoringDetails.generationScore)  { _nameScoreValues.push(`gen:${_scoreDetails.nameScoringDetails.generationScore}`);}
                        _retVal += (_nameScoreValues.length > 0 ? ` (${_nameScoreValues.join('|')})` : '');
                    } else if(_scoreDetails && _scoreDetails.score > -1) {
                        _retVal += ' ('+ _scoreDetails.score +')';
                    }
                    _retVal += '</div>\n';
                }
            }
            return [_retVal, valueAdded];
        }
        _retVal = Object.assign(_retVal, {
            'NAME': (data: (SzFeatureScore | SzEntityFeatureWithScoring | SzCandidateKey)[], fieldName?: string, mk?: string) => {
                let _retVal = undefined;
                let mkAsMap = mk ? getMapFromMatchKey(mk) : undefined;
                // sort by feature scores if present
                data = sortByScore(data);
                if(data && data.length > 0 && data.forEach) {
                    // sort by feature scores if present
                    data = sortByScore(data);
                    let valuesAlreadyAdded      = [];
                    data.forEach((_d)=>{
                        // for each item render a line
                        let isEntityFeature = (_d as SzEntityFeature) && (_d as SzEntityFeature).featureDetails;
                        if(isEntityFeature) {
                            // go through each detail item
                            let _feat                   = (_d as SzEntityFeature);
                            let _scoreDetails           = (_d as SzEntityFeatureWithScoring).scoringDetails ? (_d as SzEntityFeatureWithScoring).scoringDetails : undefined;
                            let _allScoreDetails        = (_d as SzEntityFeatureWithScoring).featureScores ? (_d as SzEntityFeatureWithScoring).featureScores : undefined;
                            if(_allScoreDetails && _allScoreDetails.forEach){
                                let featureScores = sortByScore(_allScoreDetails);
                                featureScores.forEach((fs)=>{
                                    let _res = addFeatureToResult(fs, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                    if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                    if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                    if(_res[0]) _retVal += _res[0];
                                });

                            } else if(_feat.featureDetails && _feat.featureDetails.forEach){
                                _feat.featureDetails.forEach((fd)=>{
                                    let _res = addFeatureToResult(fd, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                    if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                    if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                    if(_res[0]) _retVal += _res[0];
                                });
                            }
                        } else if((_d as SzCandidateKey).featureType) {
                            // candidate key
                            let f = (_d as SzCandidateKey);
                            let stats = fBId && fBId.has(f.featureId) ? fBId.get(f.featureId).statistics : false;
                            if(!_retVal || _retVal === undefined) _retVal = '';
                            _retVal += '<div class="ws-nowrap line-text">'+ f.featureValue;
                            if(stats && stats.entityCount) {
                                _retVal += ` [${stats.entityCount}]`;
                            }
                            _retVal += '</div>\n';
                        }
                    });
                } else {
                    _retVal += 'undefined';
                }
                //console.log(`SzWhyEntitiesComparisonComponent.renderers[${fieldName}]: `, data, (data as SzEntityFeature).featureDetails, _retVal);

                return _retVal;
            },
            'ADDRESS': (data: (SzFeatureScore | SzCandidateKey | SzEntityFeatureWithScoring)[], fieldName?: string, mk?: string) => {
                let _retVal = undefined;
                if(data && data.length > 0 && data.forEach) {
                    // sort by feature scores if present
                    data = sortByScore(data);
                    let valuesAlreadyAdded      = [];
                    data.forEach((_d)=>{
                        // for each item render a line
                        if((_d as SzEntityFeature).featureDetails) {
                            // go through each detail item
                            let _feat               = (_d as SzEntityFeature);
                            let _scoreDetails       = (_d as SzEntityFeatureWithScoring).scoringDetails ? (_d as SzEntityFeatureWithScoring).scoringDetails : undefined;
                            let _allScoreDetails    = (_d as SzEntityFeatureWithScoring).featureScores ? (_d as SzEntityFeatureWithScoring).featureScores : undefined;

                            if(_allScoreDetails && _allScoreDetails.forEach){
                                let featureScores = sortByScore(_allScoreDetails);
                                featureScores.forEach((fs)=>{
                                    let _res = addFeatureToResult(fs, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                    if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                    if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                    if(_res[0]) _retVal += _res[0];
                                });
                            }else if(_feat.featureDetails && _feat.featureDetails.forEach){
                                _feat.featureDetails.forEach((fd)=>{
                                    let _res = addFeatureToResult(fd, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                    if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                    if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                    if(_res[0]) _retVal += _res[0];
                                });
                            }
                        } else if((_d as SzCandidateKey).featureType) {
                            // candidate key
                            let f = (_d as SzCandidateKey);
                            let stats = fBId && fBId.has(f.featureId) ? fBId.get(f.featureId).statistics : false;
                            if(!_retVal || _retVal === undefined) _retVal = '';
                            _retVal += '<div class="ws-nowrap line-text">'+ f.featureValue;
                            if(stats && stats.entityCount) {
                                _retVal += ` [${stats.entityCount}]`;
                            }
                            _retVal += '</div>\n';
                        }
                    });
                } else {
                    _retVal += 'undefined';
                }
                //console.log(`SzWhyEntitiesComparisonComponent.renderers[${fieldName}]: `, data, (data as SzEntityFeature).featureDetails, _retVal);
                return _retVal;
            },
            'ENTITY_ID':(data) => {
                return data;
            },
            default: (data: (SzFeatureScore | SzCandidateKey | SzEntityFeature | SzFocusRecordId)[], fieldName?: string, mk?: string): string | string[] | SzWhyEntityHTMLFragment => {
                let _retVal = '';
                let mkAsMap = mk ? getMapFromMatchKey(mk) : undefined;
                if(data && data.length > 0 && data.forEach) {
                    let entryIndex = -1;
                    let valuesAlreadyAdded      = [];

                    data = data.sort((rowA, rowB)=>{
                        let rowAAsScored    = (rowA as SzEntityFeatureWithScoring);
                        let rowBAsScored    = (rowB as SzEntityFeatureWithScoring);
        
                        let rowASortValue   = rowAAsScored.primaryId;
                        let rowBSortValue   = rowBAsScored.primaryId;
        
                        if(rowA && rowAAsScored.scoringDetails) {
                            rowASortValue = rowAAsScored.scoringDetails.score;
                        }
                        if(rowB && rowBAsScored.scoringDetails) {
                            rowBSortValue = rowBAsScored.scoringDetails.score;
                        }
                        if(rowAAsScored && rowBAsScored && rowAAsScored.scoringDetails && rowBAsScored.scoringDetails){
                            // we want to list 'descending' from highest score
                            return rowBSortValue - rowASortValue;
                        }
                        // for items with no scores move to bottom
                        return -1;
                    });
                    data.forEach((_d, i) => {
                        // for each item render a line
                        if((_d as SzEntityFeature).featureDetails) {
                            // go through each detail item
                            let _feat = (_d as SzEntityFeature);
                            let _scoreDetails = (_d as SzEntityFeatureWithScoring).scoringDetails ? (_d as SzEntityFeatureWithScoring).scoringDetails : undefined;
                            let _allScoreDetails = (_d as SzEntityFeatureWithScoring).featureScores ? (_d as SzEntityFeatureWithScoring).featureScores : undefined;

                            if(_feat.featureDetails && _feat.featureDetails.forEach){

                                if(_allScoreDetails && _allScoreDetails.forEach){
                                    let featureScores = sortByScore(_allScoreDetails);
                                    console.log(`addresses sorted by score: `,featureScores);
                                    featureScores.forEach((fs)=>{
                                        let _res = addFeatureToResult(fs, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                        if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                        if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                        if(_res[0]) _retVal += _res[0];
                                    });
                                } else if(_feat.featureDetails && _feat.featureDetails.forEach){
                                    _feat.featureDetails.forEach((fd)=>{
                                        let _res = addFeatureToResult(fd, _scoreDetails, _feat.featureDetails, mk, fieldName, valuesAlreadyAdded);
                                        if(_res[1]) valuesAlreadyAdded.push(_res[1]);
                                        if(_res[0] && !_retVal || _retVal === undefined) _retVal = '';
                                        if(_res[0]) _retVal += _res[0];
                                    });
                                }
                            }
                        } else if((_d as SzCandidateKey).featureType) {
                            entryIndex++;
                            // candidate key
                            let f = (_d as SzCandidateKey);
                            let stats = fBId && fBId.has(f.featureId) ? fBId.get(f.featureId).statistics : false;
                            _retVal += '<div class="ws-nowrap line-text>'+ f.featureValue;
                            if(stats && stats.entityCount) {
                                _retVal += ` [${stats.entityCount}]`;
                            }
                            _retVal += '</div>\n';
                        }
                    });
                } else {
                    // assume it's just aaaaahhh... actually.. I dunno.
                    // cast to string
                    if(data && data.toString) {
                        _retVal += `${data}`;
                    }
                }
                return _retVal;
            }
        })
        //console.info(`what is going on here??? `, _retVal);
        return _retVal;
    }

    /** call the /why api endpoint and return a observeable */
    protected override getData(): Observable<SzWhyEntitiesResponse> {
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
     * when the api requests respond this method properly sets up all the 
     * properties that get set/generated from some part of those requests
     * @interal
     */
    protected override onDataResponse(results: [SzWhyEntitiesResponse, string[]]) {
        this._isLoading = false;
        this.loading.emit(false);
        this._data          = results[0].data.whyResult;
        this._entities      = results[0].data.entities;
        this.onEntitiesChanged.emit(this._entities);
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
        //console.warn('SzWhyEntitiesComparisonComponent.rows: ', this._rows);
        this.onResult.emit(this._data);
        this.onRowsChanged.emit(this._rows);
    }
    /**
     * Extends the data response from the why api with data found "rows" that can be more directly utilized by the rendering template.
     * Every why result column gets additional fields like "dataSources", "internalId", "rows", "whyResult" that are pulled, hoisted, 
     * or joined from other places. 
     * @internal
     */
    override transformWhyNotResultData(data: SzWhyEntitiesResult, entities: SzEntityData[]): SzWhyEntityColumn[] {
        //console.log(`transformWhyNotResultData: ${this.entityIds.join(',')}`, data);
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
                        ent.rows[fKey]  = ent.rows[fKey].concat(fArr.map((entFeat)=>{
                            let _retVal: SzEntityFeatureWithScoring = Object.assign({}, entFeat);
                            let scoresThatHaveFeature = matchInfoForFeature.filter((fScore)=>{
                                let y = entFeat.featureDetails.find((fDetail)=>{
                                    let hasCandidateFeature = fDetail.internalId === fScore.candidateFeature.featureId;
                                    let hasInboundFeature   = fDetail.internalId === fScore.inboundFeature.featureId;
                                    return (hasCandidateFeature || hasInboundFeature) ? true : false;
                                });
                                if(y) {
                                    return true;
                                }
                                return false;
                            });
                            if(scoresThatHaveFeature && scoresThatHaveFeature.length > 0) {
                                // sort by score
                                scoresThatHaveFeature = scoresThatHaveFeature.sort((a, b)=>{
                                    return b.score - a.score;
                                });
                                _retVal.scoringDetails = scoresThatHaveFeature[0];
                                _retVal.featureScores = scoresThatHaveFeature;
                            }
                            return _retVal;
                        }));
                    } else {
                        // add this to "rows"
                        if(!ent.rows) { ent.rows = {}; }
                        if(!ent.rows[fKey]) { ent.rows[fKey] = []; }
                        ent.rows[fKey]  = ent.features[fKey];
                    }
                }
            });
        }
        //console.log(`transformWhyNotResultData: ${this.entityIds.join(',')}`, results);
        return results;
    }
}

/** 
 * Dialog component for displaying a WHY NOT report in a modal window
 * @internal
*/
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
    //console.warn(`onRowsChanged: `, data);
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