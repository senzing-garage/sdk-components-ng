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
    SzRelation,
    SzMatchCounts,
    SzRelationCounts
} from '@senzing/rest-api-client-ng';

import { take, tap, map, catchError, takeUntil, filter, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SzCountStatsForDataSourcesResponse, SzCrossSourceCount, SzDataTableEntitiesPagingParameters, SzDataTableRelation, SzDataTableRelationsPagingParameters, SzStatCountsForDataSources, SzStatSampleSetPageChangeEvent, SzStatSampleSetParameters, sampleDataSourceChangeEvent } from '../models/stats';
import { SzPrefsService } from '../services/sz-prefs.service';
import { SzDataSourcesService } from './sz-datasources.service';
import { SzCrossSourceSummaryCategoryType } from '../models/stats';

/**
 * Represents an object of a sampling dataset. When a user clicks on a venn diagram a number of 
 * parameters are assembled and passed to the constructor of this class to perform all the 
 * necessary logic to populate it's properties from the parameters and request the necessary 
 * data to represent the page(s) of data requested. 
 */
export class SzStatSampleSet {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    // --------------------------------- internal variables ---------------------------------
    /** @internal */
    private _dataSource1: string;
    /** @internal */
    private _dataSource2: string;
    /** @internal */
    private _statType: SzCrossSourceSummaryCategoryType;
    /** @internal */
    private _matchKey: string;
    /** @internal */
    private _currentPage: number    = 0;
    /** @internal */
    private _isRelationsResponse    = false;
    /** @internal */
    private _entities               = new Map<SzEntityIdentifier, SzEntityData>();
    /** @internal */
    private _entityPages: Map<number, SzEntitiesPage>       = new Map<number, SzEntitiesPage>();
    /** @internal */
    private _relationPages: Map<number, SzRelationsPage>    = new Map<number, SzRelationsPage>();
    /** @internal */
    private _doNotFetchOnParameterChange                    = false;
    /** @internal */
    private _unfilteredCount        = 0;
    /**
     * We store the parameters used to contruct the initial request here 
     * so we can update individual properties when they change and pull new 
     * requests with just the modified parameter(s).
     * @internal
     */
    private _requestParameters: SzStatSampleSetParameters = {
        pageSize: 1000,
        bound: "0",
        boundType: SzBoundType.EXCLUSIVELOWER,
        statType: SzCrossSourceSummaryCategoryType.MATCHES
    }

    // --------------------------------- Getters and Setters ---------------------------------

    public get statType() {
        return this._requestParameters && this._requestParameters.statType ? this._requestParameters.statType : undefined;
    }
    public get bound() {
        return this._requestParameters && this._requestParameters.bound ? this._requestParameters.bound : undefined;
    }
    public set bound(value: string) {
        if(this._requestParameters) this._requestParameters.bound = value;
        if(value) {
            // we might need to jump page(s)
            if(value === 'max' || value === 'MAX') {
            //if(this.currentPage && (this.currentPage.maximumValue as string) === value) {
                // we're jumping to the last page
                let _lastPageSize   = this.totalCount % this.pageSize;
                let _lastPage       = Math.ceil(this.totalCount / this.pageSize);
                console.warn(`!!! changing to last page(${_lastPage}) w/ ${_lastPageSize} results`);
                this._currentPage   = _lastPage - 1;  // the paging we use is "0" index based
                this._requestParameters.pageSize = _lastPageSize; // manually set pageSize to skip over result clearing
                this.boundType      = SzBoundType.INCLUSIVEUPPER;
                if(!this._doNotFetchOnParameterChange) this.getSampleDataFromParameters();
            } else if(value === undefined || value === '0' || value === '0:0') {
                // first page
                this._currentPage   = 0;
                this._requestParameters.pageSize = this.prefs.dataMart.samplePageSize; // grab pagesize off of prefs value;
                this.boundType      = SzBoundType.INCLUSIVELOWER;
                console.warn(`!!! changing to page 1: (${this.pageSize})`);
                if(!this._doNotFetchOnParameterChange) this.getSampleDataFromParameters();
            } else if(!this._doNotFetchOnParameterChange) {
                // just change the bound type
                //this.getSampleDataFromParameters();
            }
        }
    }
    public get boundType() {
        return this._requestParameters && this._requestParameters.boundType ? this._requestParameters.boundType : undefined;
    }
    public set boundType(value: SzBoundType) {
        if(this._requestParameters) this._requestParameters.boundType = value;
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
    public get currentPageResults(): SzEntityData[] | SzRelation[] {
        if(this._isRelationsResponse) {
            return this.currentPageRelations;
        } else {
            return this.currentPageEntities;
        }
    }
    public get dataSource1() {
        return this._requestParameters && this._requestParameters.dataSource1 ? this._requestParameters.dataSource1 : undefined;
    }
    public set dataSource1(value: string) {
        if(this._requestParameters) this._requestParameters.dataSource1 = value;
    }
    public get dataSource2() {
        return this._requestParameters && this._requestParameters.dataSource2 ? this._requestParameters.dataSource2 : undefined;
    }
    public set dataSource2(value: string) {
        if(this._requestParameters) this._requestParameters.dataSource2 = value;
    }
    public get matchKey() {
        return this._requestParameters && this._requestParameters.matchKey ? this._requestParameters.matchKey : undefined;
    }
    public set matchKey(value: string) {
        let _oVal = this._requestParameters.matchKey ? this._requestParameters.matchKey : undefined;
        if(this._requestParameters) this._requestParameters.matchKey = value;
        if(_oVal !== value && !this._doNotFetchOnParameterChange) {
            // wipe out all previous pages (they will have incorrect "bound" values)
            if(this._isRelationsResponse && this._relationPages && this._relationPages.clear) {
                this._relationPages.clear();
            } else if(this._entityPages && this._entityPages.clear) {
                this._entityPages.clear();
            }
            // get new sampleset
            this.updateDataWithParameters();
        } else {
            console.warn(`tried to set matchKey from "${_oVal}" to "${value}"`, this._doNotFetchOnParameterChange);
        }

    }
    public set pageIndex(value: number) {
        // first check if we're already on that page
        if(value !== this._currentPage && !this._doNotFetchOnParameterChange) {
            if(this._isRelationsResponse && this._relationPages.has(value)) {
                // grab previous value
                this._currentPage = value;
            } else if(this._entityPages.has(value)) {
                // grab previous value
                this._currentPage   = value;
            }

            // if one of the previous if statements set the current page
            // publish existing data
            //console.log(`set pageIndex(${value})`, this._currentPage === value, this._relationPages, this._entityPages);
            if(this._currentPage === value) {
                let dataset     = this.currentPageResults;
                let pageData    = this.currentPage;
                this._doNotFetchOnParameterChange = true;
                this.bound      = pageData.pageMinimumValue as string;
                console.warn(`already have page #${value}`, pageData);
                this._doNotFetchOnParameterChange = false;

                this._onDataUpdated.next(dataset);
                this._onPagingUpdated.next(this._getCurrentPageParameters());
            } else {
                // get current paging info
                let _cPageParams        = this._getCurrentPageParameters();
                let _pageToFindIndex    = value > 0 ? value : 0;
                let _boundValue         = undefined;
                let _boundType          = undefined;
                let _pageSize           = this.prefs.dataMart.samplePageSize;

                if(this._isRelationsResponse && this._relationPages.has(_pageToFindIndex)) {
                    // grab the "pageMaximumValue" value off of target page -1
                    _boundType          = SzBoundType.EXCLUSIVELOWER;
                    _boundValue         =  this._relationPages.get(_pageToFindIndex).pageMaximumValue;
                } else if(this._entityPages.has(value)) {
                    _boundType          = SzBoundType.EXCLUSIVELOWER;
                    _boundValue         =  this._entityPages.get(_pageToFindIndex).pageMaximumValue;

                } else if([_cPageParams.pageIndex - 1, _cPageParams.pageIndex + 1]) {
                    // new bound value has to be based on current page params
                    let isPrev      = (_cPageParams.pageIndex - 1) === value;
                    _pageSize   = _cPageParams.bound === 'max:max' ? this.prefs.dataMart.samplePageSize : _cPageParams.pageSize;
                    if(isPrev) {
                        // go prev
                        _boundType  = SzBoundType.EXCLUSIVEUPPER;
                        _boundValue = _cPageParams.pageMinimumValue;
                    } else {
                        _boundType  = SzBoundType.EXCLUSIVELOWER;
                        _boundValue = _cPageParams.pageMaximumValue;
                    }
                }
                //console.log(`boundType: "${_boundType}"\nbound: "${_boundValue}"\npageSize: ${_pageSize}`);
                if(_boundValue) {
                    this._doNotFetchOnParameterChange   = true;
                    if(_boundType)  this._requestParameters.boundType   = _boundType;
                    if(_pageSize)   this._requestParameters.pageSize    = _pageSize;
                    
                    this._requestParameters.bound       = _boundValue;
                    this._currentPage                   = value;
                    this._doNotFetchOnParameterChange   = false;
                    this.getSampleDataFromParameters();
                } else {
                    console.warn(`page requested(${value}) more than a page away from current(${this._currentPage})`, this.currentPageResults);
                }
            }
        } else {
            console.warn(`already on that page ${value} | ${this._currentPage}`);
        }
    }
    /** get the current dataset(s) page value */
    public get pageIndex(): number {
        return this._currentPage;
    }
    public set pageSize(value: number) {
        let _oVal = (this._requestParameters && this._requestParameters.pageSize) ? this._requestParameters.pageSize : this.prefs.dataMart.samplePageSize;
        this.prefs.dataMart.samplePageSize   = value;
        //this._lastSelectedPageSize = value;
        if(_oVal !== value && !this._doNotFetchOnParameterChange) {
            // wipe out all previous pages (they will have incorrect "bound" values)
            if(this._isRelationsResponse && this._relationPages && this._relationPages.clear) {
                this._relationPages.clear();
            } else if(this._entityPages && this._entityPages.clear) {
                this._entityPages.clear();
            }
            // get new sampleset
            this._requestParameters.pageSize = value;
            this.updateDataWithParameters();
        } else {
            console.warn(`pageSize already set to current value: ${_oVal} | ${value}`);
        }
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
    public get principle() {
        return this._requestParameters && this._requestParameters.principle ? this._requestParameters.principle : undefined;
    }
    public set principle(value: string) {
        if(this._requestParameters) this._requestParameters.principle = value;
    }
    public get sampleSize() {
        return this._requestParameters && this._requestParameters.sampleSize ? this._requestParameters.sampleSize : undefined;
    }
    public set sampleSize(value: number) {
        if(this._requestParameters) this._requestParameters.sampleSize = value;
    }
    /** get the total count of relationship pairs(if a relationship type request) 
     * or the total entity count for statTypes that request entities(Matches)
    */
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
    public get pageSize() {
        return this._requestParameters && this._requestParameters.pageSize ? this._requestParameters.pageSize : this.prefs.dataMart.samplePageSize;
    }
    /** this is the number of results in the sampleset prior to filter parameters being applied. */
    public set unfilteredCount(value: number) {
        this._unfilteredCount   = value;
    }
    /** this is the number of results in the sampleset prior to filter parameters being applied. */
    public get unfilteredCount(): number {
        return this._unfilteredCount;
    }

    /*
    public set totalCount(value: number) {
        if(this._requestParameters && this._requestParameters.pageSize) this._requestParameters.pageSize = value;
    }*/

    private get hasEnoughParametersForRequest(): boolean {
        let retVal = false;
        if((this._dataSource1 || this._dataSource2) && this._statType) {
            retVal = true;
        }
        return retVal;
    };

    public set doNotFetchOnParameterChange(value: boolean) {
        this._doNotFetchOnParameterChange = value;
    }

    // -------------------------------- event subjects and observables --------------------------------

    private _onDataUpdated: BehaviorSubject<SzEntityData[] | SzRelation[]>      = new BehaviorSubject<SzEntityData[]>(undefined);
    private _onPagingUpdated: BehaviorSubject<SzStatSampleSetPageChangeEvent>   = new BehaviorSubject<SzStatSampleSetPageChangeEvent>(undefined)
    private _loading: BehaviorSubject<boolean>                                  = new BehaviorSubject<boolean>(undefined);
    private _onNoResults: BehaviorSubject<boolean>                              = new BehaviorSubject<boolean>(undefined);

    /** when api requests are being made */
    public loading = this._loading.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    );
    /** when the response data for a page is ready this event is published */
    public onDataUpdated = this._onDataUpdated.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    );
    /** when the api requests finish and there are no results available */
    public onNoResults = this._onNoResults.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    );
    /** when updated page information is made available */
    public onPagingUpdated = this._onPagingUpdated.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    );

    // ---------------------------------- lifecycle methods ----------------------------------
    constructor( 
        private parameters: SzStatSampleSetParameters,
        private prefs: SzPrefsService,
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
    /** 
     * if enough parameters have been passed to the constructor to make a request 
     * a request will be made and properties populated, and events will be emitted.
    */
    public init() {
        if(this.hasEnoughParametersForRequest) {
            //console.log(`\tinit(): `, this._dataSource1, this._dataSource2);
            this.getSampleDataFromParameters();
        }
    }
    public refresh() {
        if(this.hasEnoughParametersForRequest) {
            this.getSampleDataFromParameters();
        }
    }

    /**
     * unsubscribe on destroy
     */
    destroy() {
        this._loading.next(false);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    // ------------------------------------ sub-routines and methods for more DRY ------------------------------------
    
    /** return a page change event that contains all the response page information plus
     * a few mutated ones for property type/name cohesion.
     * @internal
     */
    private _getCurrentPageParameters(): SzStatSampleSetPageChangeEvent {
        let _retVal: SzStatSampleSetPageChangeEvent;
        if(this._isRelationsResponse) {
            // pass relations page minus entities
            let _cPageParams        = this.pagingParametersForRelations;
            let _cPageResults       = this.currentPageResults;
            let _overwriteObj:any   = {statType: this.statType, totalCount: this.totalCount, pageItemCount: 0,  pageIndex: this._currentPage};
            if(this.bound) { _overwriteObj.bound = this.bound; }
            if(_cPageResults && _cPageResults.length) { _overwriteObj.pageItemCount = _cPageResults.length; }
            //console.log(`\t_getCurrentPageParameters: pagingParametersForRelations: `, this.pagingParametersForRelations);
            _retVal = Object.assign(
                _overwriteObj, 
                _cPageParams
            );
        } else {
            // pass entity page minus entities
            let _cPageParams        = this.pagingParametersForEntities;
            let _cPageResults       = this.currentPageResults;
            let _overwriteObj:any   = {statType: this.statType, totalCount: this.totalCount, pageItemCount: 0, pageIndex: this._currentPage};
            if(this.bound) { _overwriteObj.bound = this.bound; }
            if(_cPageResults && _cPageResults.length) { _overwriteObj.pageItemCount = _cPageResults.length; }

            _retVal = Object.assign(
                _overwriteObj, 
                this.pagingParametersForEntities, 
                _cPageParams
            );
        }
        console.info(`_getCurrentPageParameters()`, _retVal);
        return _retVal;
    }
    /** 
     * We need to get full entity data for entity objects since the datamart endpoints 
     * return minimal information. Gets the SzEntityData[] responses for multiple entities 
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
     * Constructs the actual DataMart API call from its' parameters and retuns a Observeable.
     * @returns Observable<SzEntitiesPage | SzRelationsPage | Error
     */
    private _getNewSampleSet(statType: SzCrossSourceSummaryCategoryType, dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string, principle?: string, bound?: string, boundType?: SzBoundType, sampleSize?: number, pageSize?: number) : Observable<SzEntitiesPage | SzRelationsPage | Error> {
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
            console.log(`\t\t\tcalling versus "${apiMethod}(${dataSource1},${dataSource2}, ${matchKey}, ${principle}, ${bound}, ${boundType}, ${pageSize}, ${sampleSize})"`);
            // dataSourceCode: string, vsDataSourceCode: string, matchKey?: string, principle?: string, bound?: string, boundType?: SzBoundType, pageSize?: number, sampleSize?: number, observe?: 'body', reportProgress?: boolean
            return _disAmbiMethod.call(this.statsService, dataSource1, dataSource2, matchKey, principle, bound, boundType, pageSize, sampleSize).pipe(
                tap((response: SzPagedEntitiesResponse | SzPagedRelationsResponse) => {
                    console.log(`got cross source entity id's or relations: `, response);
                    if(response && response.data) {
                        //this.onCrossSourceSummaryStats.next(response.data);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    this._onNoResults.next(true);
                    return err;
                }),
                map((response: SzPagedEntitiesResponse | SzPagedRelationsResponse) => {
                    return response.data;
                })
            )
        } else {
            console.log(`\t\t\tcalling "${apiMethod}(${dataSource1}, ${matchKey}, ${principle}, ${bound}, ${boundType}, ${pageSize}, ${sampleSize})"`);
            // dataSourceCode: string, matchKey?: string, principle?: string, bound?: number, boundType?: SzBoundType, pageSize?: number, sampleSize?: number, observe?: 'body', reportProgress?: boolean
            return _disAmbiMethod.call(this.statsService, dataSource1, matchKey, principle, bound, boundType, pageSize, sampleSize).pipe(
                tap((response: SzPagedEntitiesResponse) => {
                    console.log(`got single source sample entity ids: `, response);

                    if(response && response.data) {
                        //this.onCrossSourceSummaryStats.next(response.data);
                    } else {
                        this._onNoResults.next(true);
                    }
                }),
                catchError((err)=> {
                    console.error('error: ', err);
                    this._onNoResults.next(true);
                    return err;
                }),
                map((response: SzPagedEntitiesResponse) => {
                    return response.data;
                })
            )
        }
    }
    /**
     * The main method used for populating and extending the data returned from multiple
     * API calls. Performs transforms and batch requests, updates properties, and publishes
     * events.
     */
    private getSampleDataFromParameters() {
        console.time('SzStatSampleSet.getSampleDataFromParameters()');

        this._loading.next(true);

        this._getNewSampleSet(this.statType, this.dataSource1, this.dataSource2, this.matchKey, this.principle, this.bound, this.boundType, this.sampleSize, this.pageSize).pipe(
            takeUntil(this.unsubscribe$),
            filter((data: SzEntitiesPage | SzRelationsPage) => {
                return this._dataSource1 !== undefined || this._dataSource2 !== undefined ? true : false;
            })
        ).subscribe((data: SzEntitiesPage | SzRelationsPage) => {
            let isEntityResponse        = (data as SzEntitiesPage).entities ? true : false; 
            this._isRelationsResponse   = !isEntityResponse;
            console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': got sampleset page: ', data);

            if(isEntityResponse) {
                let _dataPage               = (data as SzEntitiesPage);
                this._entityPages.set(this._currentPage, _dataPage);
                let _currentPageEntities   = _dataPage.entities;
                if(!_dataPage || (_dataPage && _dataPage.totalEntityCount === 0)) {
                    this._onNoResults.next(true);
                    return;
                }
                // get exploded entity data
                let entitiesToRequest = _currentPageEntities.filter((ent: SzEntity) => {
                    return !this._entities.has(ent.entityId);
                }).map((ent: SzEntity) => {
                    return ent.entityId;
                });

                const _extendEntityData = (edata: SzEntityData[] | undefined) => {
                    //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': got entities: ', edata);
                    // expanded data
                    if(edata && edata.forEach) {
                        edata.forEach((ent: SzEntityData) => {
                            // add to internal array
                            this._entities.set(ent.resolvedEntity.entityId, ent);
                        })
                    }
                    let dataset = this.currentPageResults;
                    //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': extended data: ', dataset);
                    console.timeEnd('SzStatSampleSet.getSampleDataFromParameters()');

                    this._loading.next(false);
                    this._onDataUpdated.next(dataset);
                    this._onPagingUpdated.next(this._getCurrentPageParameters());
                }

                if(_currentPageEntities && _currentPageEntities.length > 0) {
                    if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                        // this is probably a parameter change and we don't need to fetch any new data
                        _extendEntityData(undefined);
                    } else {
                        // fetch data
                        this.getEntitiesByIds(entitiesToRequest, false, SzDetailLevel.VERBOSE).pipe(
                            takeUntil(this.unsubscribe$),
                            take(1)
                        ).subscribe({next: _extendEntityData,
                            error: (err) => {
                                this._loading.next(false);
                                console.error(err);
                            }
                        });
                    }
                } else {
                    // there are no results and no entities to request
                    // just emit empty result
                    this._loading.next(false);
                    this._onDataUpdated.next(this.currentPageResults);
                    console.timeEnd('SzStatSampleSet.getSampleDataFromParameters()');
                    this._onNoResults.next(true);
                    return;
                }

                if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                    // there are no entities
                    // just emit empty result
                    this._onDataUpdated.next(this.currentPageResults);
                    this._loading.next(false);
                    console.timeEnd('SzStatSampleSet.getSampleDataFromParameters()');
                    if(_currentPageEntities && _currentPageEntities.length === 0) {
                        this._onNoResults.next(true); // no results
                    } else {
                        this._onNoResults.next(false); // has results
                    }
                    return;
                }
                //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': get entity data: ', entitiesToRequest);
            } else {
                // expand "relations" nodes with more complete data
                let _dataPage              = (data as SzRelationsPage);
                let _currentPageRelations  = _dataPage.relations;
                // no results
                if(!_dataPage || (_dataPage && _dataPage.totalRelationCount === 0)) {
                    this._onNoResults.next(true);
                    return;
                }
                // get entity ids
                let entitiesToRequest  = [];
                _currentPageRelations.forEach((rel: SzRelation) => {
                    let _entId  = rel && rel.entity && rel.entity.entityId ? rel.entity.entityId : undefined;
                    let _relId  = rel && rel.relatedEntity && rel.relatedEntity.entityId ? rel.relatedEntity.entityId : undefined;
                    if(_entId && !this._entities.has(_entId) && entitiesToRequest.indexOf(_entId) < 0) { entitiesToRequest.push(_entId); }
                    if(_relId && !this._entities.has(_relId) && entitiesToRequest.indexOf(_relId) < 0) { entitiesToRequest.push(_relId); }
                });

                const _extendRelatedData = (edata: SzEntityData[] | undefined) => {
                    //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': got entities: ', edata);
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
                                //let _moddedRec          = Object.assign({}, _fullEntRecsMap.get(eRec.dataSource+'|'+eRec.recordId), {matchKey: rel.matchKey ? rel.matchKey : undefined, matchLevel: undefined});
                                return _fullEntRecsMap.get(eRec.dataSource+'|'+eRec.recordId);
                                //return _moddedRec;
                            });
                            // now extend ent with props from full ent (minus) the records
                            rel.relatedEntity = Object.assign(Object.assign({}, _fullEnt), rel.relatedEntity);
                        }
                        
                    })
                    //console.log(`\t\tExtended Data: `, _currentPageRelations);
                    this._relationPages.set(this._currentPage, _dataPage);
                    let dataset = this.currentPageResults;
                    //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': extended data: ', dataset);
                    console.timeEnd('SzStatSampleSet.getSampleDataFromParameters()');
                    this._loading.next(false);
                    this._onDataUpdated.next(dataset);
                    let _currentPageParams = this._getCurrentPageParameters();
                    //console.warn(`SzStatSampleSet.getSampleDataFromParameters().pageParams(${this._currentPage}): `, _currentPageParams, this._relationPages.get(this._currentPage));
                    this._onPagingUpdated.next(_currentPageParams);
                }

                if(_currentPageRelations && _currentPageRelations.length > 0) {
                    this._onNoResults.next(false); // has results
                    if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                        // this is probably a parameter change and we don't need to fetch any new data
                        _extendRelatedData(undefined);
                    } else {
                        //console.timeLog('SzStatSampleSet.getSampleDataFromParameters()', ': get entity data: ', entitiesToRequest);
                        this.getEntitiesByIds(entitiesToRequest, false, SzDetailLevel.VERBOSE).pipe(
                            takeUntil(this.unsubscribe$),
                            take(1)
                        ).subscribe({
                            next: _extendRelatedData,
                            error: (err) => {
                                this._loading.next(false);
                                console.error(err);
                            }
                        });
                    }
                } else {
                    // there are no results and no entities to request
                    // just emit empty result
                    this._loading.next(false);
                    this._onDataUpdated.next(this.currentPageResults);
                    console.timeEnd('SzStatSampleSet.getSampleDataFromParameters()');
                    this._onNoResults.next(true);
                    return;
                }
            }
        });
    }
    /** Called when one or more parameters change and we need to request new data */
    private updateDataWithParameters() {
        this.getSampleDataFromParameters();
    }
}

/**
 * Service class used to get data from the poc server using the 
 * datamart api(s). Stores state of responses and provides getters and setters to create 
 * and manage parameters for an instance of #SzStatSampleSet 
 * Largely used for statistics charts like the record count Donut Graph and the #SzCrossSourceStatistics component 
 * used to browse sampleset results in a data table format.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataMartService {
    // --------------------------------- internal variables ---------------------------------
    /** @internal */
    private _dataSources: string[] | undefined;
    /** @internal */
    private _dataSourceDetails: SzDataSourcesResponseData | undefined;
    /** @internal */
    private _dataSourcesInFlight: boolean                   = false;
    /** @internal */
    private _doNotFetchSampleSetOnParameterChange: boolean  = false;
    /** @internal */
    private _loadedStatistics: SzLoadedStats | undefined;
    /** @internal */
    private _loadedStatisticsInFlight                       = false;
    /** @internal */
    private _matchKeyCounts: SzCrossSourceCount[];
    /** @internal */
    private _onlyShowLoadedSummaryStatistics                = false;
    /** @internal */
    private _sampleSet: SzStatSampleSet;
    /** @internal */
    private _sampleSetBound: string;
    /** @internal */
    private _sampleSetBoundType: SzBoundType;
    /** @internal */
    private _sampleSetMatchKey: string;
    /** @internal */
    private _sampleSetPrinciple: string;
    //private _sampleStatType: SzCrossSourceSummaryCategoryType | undefined;
    /** @internal */
    private _sampleSetUnfilteredCount: number;
    /** @internal */
    private _summaryStatistics: SzSummaryStats | undefined;
    /** @internal */
    private _summaryStatisticsInFlight                      = false;

    // --------------------------------- Getters and Setters ---------------------------------
    /** get the "from" datasource assigned from the pulldowns */
    public get dataSource1() {
        return this.prefs.dataMart.dataSource1;
    }
    /** set the "to" datasource assigned from the pulldowns */
    public set dataSource1(value: string) {
        this.prefs.dataMart.dataSource1 = value;
        this.onDataSource1Change.next(value);
        this._onDataSourceSelected.next(value);
    }
    /** get the "from" datasource assigned from the pulldowns */
    public get dataSource2() {
        return this.prefs.dataMart.dataSource2;
    }
    /** get the "to" datasource assigned from the pulldowns */
    public set dataSource2(value: string) {
        this.prefs.dataMart.dataSource2 = value;
        this.onDataSource2Change.next(value);
        this._onDataSourceSelected.next(value);
    }
    /** whether or not the sampleset object automatically creates a new request when primary(datasources, matchLevel) or filtering(pageIndex, principle) parameters change */
    public set doNotFetchSampleSetOnParameterChange(value: boolean) {
        if(this._sampleSet) {
            this._sampleSet.doNotFetchOnParameterChange = value;
        }
    }
    /** get the statistics for how many records from which datasources have beeen loaded */
    public get loadedStatistics(): SzLoadedStats | undefined {
        if(!this._loadedStatistics) this._getLatestLoadedStats();
        return this._loadedStatistics;
    }
    /* Gets the summary statistics for each data source versus every other  data source including itself. */    public get summaryStatistics(): SzSummaryStats | undefined {
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
    /** we store the last known match key counts for present selection for filtering menu */
    public get matchKeyCounts() {
        return this._matchKeyCounts;
    }
    /** we store the last known match key counts for present selection for filtering menu */
    public set matchKeyCounts(value: SzCrossSourceCount[]) {
        this._matchKeyCounts = value;
    }
        
        // ----------------------- sample set instance getters/setters -----------------------
    /** get the "from" datasource name assigned to the sample set instance */
    public get sampleDataSource1() {
        return this.prefs.dataMart.sampleDataSource1;
    }
    /** set the "from" datasource name assigned to the sample set instance */
    public set sampleDataSource1(value: string) {
        let _oType = this.prefs.dataMart.sampleDataSource1;
        this.prefs.dataMart.sampleDataSource1 = value;
        let _evt = this.prefs.dataMart.sampleDataSource2 ? {dataSource2: this.prefs.dataMart.sampleDataSource2, dataSource1: value} : {dataSource2: value};
        if(_oType !== value) this.onSampleDataSourceChange.next(_evt); // only emit on change
    }
    /** get the "to" datasource name assigned to the sample set instance */
    public get sampleDataSource2() {
        return this.prefs.dataMart.sampleDataSource2;
    }
    /** set the "to" datasource name assigned to the sample set instance */
    public set sampleDataSource2(value: string) {
        let _oType = this.prefs.dataMart.sampleDataSource2;
        this.prefs.dataMart.sampleDataSource2 = value;
        let _evt = this.prefs.dataMart.sampleDataSource1 ? {dataSource1: this.prefs.dataMart.sampleDataSource1, dataSource2: value} : {dataSource2: value};
        if(_oType !== value) this.onSampleDataSourceChange.next(_evt); // only emit on change
    }
    /** get the matchLevel assigned to the sample set instance */
    public get sampleMatchLevel() {
        return this.prefs.dataMart.sampleMatchLevel;
    }
    /** set the matchLevel assigned to the sample set instance. 
     *  will trigger new sampleset request if different from current one.
    */
    public set sampleMatchLevel(value: number) {
        this.prefs.dataMart.sampleMatchLevel = value;
        this.onSampleMatchLevelChange.next(value);
    }
    /** set the page size assigned to the sample set instance */
    public set sampleSetPageSize(value: number) {
        let _oType = this.prefs.dataMart.samplePageSize;
        //this.prefs.dataMart.samplePageSize = value;
        if(_oType !== value && this._sampleSet) {
            // check to see if we need to make a new sample request
            this._sampleSet.pageSize = value;
        }
    }
    /** get the page size assigned to the sample set instance */
    public get sampleSetPageSize() {
        if(this._sampleSet && this._sampleSet.pageSize) {
            return this._sampleSet.pageSize;
        } else {
            return this.prefs.dataMart.samplePageSize;
        }
    }
    /** get the bound assigned to the sample set instance. this is either the 
     * "{entityId}" OR the combo "{entityId}:{relatedId}" that the sampleset ends/begins with.
     */
    public get sampleSetBound(): string {
        if(this._sampleSet) {
            return this._sampleSet.bound;
        } else {
            return this._sampleSetBound;
        }
    }
    /** set the bound assigned to the sample set instance. this is either the 
     * "{entityId}" OR the combo "{entityId}:{relatedId}" to start/end at.
     */
    public set sampleSetBound(value: string) {
        if(this._sampleSet) {
            this._sampleSet.bound = value;
        } else {
            this._sampleSetBound = value;
        }
    }
    /** get the boundType assigned to the sample set instance. possible values are 
     * "INCLUSIVE_LOWER" | "EXCLUSIVE_LOWER" | "INCLUSIVE_UPPER" | "EXCLUSIVE_UPPER"
     */
    public get sampleSetBoundType(): SzBoundType {
        if(this._sampleSet) {
            return this._sampleSet.boundType;
        } else {
            return this._sampleSetBoundType;
        }
    }
    /** set the boundType assigned to the sample set instance. possible values are 
     * "INCLUSIVE_LOWER" | "EXCLUSIVE_LOWER" | "INCLUSIVE_UPPER" | "EXCLUSIVE_UPPER"
     * 
     *  will trigger new sampleset request if different from current one.
     */
    public set sampleSetBoundType(value: SzBoundType) {
        if(this._sampleSet) {
            this._sampleSet.boundType = value;
        } else {
            this._sampleSetBoundType = value;
        }
    }
    /** get the matchKey assigned to the sample set instance */
    public get sampleSetMatchKey(): string {
        return this._sampleSet ? this._sampleSet.matchKey : this._sampleSetMatchKey;
    }
    /** set the matchKey assigned to the sample set instance. will trigger new sampleset request if different from current one. */
    public set sampleSetMatchKey(value: string) {
        this._sampleSetMatchKey = value;
        if(this._sampleSet) {
            this._sampleSet.matchKey = value;
            console.warn(`storing sampleSetMatchKey at sampleset context value: ${this._sampleSet.matchKey} | ${value}`);

        } else {
            // first request ??
            console.warn(`storing sampleSetMatchKey on local value: ${this._sampleSetMatchKey} | ${value}`);
            this._sampleSetMatchKey  = value;
        }
    }
    /** set the current page index assigned to the sample set instance */
    public set sampleSetPage(value: number) {
        if(this._sampleSet) {
            this._sampleSet.pageIndex = value;
        }
    }
    /** get the principle assigned to the sample set instance */
    public get sampleSetPrinciple(): string {
        return this._sampleSet ? this._sampleSet.principle : this._sampleSetPrinciple;
    }
    /** set the principle assigned to the sample set instance */
    public set sampleSetPrinciple(value: string) {
        if(this._sampleSet) {
            this._sampleSet.principle = value;
        } else {
            this._sampleSetPrinciple = value;
        }
    }
    /** get the statType assigned to the sample set instance 
     * possible values are "MATCHES" | "AMBIGUOUS_MATCHES" | "POSSIBLE_MATCHES" | "POSSIBLE_RELATIONS" | "DISCLOSED_RELATIONS"
    */
    public get sampleStatType() : SzCrossSourceSummaryCategoryType {
        return this.prefs.dataMart.sampleStatType;
    }
    /** set the statType assigned to the sample set instance 
     * possible values are "MATCHES" | "AMBIGUOUS_MATCHES" | "POSSIBLE_MATCHES" | "POSSIBLE_RELATIONS" | "DISCLOSED_RELATIONS"
    */
    public set sampleStatType(value: SzCrossSourceSummaryCategoryType) {
        let _oType = this.prefs.dataMart.sampleStatType;
        this.prefs.dataMart.sampleStatType = value;
        if(_oType !== value) this.onSampleTypeChange.next(this.prefs.dataMart.sampleStatType);  // only emit on change
    }
    /** the number of results in the sampleset prior to filter parameters being applied. */
    public set sampleSetUnfilteredCount(value: number) {
        if(this._sampleSet) {
            this._sampleSet.unfilteredCount = value;
        } else {
            this._sampleSetUnfilteredCount = value;
        }
    }
    /** the number of results in the sampleset prior to filter parameters being applied. */
    public get sampleSetUnfilteredCount(): number {
        return this._sampleSet ? this._sampleSet.unfilteredCount : this._sampleSetUnfilteredCount;
    }

    // -------------------------------- event subjects and observables --------------------------------

    /* @internal */
    private _onDataSourceSelected:      BehaviorSubject<string | undefined>     = new BehaviorSubject<string | undefined>(undefined);
    /* @internal */
    private _onSampleNoResults$:        Subscription;
    /* @internal */
    private _onSampleNoResults:         BehaviorSubject<boolean>                = new BehaviorSubject(undefined);
    /* @internal */
    private _onSampleResultChange$:     Subscription;
    /* @internal */
    public  _onSampleResultChange:      BehaviorSubject<SzEntityData[] | SzRelation[] | undefined> = new BehaviorSubject<SzEntityData[] | undefined>(undefined);
    /* @internal */
    private _onSamplePageUpdated$:      Subscription;
    /* @internal */
    private  _onSamplePageChange:        BehaviorSubject<SzStatSampleSetPageChangeEvent | undefined> = new BehaviorSubject<SzStatSampleSetPageChangeEvent | undefined>(undefined);

    /** when the "from" data source selection changes in the preferences. the preference may change without changing the value of "datasource1" in the sampleset. */
    public onDataSource1Change:         BehaviorSubject<string | undefined>     = new BehaviorSubject<string | undefined>(undefined);
    /** when the "to" data source selection changes in the preferences. the preference may change without changing the value of "datasource1" in the sampleset. */
    public onDataSource2Change:         BehaviorSubject<string | undefined>     = new BehaviorSubject<string | undefined>(undefined);
    /** when either data source selection changes in the preferences. the preference may change without changing the value of "datasource1" in the sampleset. */
    public onDataSourceSelected                                                 = this._onDataSourceSelected.asObservable();
    /** count stats are changes when a new sample set has responded and been scanned for how many records per column are present. If the result for a column is "0" then the column is displayed in a "collapsed" state. */
    public onCountStats:                BehaviorSubject<SzLoadedStats | undefined>      = new BehaviorSubject<SzLoadedStats>(undefined);
    /** when the count stats for a specific combination of "datasource1" vs "datasource2" are made available. */
    public onCrossSourceSummaryStats:   Subject<SzCrossSourceSummary | undefined> = new BehaviorSubject<SzCrossSourceSummary>(undefined);
    /** when "datasource1" or "datasource2" are changed for the sampleset. */
    public onSampleDataSourceChange:    BehaviorSubject<sampleDataSourceChangeEvent | undefined> = new BehaviorSubject<sampleDataSourceChangeEvent | undefined>(undefined);
    /** when "matchLevel" for the sampleset is changed. */
    public onSampleMatchLevelChange:    BehaviorSubject<number | undefined>     = new BehaviorSubject<number>(undefined);
    /** when "type" for the sampleset is changed. possible values are "MATCHES" | "AMBIGUOUS_MATCHES" | "POSSIBLE_MATCHES" | "POSSIBLE_RELATIONS" | "DISCLOSED_RELATIONS" */
    public onSampleTypeChange:          BehaviorSubject<SzCrossSourceSummaryCategoryType | undefined> = new BehaviorSubject<SzCrossSourceSummaryCategoryType>(undefined);
    /** when "matchLevel" for the sampleset is changed. */
    public onSummaryStats:              BehaviorSubject<SzSummaryStats | undefined>     = new BehaviorSubject<SzSummaryStats>(undefined);

    /** when a new sample set is being requested 
     * @internal
    */
    private _onSampleRequest$: Subscription;
    /** @internal */
    private _onSampleRequest: BehaviorSubject<boolean> = new BehaviorSubject(undefined);
    /** on new sample request being made. */
    public  onSampleRequest = this._onSampleRequest.asObservable().pipe(
        filter((res) => { return res !== undefined; }),
        distinctUntilChanged((prev, current) => { 
            return prev !== current;
        }),
        tap((res) => {
            //console.warn(`DataMartService._onSampleRequest`, res);
        })
    );
    /** when the sampleset requested returns no results */
    public  onSampleNoResults = this._onSampleNoResults.asObservable().pipe(
        filter((res) => { return res !== undefined; }),
        tap((res) => {
            console.log(`DataMartService._onSampleNoResults`, res);
        })
    );
    /** when a new sample set has completed */
    public onSampleResultChange = this._onSampleResultChange.asObservable().pipe(
        filter(r => r !== undefined),
        tap((r) => {
            //console.log(`the fuck? onSampleResultChange: `, r)
        })
    );
    /** when a page from the sample set has been updated or parameters have changed */
    public onSamplePageChange = this._onSamplePageChange.asObservable().pipe(
        filter(r => r !== undefined),
        tap((r) => {
            //console.log(`the fuck? onSampleResultChange: `, r)
        })
    );

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
        /*this.onSampleRequest.subscribe((isLoading)=>{
            console.warn(`DataMartService.onSampleRequest: ${isLoading}`);
        });*/
    }

    // ------------------------------------ sub-routines and methods for more DRY ------------------------------------

    /** 
     * Request a new sampleset from the parameters passed to the method. 
     * sampleset is initialized and kept in a local reference */
    public createNewSampleSetFromParameters(statType: SzCrossSourceSummaryCategoryType, dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string, principle?: string, bound?: number, sampleSize?: number, pageSize?: number, unfilteredCount?: number) {
        // clear any previous subscription
        if(this._onSampleRequest$) {
            this._onSampleRequest$.unsubscribe();
            this._onSampleRequest$ = undefined;
            this._onSampleRequest.next(false);
        }
        if(this._onSamplePageUpdated$) {
            this._onSamplePageUpdated$.unsubscribe();
            this._onSamplePageUpdated$ = undefined;
        }
        if(this._onSampleResultChange$) {
            this._onSampleResultChange$.unsubscribe();
            this._onSampleResultChange$ = undefined;
            this._onSampleRequest.next(false);
        }
        if(this._onSampleNoResults$) {
            this._onSampleNoResults$.unsubscribe();
            this._onSampleNoResults$ = undefined;
        }
        
        console.log('createNewSampleSetFromParameters: ', {
            statType: statType, 
            dataSource1: dataSource1, 
            dataSource2: dataSource2, 
            matchKey: matchKey, 
            principle: principle, 
            bound: bound, 
            sampleSize: sampleSize, 
            pageSize: pageSize, 
            unfilteredCount: unfilteredCount
        });
        // initialize new sample set
        this._onSampleRequest.next(true);
        this._sampleSet = new SzStatSampleSet({
            statType: statType,
            dataSource1: dataSource1,
            dataSource2: dataSource2,
            matchKey: matchKey,
            principle: principle,
            pageSize: pageSize
        }, this.prefs, this.statsService, this.entityDataService);
        
        if(unfilteredCount) {
            this._sampleSet.unfilteredCount = unfilteredCount;
            console.warn(`SET unfilteredCount to "${unfilteredCount}"`);
        } else {
            console.warn(`not setting unfilteredCount: "${unfilteredCount}"`);
        }
        
        this._onSampleResultChange$ = this._sampleSet.onDataUpdated.pipe(
            tap((res) => {
                // bubble up sample set evt to service scope
                if(res && res.length === 0) {
                    console.error('NOOOOO ${res}', res);
                }
                this._onSampleRequest.next(false);
                this._onSampleResultChange.next(res);
            })
        ).subscribe();
        this._onSamplePageUpdated$   = this._sampleSet.onPagingUpdated.pipe(
            tap((res) => {
                // bubble up sample set evt to service scope
                this._onSamplePageChange.next(res);
            })
        ).subscribe();
        this._onSampleRequest$   = this._sampleSet.loading.pipe(
            tap((res) =>{
                // bubble up sample set evt to service scope
                //console.log(`SzDataMartService.onSampleRequest: ${res}`);
                this._onSampleRequest.next(res);
            })
        ).subscribe();
        this._onSampleNoResults$   = this._sampleSet.onNoResults.pipe(
            tap((res) =>{
                // bubble up sample set evt to service scope
                console.log(`SzDataMartService.onNoResults: ${res}`);
                this._onSampleNoResults.next(res);
            })
        ).subscribe();

        return this._sampleSet.onDataUpdated;
    }

    /**
     * same as #getLoadedStatistics but with debounce safety. used from refreshing the list.
     * @internal */
    private _getLatestLoadedStats() {
        if(!this._loadedStatisticsInFlight) {
            console.log(`get first loaded stats`);
            this.getLoadedStatistics().pipe(
                take(1)
            ).subscribe();
        }
    }
    /** same as #getSummaryStatistics but with deboune safety 
     * @internal
    */
    private _getLatestSummaryStats() {
        if(!this._summaryStatisticsInFlight) {
            console.log(`get first summary stats`);
            this.getSummaryStatistics().pipe(
                take(1)
            ).subscribe();
        }
    }
    /** get cross source summary statistics for datasource vs datasource from the api surface. */
    public getCrossSourceStatistics(dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string) {
        if(dataSource1 && dataSource2) {
            return this.statsService.getCrossSourceSummaryStatistics(dataSource1, dataSource2, matchKey).pipe(
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
            return this.statsService.getCrossSourceSummaryStatistics(dataSource1, dataSource1, matchKey).pipe(
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
            return this.statsService.getCrossSourceSummaryStatistics(dataSource2, dataSource2, matchKey).pipe(
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
    /** get the type of stat matching the type from the cross source stat data response. */
    public getCrossSourceStatisticsByStatTypeFromData(statType: SzCrossSourceSummaryCategoryType, data: SzCrossSourceSummary): Array<SzRelationCounts> | Array<SzMatchCounts> {
        let _statKey    = 'matches';
        switch(statType){
            case SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES:
                _statKey = 'ambiguousMatches';
                break;
            case SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS:
                _statKey = 'disclosedRelations';
                break;
            case SzCrossSourceSummaryCategoryType.MATCHES:
                _statKey = 'matches';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES:
                _statKey = 'possibleMatches';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS:
                _statKey = 'possibleRelations';
                break;
            default:
                _statKey = 'matches';
                break;
        }
        if(data && data[_statKey]) {
            return data[_statKey]
        }
        return undefined;
    }
    /** get the list of datasources with their datasource code and id's from the api surface */
    public getDataSourceDetails() {
        return this.dataSourcesService.listDataSourcesDetails().pipe(
            tap((ds: SzDataSourcesResponseData) => {
                this._dataSourceDetails = ds.dataSourceDetails;
            })
        );
    }
    /** get the list of datasources from the api surface */
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
    /** get number of entity and records per datasource for each datasource from the api surface */
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
    }
    /* Gets the summary statistics for each data source versus every other  data source including itself.*/
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
    /** refresh the sampleset data */
    public refreshSampleSet() {
        if(this._sampleSet) {
            this._sampleSet.refresh();
        }
    }
}