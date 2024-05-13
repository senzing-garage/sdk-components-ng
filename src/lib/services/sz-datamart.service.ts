import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of, Subject, Subscriber, Subscription, throwError } from 'rxjs';

import {
    ConfigService as SzConfigService, SzConfigResponse,
    StatisticsService as SzStatisticsService,
    SzLoadedStats,
    SzSummaryStats,
    SzCrossSourceSummary,
    SzCrossSourceSummaryResponse,
    SzDataSourcesResponseData,
    SzPagedEntitiesResponse,
    SzEntitiesPage,
    SzBoundType,
    SzEntityIdentifier,
    SzEntity,
    SzEntityData,
    SzEntityIdentifiers,
    EntityDataService,
    SzEntityResponse,
    SzDetailLevel,
    SzPagedRelationsResponse,
    SzRelationsPage,
    SzRelation
} from '@senzing/rest-api-client-ng';

import { take, tap, map, catchError, takeUntil, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SzCountStatsForDataSourcesResponse, SzDataTableEntitiesPagingParameters, SzDataTableRelation, SzDataTableRelationsPagingParameters, SzStatCountsForDataSources } from '../models/stats';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzDataSourcesService } from './sz-datasources.service';
import { SzCrossSourceSummaryCategoryType } from '../models/stats';

export interface sampleDataSourceChangeEvent {
    dataSource1?: string,
    dataSource2?: string
}

export interface SzStatSampleSetParameters {
    dataSource1?: string;
    dataSource2?: string;
    bound?: string;
    boundType?: SzBoundType;
    pageSize?: number;
    statType: SzCrossSourceSummaryCategoryType;
    page?: number;
    matchKey?: string;
    principle?: string;
    sampleSize?: number
}
export interface SzStatSampleSetPageChangeEvent extends SzStatSampleSetParameters {
    totalCount?: number;
}

export class SzStatSampleSet {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _dataSource1: string;
    private _dataSource2: string;
    private _statType: SzCrossSourceSummaryCategoryType;
    private _matchKey: string;
    private _currentPage: number = 0;
    //private _currentPageEntities: SzEntity[];
    //private _currentPageRelations: SzRelation[];
    private _entities = new Map<SzEntityIdentifier, SzEntityData>();

    private _entityPages: Map<number, SzEntitiesPage> = new Map<number, SzEntitiesPage>();
    private _relationPages: Map<number, SzRelationsPage> = new Map<number, SzRelationsPage>();
    private _isRelationsResponse = false;

    private _requestParameters: SzStatSampleSetParameters = {
        pageSize: 1000,
        bound: "0",
        boundType: SzBoundType.EXCLUSIVELOWER,
        statType: SzCrossSourceSummaryCategoryType.MATCHES
    }
    //private _pagingParametersForEntities: SzDataTableEntitiesPagingParameters;
    //private _pagingParametersForRelations: SzDataTableRelationsPagingParameters;

    /*private _sampleSize: number = 100;
    private _pageSize: number = 1000;
    private _bound: string = "0";
    private _boundType: SzBoundType = SzBoundType.EXCLUSIVELOWER;
    private _totalEntityCount: number = 0;
    private _afterPageCount: number;
    private _beforePageCount: number;
    private _maximumValue: string;
    private _minimumValue: string;
    private _pages = new Map<number, SzEntityIdentifier>();
    private _pageMaximumValue: string;
    private _pageMinimumValue: string;
    */

    public get statType() {
        return this._requestParameters && this._requestParameters.statType ? this._requestParameters.statType : undefined;
    }
    public get dataSource1() {
        return this._requestParameters && this._requestParameters.dataSource1 ? this._requestParameters.dataSource1 : undefined;
    }
    public set dataSource1(value: string) {
        if(this._requestParameters && this._requestParameters.dataSource1) this._requestParameters.dataSource1 = value;
    }
    public get dataSource2() {
        return this._requestParameters && this._requestParameters.dataSource2 ? this._requestParameters.dataSource2 : undefined;
    }
    public set dataSource2(value: string) {
        if(this._requestParameters && this._requestParameters.dataSource2) this._requestParameters.dataSource2 = value;
    }
    public get matchKey() {
        return this._requestParameters && this._requestParameters.matchKey ? this._requestParameters.matchKey : undefined;
    }
    public set matchKey(value: string) {
        if(this._requestParameters && this._requestParameters.matchKey) this._requestParameters.matchKey = value;
    }
    public get principle() {
        return this._requestParameters && this._requestParameters.principle ? this._requestParameters.principle : undefined;
    }
    public set principle(value: string) {
        if(this._requestParameters && this._requestParameters.principle) this._requestParameters.principle = value;
    }
    public get bound() {
        return this._requestParameters && this._requestParameters.bound ? this._requestParameters.bound : undefined;
    }
    public set bound(value: string) {
        if(this._requestParameters && this._requestParameters.bound) this._requestParameters.bound = value;
    }
    public get sampleSize() {
        return this._requestParameters && this._requestParameters.sampleSize ? this._requestParameters.sampleSize : undefined;
    }
    public set sampleSize(value: number) {
        if(this._requestParameters && this._requestParameters.sampleSize) this._requestParameters.sampleSize = value;
    }
    public get pageSize() {
        return this._requestParameters && this._requestParameters.pageSize ? this._requestParameters.pageSize : undefined;
    }
    public set pageSize(value: number) {
        if(this._requestParameters && this._requestParameters.pageSize) this._requestParameters.pageSize = value;
    }
    public get totalCount() {
        if(this._isRelationsResponse) {
            let _relPageParams    = this.pagingParametersForRelations;
            if(_relPageParams && _relPageParams.totalRelationCount) {
                return _relPageParams.totalRelationCount;
            }
        } else {
            let _entPageParams    = this.pagingParametersForEntities;
            if(_entPageParams && _entPageParams.totalEntityCount) {
                return _entPageParams.totalEntityCount;
            }
        }
        return 0;
    }
    public set totalCount(value: number) {
        if(this._requestParameters && this._requestParameters.pageSize) this._requestParameters.pageSize = value;
    }

    //this.sampleSize, this.pageSize

    public get currentPageResults(): SzEntityData[] | SzRelation[] {
        if(this._isRelationsResponse) {
            return this.currentPageRelations;
        } else {
            return this.currentPageEntities;
        }
    }

    public get currentPage(): SzEntitiesPage | SzRelationsPage {
        if(this._isRelationsResponse && this._relationPages.has(this._currentPage)) {
            return this._relationPages.get(this._currentPage);
        } else if(this._entityPages.has(this._currentPage)) {
            return this._entityPages.get(this._currentPage);
        }
        return undefined;
    }

    public get currentPageEntities(): SzEntityData[] {
        if(this._entityPages.has(this._currentPage)) {
            let _entities   = this._entityPages.get(this._currentPage).entities;
            if(_entities && _entities.map) {
                return _entities.map((res: SzEntity) => {
                    return this._entities.has(res.entityId) ? this._entities.get(res.entityId) : {};
                });
            }
        }
        return undefined;
    }

    public get currentPageRelations(): SzRelation[] {
        if(this._relationPages.has(this._currentPage)) {
            return this._relationPages.get(this._currentPage).relations;
        }
        return undefined;
    }

    public get pagingParametersForEntities(): SzDataTableEntitiesPagingParameters {
        if(!this._isRelationsResponse && this._entityPages.has(this._currentPage)) {
            let {entities, ...destroParams} = this._entityPages.get(this._currentPage);
            return destroParams as SzDataTableEntitiesPagingParameters;
        }
        return undefined;
    }
    public get pagingParametersForRelations(): SzDataTableRelationsPagingParameters {
        if(this._isRelationsResponse && this._relationPages.has(this._currentPage)) {
            let {relations, ...destroParams} = this._relationPages.get(this._currentPage);
            return destroParams as SzDataTableRelationsPagingParameters;
        }
        return undefined;
    }

    private _onDataUpdated: BehaviorSubject<SzEntityData[] | SzRelation[]> = new BehaviorSubject<SzEntityData[]>(undefined);
    private _onPagingUpdated: BehaviorSubject<SzStatSampleSetPageChangeEvent> = new BehaviorSubject<SzStatSampleSetPageChangeEvent>(undefined)

    // we only want these publicly if they're not undefined
    public onDataUpdated = this._onDataUpdated.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    )

    public onPagingUpdated = this._onPagingUpdated.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    )

    private _getCurrentPageParameters(): SzStatSampleSetPageChangeEvent {
        let _retVal: SzStatSampleSetPageChangeEvent;
        if(this._isRelationsResponse) {
            // pass relations page minus entities
            let _cPageParams        = this.pagingParametersForRelations;
            let _overwriteObj:any   = {statType: this.statType, totalCount: this.totalCount};
            if(this.bound) { _overwriteObj.bound = this.bound; }
            //console.log(`\t_getCurrentPageParameters: pagingParametersForRelations: `, this.pagingParametersForRelations);
            _retVal = Object.assign(
                _overwriteObj, 
                _cPageParams
            );
        } else {
            // pass entity page minus entities
            _retVal = Object.assign(
                {statType: this.statType}, 
                this.pagingParametersForEntities, 
                {
                    bound: this.bound,
                    totalCount: this.totalCount
                }
            );
        }
        console.info(`_getCurrentPageParameters()`, _retVal);
        return _retVal;
    }

    private get hasEnoughParametersForRequest(): boolean {
        let retVal = false;
        if((this._dataSource1 || this._dataSource2) && this._statType) {
            retVal = true;
        }
        return retVal;
    }

    constructor( 
        private parameters: SzStatSampleSetParameters,
        private statsService: SzStatisticsService, private entityDataService: EntityDataService, deferInitialRequest?: boolean) {

        if(this.parameters) {
            this._requestParameters = parameters;

            this._dataSource1 = parameters.dataSource1 ? parameters.dataSource1 : this._dataSource1;
            this._dataSource2 = parameters.dataSource2 ? parameters.dataSource2 : this._dataSource2;
            //this._bound = parameters.bound ? parameters.bound : this._bound;
            //this._boundType = parameters.boundType ? parameters.boundType : this._boundType;
            this._statType = parameters.statType ? parameters.statType : this._statType;
            //this._pageSize = parameters.pageSize ? parameters.pageSize : this._pageSize;
            this._currentPage = parameters.page ? parameters.page : this._currentPage;
        }
        if(this.hasEnoughParametersForRequest && !deferInitialRequest) {
            this.init();
        }
    }

    public init() {
        if(this.hasEnoughParametersForRequest) {
            console.log(`\tinit(): `, this._dataSource1, this._dataSource2);
            console.time('SzStatSampleSet.init()');
            this._getNewSampleSet(this.statType, this.dataSource1, this.dataSource2, this.matchKey, this.principle, this.bound, this.sampleSize, this.pageSize).pipe(
                takeUntil(this.unsubscribe$),
                filter((data: SzEntitiesPage | SzRelationsPage) => {
                    return this._dataSource1 !== undefined || this._dataSource2 !== undefined ? true : false;
                })
            ).subscribe((data: SzEntitiesPage | SzRelationsPage) => {
                let isEntityResponse        = (data as SzEntitiesPage).entities ? true : false; 
                this._isRelationsResponse   = !isEntityResponse;
                console.timeLog('SzStatSampleSet.init()', ': got sampleset page: ', data);

                if(isEntityResponse) {
                    let _dataPage               = (data as SzEntitiesPage);
                    this._entityPages.set(this._currentPage, _dataPage);
                    let _currentPageEntities   = _dataPage.entities;
                    // get exploded entity data
                    let entitiesToRequest = _currentPageEntities.filter((ent: SzEntity) => {
                        return !this._entities.has(ent.entityId);
                    }).map((ent: SzEntity) => {
                        return ent.entityId;
                    });

                    if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                        // there are no entities
                        // just emit empty result
                        this._onDataUpdated.next(this.currentPageResults);
                        console.timeEnd('SzStatSampleSet.init()');
                        return;
                    }
                    console.timeLog('SzStatSampleSet.init()', ': get entity data: ', entitiesToRequest);

                    this.getEntitiesByIds(entitiesToRequest, false, SzDetailLevel.VERBOSE).pipe(
                        takeUntil(this.unsubscribe$),
                        take(1)
                    ).subscribe({next: (edata: SzEntityData[]) => {
                            console.timeLog('SzStatSampleSet.init()', ': got entities: ', edata);
                            // expanded data
                            if(edata && edata.forEach) {
                                edata.forEach((ent: SzEntityData) => {
                                    // add to internal array
                                    this._entities.set(ent.resolvedEntity.entityId, ent);
                                })
                            }
                            let dataset = this.currentPageResults;
                            console.timeLog('SzStatSampleSet.init()', ': extended data: ', dataset);
                            console.timeEnd('SzStatSampleSet.init()');
                            this._onDataUpdated.next(dataset);
                            this._onPagingUpdated.next(this._getCurrentPageParameters());
                        },
                        error: (err) => {
                            console.error(err);
                        }
                    });
                } else {
                    // expand "relations" nodes with more complete data
                    let _dataPage              = (data as SzRelationsPage);
                    let _currentPageRelations  = _dataPage.relations;
                    // get entity ids
                    let entitiesToRequest  = [];
                    _currentPageRelations.forEach((rel: SzRelation) => {
                        let _entId  = rel && rel.entity && rel.entity.entityId ? rel.entity.entityId : undefined;
                        let _relId  = rel && rel.relatedEntity && rel.relatedEntity.entityId ? rel.relatedEntity.entityId : undefined;
                        if(_entId && !this._entities.has(_entId) && entitiesToRequest.indexOf(_entId) < 0) { entitiesToRequest.push(_entId); }
                        if(_relId && !this._entities.has(_relId) && entitiesToRequest.indexOf(_relId) < 0) { entitiesToRequest.push(_relId); }
                    });
                    if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                        // there are no entities
                        // just emit empty result
                        this._onDataUpdated.next(this.currentPageResults);
                        console.timeEnd('SzStatSampleSet.init()');
                        return;
                    }
                    console.timeLog('SzStatSampleSet.init()', ': get entity data: ', entitiesToRequest);
                    this.getEntitiesByIds(entitiesToRequest, false, SzDetailLevel.VERBOSE).pipe(
                        takeUntil(this.unsubscribe$),
                        take(1)
                    ).subscribe({
                        next: (edata: SzEntityData[]) => {
                            console.timeLog('SzStatSampleSet.init()', ': got entities: ', edata);
                            // set entity data
                            if(edata && edata.forEach) {
                                edata.forEach((ent: SzEntityData) => {
                                    // add to internal array
                                    this._entities.set(ent.resolvedEntity.entityId, ent);
                                })
                            }
                            // now extend records with real data
                            _currentPageRelations.forEach((rel: SzRelation) => {
                                if(this._entities.has(rel.entity.entityId)) {
                                    let _fullEnt        = this._entities.get(rel.entity.entityId).resolvedEntity;
                                    // extend records first
                                    let _fullEntRecsMap = new Map();
                                    _fullEnt.records.map((rec) => {
                                        _fullEntRecsMap.set(rec.dataSource+'|'+rec.recordId, rec);
                                    })
                                    
                                    rel.entity.records  = rel.entity.records.map((eRec) => {
                                        return _fullEntRecsMap.get(eRec.dataSource+'|'+eRec.recordId);
                                    });
                                    // now extend ent with props from full ent (minus) the records
                                    rel.entity = Object.assign(Object.assign({}, _fullEnt), rel.entity);
                                }
                                if(this._entities.has(rel.relatedEntity.entityId)) {
                                    let _fullEnt        = this._entities.get(rel.relatedEntity.entityId).resolvedEntity;
                                    let _fullEntRecsMap = new Map();
                                    _fullEnt.records.map((rec) => {
                                        _fullEntRecsMap.set(rec.dataSource+'|'+rec.recordId, rec);
                                    })
                                    rel.relatedEntity.records  = rel.relatedEntity.records.map((eRec) => {
                                        return _fullEntRecsMap.get(eRec.dataSource+'|'+eRec.recordId);
                                    });
                                    // now extend ent with props from full ent (minus) the records
                                    rel.relatedEntity = Object.assign(Object.assign({}, _fullEnt), rel.relatedEntity);
                                }
                                
                            })
                            //console.log(`\t\tExtended Data: `, this._currentPageRelations);
                            this._relationPages.set(this._currentPage, _dataPage);
                            let dataset = this.currentPageResults;
                            console.timeLog('SzStatSampleSet.init()', ': extended data: ', dataset);
                            console.timeEnd('SzStatSampleSet.init()');
                            this._onDataUpdated.next(dataset);
                            let _currentPageParams = this._getCurrentPageParameters();
                            console.warn(`SzStatSampleSet.init().pageParams(${this._currentPage}): `, _currentPageParams, this._relationPages.get(this._currentPage));
                            this._onPagingUpdated.next(_currentPageParams);
                        },
                        error: (err) => {
                            console.error(err);
                        }
                    });
                }
            });
        }
    }

    /** get the SzEntityData[] responses for multiple entities 
     * @memberof
     */
    private getEntitiesByIds(entityIds: SzEntityIdentifiers, withRelated = false, detailLevel = SzDetailLevel.BRIEF): Observable<SzEntityData[]> {
        console.log('@senzing/sdk/services/sz-datamart[getEntitiesByIds('+ entityIds +', '+ withRelated +')] ');
        const withRelatedStr = withRelated ? 'FULL' : 'NONE';
        let _retSubject = new Subject<SzEntityData[]>();
        let _retVal     = _retSubject.asObservable();

        let _listOfObserveables = entityIds.map((eId) => {
            return this.entityDataService.getEntityByEntityId(eId, detailLevel, undefined, undefined, undefined, false, withRelatedStr)
        })

        forkJoin(_listOfObserveables).pipe(
        map((res: SzEntityResponse[]) => {
            return res.map((res: SzEntityResponse) => (res.data as SzEntityData))
        })
        )
        .subscribe((results: SzEntityData[]) => {
            console.warn('@senzing/sdk/services/sz-datamart[getEntitiesByIds RESULT: ', results);
            _retSubject.next(results);
        })

        return _retVal;
    }

    /**
     * unsubscribe on destroy
     */
    destroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private _getNewSampleSet(statType: SzCrossSourceSummaryCategoryType, dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string, principle?: string, bound?: string, sampleSize?: number, pageSize?: number) : Observable<SzEntitiesPage | SzRelationsPage | Error> {
        let isVersus = true;
        let isOneDataSourceUndefined = dataSource1 === undefined || dataSource2 === undefined;
        let apiMethod = 'getEntityIdsForCrossMatches';
        // immediately show empty results while we wait
        this._onDataUpdated.next(undefined);
        console.log(`\t\t_getNewSampleSet(${statType}, ${dataSource1}, ${dataSource2}, ${matchKey}, ${principle}, ${bound}, undefined, ${pageSize}, ${sampleSize})`);
        // are we doing cross-source or single-source?
        //if(dataSource1 && dataSource2 && dataSource1 !== dataSource2 && !isOneDataSourceUndefined) { isVersus = true; }
        
        // if any one data source is defined it's always versus mode
        if(dataSource1 && !dataSource2) { 
            dataSource2 = dataSource1; 
        } else if(dataSource2 && !dataSource1) {
            dataSource1 = dataSource2; 
        }

        if(!dataSource1 && !dataSource2) {
            let err = new Error(`"no datasource(s) provided`);
            console.error(err.message);
            throw err;
        }

        // get the api method name to call for the stat type
        switch(statType){
            case SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES:
                //apiMethod = isVersus ? 'getAmbiguouslyCrossMatchedEntityIds' : 'getAmbiguouslyMatchedEntityIds';
                apiMethod = isVersus ? 'getAmbiguouslyCrossMatchedRelations' : 'getAmbiguouslyMatchedRelations';
                break;
            case SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS:
                //apiMethod = isVersus ? 'getDisclosedCrossRelatedEntityIds' : 'getDisclosedRelatedEntityIds';
                apiMethod = isVersus ? 'getDisclosedCrossRelatedRelations' : 'getDisclosedRelatedRelations';
                break;
            case SzCrossSourceSummaryCategoryType.MATCHES:
                apiMethod = isVersus ? 'getEntityIdsForCrossMatches' : 'getEntityIdsForSourceMatches';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES:
                //apiMethod = isVersus ? 'getPossiblyCrossMatchedEntityIds' : 'getPossiblyMatchedEntityIds';
                apiMethod = isVersus ? 'getPossiblyCrossMatchedRelations' : 'getPossiblyMatchedRelations';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS:
                //apiMethod = isVersus ? 'getPossiblyCrossRelatedEntityIds' : 'getPossiblyRelatedEntityIds';
                apiMethod = isVersus ? 'getPossiblyCrossRelatedRelations' : 'getPossiblyRelatedRelations';
                break;
            default:
                apiMethod = 'getEntityIdsForSourceMatches';
                break;
        }

        // double check that method exists
        if(typeof this.statsService[apiMethod] !== 'function') {
            // throw
            let err = new Error(`"${apiMethod}" does not exist in datamart api service(s)`);
            console.error(err.message);
            throw err;
        }
        let _disAmbiMethod = this.statsService[apiMethod];
        if(isVersus) {
            console.log(`\t\t\tcalling versus "${apiMethod}(${dataSource1},${dataSource2}, ${matchKey}, ${principle}, ${bound}, undefined, ${pageSize}, ${sampleSize})"`);
            // dataSourceCode: string, vsDataSourceCode: string, matchKey?: string, principle?: string, bound?: string, boundType?: SzBoundType, pageSize?: number, sampleSize?: number, observe?: 'body', reportProgress?: boolean
            return _disAmbiMethod.call(this.statsService, dataSource1, dataSource2, matchKey, principle, bound, undefined, pageSize, sampleSize).pipe(
                tap((response: SzPagedEntitiesResponse | SzPagedRelationsResponse) => {
                    console.log(`got cross source entity id's or relations: `, response);
                    if(response && response.data) {
                        //this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    return err;
                }),
                map((response: SzPagedEntitiesResponse | SzPagedRelationsResponse) => {
                    return response.data;
                })
            )
        } else {
            console.log(`\t\t\tcalling "${apiMethod}(${dataSource1}, ${matchKey}, ${principle}, ${bound}, undefined, ${pageSize}, ${sampleSize})"`);
            // dataSourceCode: string, matchKey?: string, principle?: string, bound?: number, boundType?: SzBoundType, pageSize?: number, sampleSize?: number, observe?: 'body', reportProgress?: boolean
            return _disAmbiMethod.call(this.statsService, dataSource1, matchKey, principle, bound, undefined, pageSize, sampleSize).pipe(
                tap((response: SzPagedEntitiesResponse) => {
                    console.log(`got single source sample entity ids: `, response);

                    if(response && response.data) {
                        //this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    return err;
                }),
                map((response: SzPagedEntitiesResponse) => {
                    return response.data;
                })
            )
        }
    }

    public getNextPage() {

    }
    public getPreviousPage() {
        
    }
}

/**
 * methods used to get data from the poc server using the 
 * datamart api(s)
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataMartService {
    //private _recordStatsStubData = recordStatsStubData;
    private _loadedStatisticsInFlight = false;
    private _summaryStatisticsInFlight = false;
    private _onlyShowLoadedSummaryStatistics = false;
    private _dataSources: string[] | undefined;
    private _dataSourceDetails: SzDataSourcesResponseData | undefined;
    private _dataSourcesInFlight: boolean = false;
    private _sampleSet: SzStatSampleSet;
    //private _sampleStatType: SzCrossSourceSummaryCategoryType | undefined;

    public get sampleStatType() : SzCrossSourceSummaryCategoryType {
        return this.prefs.dataMart.sampleStatType;
    }
    public set sampleStatType(value: SzCrossSourceSummaryCategoryType) {
        let _oType = this.prefs.dataMart.sampleStatType;
        this.prefs.dataMart.sampleStatType = value;
        if(_oType !== value) this.onSampleTypeChange.next(this.prefs.dataMart.sampleStatType);  // only emit on change
    }
    public get sampleMatchLevel() {
        return this.prefs.dataMart.sampleMatchLevel;
    }
    public set sampleMatchLevel(value: number) {
        this.prefs.dataMart.sampleMatchLevel = value;
        console.log();
        this.onSampleMatchLevelChange.next(value);
    }
    public get sampleDataSource1() {
        return this.prefs.dataMart.sampleDataSource1;
    }
    public set sampleDataSource1(value: string) {
        let _oType = this.prefs.dataMart.sampleDataSource1;
        this.prefs.dataMart.sampleDataSource1 = value;
        let _evt = this.prefs.dataMart.sampleDataSource2 ? {dataSource2: this.prefs.dataMart.sampleDataSource2, dataSource1: value} : {dataSource2: value};
        if(_oType !== value) this.onSampleDataSourceChange.next(_evt); // only emit on change
    }
    public get sampleDataSource2() {
        return this.prefs.dataMart.sampleDataSource2;
    }
    public set sampleDataSource2(value: string) {
        let _oType = this.prefs.dataMart.sampleDataSource2;
        this.prefs.dataMart.sampleDataSource2 = value;
        let _evt = this.prefs.dataMart.sampleDataSource1 ? {dataSource1: this.prefs.dataMart.sampleDataSource1, dataSource2: value} : {dataSource2: value};
        if(_oType !== value) this.onSampleDataSourceChange.next(_evt); // only emit on change
    }

    public get dataSource1() {
        return this.prefs.dataMart.dataSource1;
    }
    public set dataSource1(value: string) {
        this.prefs.dataMart.dataSource1 = value;
        this.onDataSource1Change.next(value);
        this._onDataSourceSelected.next(value);
    }
    public get dataSource2() {
        return this.prefs.dataMart.dataSource2;
    }
    public set dataSource2(value: string) {
        this.prefs.dataMart.dataSource2 = value;
        this.onDataSource2Change.next(value);
        this._onDataSourceSelected.next(value);
    }
    private _loadedStatistics: SzLoadedStats | undefined;
    private _summaryStatistics: SzSummaryStats | undefined;

    public onCountStats: Subject<SzLoadedStats | undefined> = new BehaviorSubject<SzLoadedStats>(undefined);
    public onSummaryStats: Subject<SzSummaryStats | undefined> = new BehaviorSubject<SzSummaryStats>(undefined);
    public onCrossSourceSummaryStats: Subject<SzCrossSourceSummary | undefined> = new BehaviorSubject<SzCrossSourceSummary>(undefined);

    public onSampleMatchLevelChange: BehaviorSubject<number | undefined> = new BehaviorSubject<number>(undefined);
    public onSampleTypeChange: BehaviorSubject<SzCrossSourceSummaryCategoryType | undefined> = new BehaviorSubject<SzCrossSourceSummaryCategoryType>(undefined);
    public onSampleDataSourceChange: BehaviorSubject<sampleDataSourceChangeEvent | undefined> = new BehaviorSubject<sampleDataSourceChangeEvent | undefined>(undefined);
    /** when a new sample set is being requested */
    private _onSampleRequest: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public  onSampleRequest = this._onSampleRequest.asObservable().pipe(
        filter((res)=>{ return res === true; }),
        tap((res) => {
            console.log(`DataMartService._onSampleRequest`, res);
        })
    );
    /** when a new sample set has completed */
    public _onSampleResultChange: BehaviorSubject<SzEntityData[] | SzRelation[] | undefined> = new BehaviorSubject<SzEntityData[] | undefined>(undefined);
    public onSampleResultChange = this._onSampleResultChange.asObservable().pipe(
        filter(r => r !== undefined),
        tap((r) => {
            //console.log(`the fuck? onSampleResultChange: `, r)
        })
    );
    /** when a page from the sample set has been updated or parameters have changed */
    public _onSamplePageChange: BehaviorSubject<SzStatSampleSetPageChangeEvent | undefined> = new BehaviorSubject<SzStatSampleSetPageChangeEvent | undefined>(undefined);
    public onSamplePageChange = this._onSamplePageChange.asObservable().pipe(
        filter(r => r !== undefined),
        tap((r) => {
            //console.log(`the fuck? onSampleResultChange: `, r)
        })
    );
    private _onSampleResultChange$: Subscription;
    private _onSamplePageUpdated$: Subscription;

    public onDataSource1Change: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
    public onDataSource2Change: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
    
    
    private _onDataSourceSelected: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
    public onDataSourceSelected = this._onDataSourceSelected.asObservable();

    constructor(
        private http: HttpClient, 
        public prefs: SzPrefsService,
        private dataSourcesService: SzDataSourcesService,
        private entityDataService: EntityDataService,
        private statsService: SzStatisticsService) {
        if(!this._dataSourceDetails){
            this.getDataSourceDetails()
            .subscribe((dsDetails) => {
                this._dataSourceDetails = dsDetails.dataSourceDetails;
            })
        }
        this.onSampleRequest.subscribe((isLoading)=>{
            console.warn(`DataMartService.onSampleRequest: ${isLoading}`);
        });
    }

    public get loadedStatistics(): SzLoadedStats | undefined {
        if(!this._loadedStatistics) this._getLatestLoadedStats();
        return this._loadedStatistics;
    }
    public get summaryStatistics(): SzSummaryStats | undefined {
        if(!this._summaryStatistics) this._getLatestSummaryStats();
        return this._summaryStatistics;
    }

    public get dataSources() {
        if(this._dataSources || this._dataSourcesInFlight){ return this._dataSources; }
        // if we dont have any datasources init
        this.getDataSources().pipe(
            take(1)
        ).subscribe();
        return this._dataSources;
    }
    public get dataSourceDetails() {
        if(this._dataSourceDetails){ return this._dataSourceDetails; }
        // if we dont have any datasources init
        this.getDataSourceDetails().pipe(
            take(1)
        ).subscribe();
        return this._dataSourceDetails;
    }

    public getDataSources() {
        this._dataSourcesInFlight = true;
        return this.dataSourcesService.listDataSources('sz-datamart.service.getDataSources').pipe(
            tap((ds: string[]) => {
                this._dataSources = ds;
                this._dataSourcesInFlight = false;
            }),
            catchError((error) => {
                this._dataSourcesInFlight = false;
                return of(false);
            })
        );
    }
    public getDataSourceDetails() {
        return this.dataSourcesService.listDataSourcesDetails().pipe(
            tap((ds: SzDataSourcesResponseData) => {
                this._dataSourceDetails = ds.dataSourceDetails;
            })
        );
    }

    public getLoadedStatistics(): Observable<SzCountStatsForDataSourcesResponse> {
        this._loadedStatisticsInFlight = true;
        return this.statsService.getLoadedStatistics().pipe(
            tap((response) => {
                console.log('getLoadedStatistics: ', response);
                if(response && response.data) {
                    this._loadedStatistics = response.data;
                    this.onCountStats.next(response.data);
                }
                this._loadedStatisticsInFlight = false;
            }),
            catchError((err)=> {
                this._loadedStatisticsInFlight = false;
                console.error('error: ', err);
                return err;
            })
        )
        /*
        let retVal = new Observable<SzCountStatsForDataSourcesResponse>();
        // for now just return stub data
        return of(this._recordStatsStubData as unknown as SzCountStatsForDataSourcesResponse).pipe(
            tap((response) => {
                if(response && response.data) {
                    this.onCountStats.next(response.data);
                }
            })
        )*/
    }
    private _getLatestLoadedStats() {
        if(!this._loadedStatisticsInFlight) {
            console.log(`get first loaded stats`);
            this.getLoadedStatistics().pipe(
                take(1)
            ).subscribe();
        }
    }
    private _getLatestSummaryStats() {
        if(!this._summaryStatisticsInFlight) {
            console.log(`get first summary stats`);
            this.getSummaryStatistics().pipe(
                take(1)
            ).subscribe();
        }
    }
    
    public getSummaryStatistics() {
        this._summaryStatisticsInFlight = true;
        console.log('getSummaryStatistics: inflight');

        return this.statsService.getSummaryStatistics(undefined, undefined, this._onlyShowLoadedSummaryStatistics).pipe(
            tap((response) => {
                console.log('getSummaryStatistics: ', response);
                if(response && response.data) {
                    this._summaryStatistics = response.data;
                    this.onSummaryStats.next(response.data);
                }
                this._summaryStatisticsInFlight = false;
            }),
            catchError((err)=> {
                this._summaryStatisticsInFlight = false;
                console.error('error: ', err);
                return err;
            })
        )
    }
    public getCrossSourceStatistics(dataSource1?: string | undefined, dataSource2?: string | undefined) {
        if(dataSource1 && dataSource2) {
            return this.statsService.getCrossSourceSummaryStatistics(dataSource1, dataSource2).pipe(
                tap((response) => {
                    if(response && response.data) {
                        this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    return err;
                }),
                map((response: SzCrossSourceSummaryResponse)=> response.data)
            );
        } else if(dataSource1) {
            return this.statsService.getCrossSourceSummaryStatistics(dataSource1, dataSource1).pipe(
                tap((response) => {
                    if(response && response.data) {
                        this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    return err;
                }),
                map((response: SzCrossSourceSummaryResponse)=> response.data)
            );
        } else if(dataSource2) {
            return this.statsService.getCrossSourceSummaryStatistics(dataSource2, dataSource2).pipe(
                tap((response) => {
                    if(response && response.data) {
                        this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    return err;
                }),
                map((response: SzCrossSourceSummaryResponse)=> response.data)
            );
        } else {
            throw new Error('at least one datasource must be selected for cross-source statistics. datasouces may be the same to compare to self.');
        }
    }

    public createNewSampleSetFromParameters(statType: SzCrossSourceSummaryCategoryType, dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string, principle?: string, bound?: number, sampleSize?: number, pageSize?: number) {
        // clear any previous subscription
        if(this._onSamplePageUpdated$) {
            this._onSamplePageUpdated$.unsubscribe();
            this._onSamplePageUpdated$ = undefined;
        }
        if(this._onSampleResultChange$) {
            this._onSampleResultChange$.unsubscribe();
            this._onSampleResultChange$ = undefined;
            this._onSampleRequest.next(false);
        }
        console.log('createNewSampleSetFromParameters: ', {
            statType: statType, dataSource1: dataSource1, dataSource2: dataSource2, matchKey: matchKey, principle: principle, bound: bound, sampleSize: sampleSize, pageSize: pageSize
        });
        // initialize new sample set
        this._onSampleRequest.next(true);
        this._sampleSet = new SzStatSampleSet({
            statType: statType,
            dataSource1: dataSource1,
            dataSource2: dataSource2
        }, this.statsService, this.entityDataService);
        
        this._onSampleResultChange$ = this._sampleSet.onDataUpdated.pipe(
            tap((res) =>{
                // bubble up sample set evt to service scope
                if(res && res.length === 0) {
                    console.error('NOOOOO ${res}', res);
                }
                this._onSampleResultChange.next(res);
            })
        ).subscribe();
        this._onSamplePageUpdated$   = this._sampleSet.onPagingUpdated.pipe(
            tap((res) =>{
                // bubble up sample set evt to service scope
                this._onSamplePageChange.next(res);
            })
        ).subscribe();

        return this._sampleSet.onDataUpdated;
    }

    public getSampleSetPagingInfo() {

    }
    /*public getRecordCounts(): Observable<any> {
        let retVal = new Observable();
        // for now just return stub data
        return of(this._recordStatsStubData);
        //return retVal;
    }*/
}