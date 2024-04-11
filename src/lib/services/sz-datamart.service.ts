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
    SzDetailLevel
} from '@senzing/rest-api-client-ng';

import { take, tap, map, catchError, takeUntil, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SzCountStatsForDataSourcesResponse, SzStatCountsForDataSources } from '../models/stats';
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
    bound?: number;
    boundType?: SzBoundType;
    pageSize?: number;
    statType: SzCrossSourceSummaryCategoryType;
    page?: number;
}

export class SzStatSampleSet {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _dataSource1: string;
    private _dataSource2: string;
    private _bound: number = 0;
    private _boundType: SzBoundType = SzBoundType.EXCLUSIVELOWER;
    private _afterPageCount: number;
    private _beforePageCount: number;
    private _statType: SzCrossSourceSummaryCategoryType;
    private _matchKey: string;
    private _currentPage: number;
    private _currentPageEntities: SzEntity[];
    private _entities = new Map<SzEntityIdentifier, SzEntityData>();
    private _maximumValue: number;
    private _minimumValue: number;
    private _pages = new Map<number, SzEntityIdentifier>();
    private _pageMaximumValue: number;
    private _pageMinimumValue: number = 1;
    private _pageSize: number = 1000;
    private _totalEntityCount: number = 0;
    private _principle: string;
    private _sampleSize: number = 100;

    public get currentPageResults(): SzEntityData[] {
        let retVal = this._currentPageEntities.map((res: SzEntity) => {
            return this._entities.has(res.entityId) ? this._entities.get(res.entityId) : {};
        });
        return retVal;
    }

    private _onDataUpdated: BehaviorSubject<SzEntityData[]> = new BehaviorSubject<SzEntityData[]>(undefined);
    // we only want these publicly if they're not undefined
    public onDataUpdated = this._onDataUpdated.asObservable().pipe(
        takeUntil(this.unsubscribe$),
        filter(r => r !== undefined)
    )

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
            this._dataSource1 = parameters.dataSource1 ? parameters.dataSource1 : this._dataSource1;
            this._dataSource2 = parameters.dataSource2 ? parameters.dataSource2 : this._dataSource2;
            this._bound = parameters.bound ? parameters.bound : this._bound;
            this._boundType = parameters.boundType ? parameters.boundType : this._boundType;
            this._statType = parameters.statType ? parameters.statType : this._statType;
            this._pageSize = parameters.pageSize ? parameters.pageSize : this._pageSize;
            this._currentPage = parameters.page ? parameters.page : this._currentPage;
        }
        if(this.hasEnoughParametersForRequest && !deferInitialRequest) {
            this.init();
        }
    }

    public init() {
        if(this.hasEnoughParametersForRequest) {
            this._getNewSampleSet(this._statType, this._dataSource1, this._dataSource2, this._matchKey, this._principle, this._bound, this._sampleSize, this._pageSize).pipe(
                takeUntil(this.unsubscribe$)
            ).subscribe((data: SzEntitiesPage)=>{
                this._currentPageEntities = data.entities;
                // get exploded entity data
                let entitiesToRequest = this._currentPageEntities.filter((ent: SzEntity) => {
                    return !this._entities.has(ent.entityId);
                }).map((ent: SzEntity) => {
                    return ent.entityId;
                });

                if((entitiesToRequest && entitiesToRequest.length === 0) || !entitiesToRequest) {
                    // there are no entities
                    // just emit empty result
                    this._onDataUpdated.next(this.currentPageResults);

                    return;
                }
                this.getEntitiesByIds(entitiesToRequest).pipe(
                    takeUntil(this.unsubscribe$),
                    take(1)
                ).subscribe((edata: SzEntityData[]) => {
                    // expanded data
                    if(edata && edata.forEach) {
                        edata.forEach((ent: SzEntityData) => {
                            // add to internal array
                            this._entities.set(ent.resolvedEntity.entityId, ent);
                        })
                    }
                    let dataset = this.currentPageResults;
                    console.log(`got expanded entity data for sample set: `, this._entities, this._currentPageEntities);
                    this._onDataUpdated.next(dataset);
                });
            });
        }
    }

    /** get the SzEntityData[] responses for multiple entities 
     * @memberof
     */
    private getEntitiesByIds(entityIds: SzEntityIdentifiers, withRelated = true, detailLevel = SzDetailLevel.VERBOSE): Observable<SzEntityData[]> {
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

    private _getNewSampleSet(statType: SzCrossSourceSummaryCategoryType, dataSource1?: string | undefined, dataSource2?: string | undefined, matchKey?: string, principle?: string, bound?: number, sampleSize?: number, pageSize?: number) : Observable<SzEntitiesPage | Error> {
        let isVersus = false;
        let isOneDataSourceUndefined = dataSource1 === undefined || dataSource2 === undefined;
        let apiMethod = 'getEntityIdsForCrossMatches';
        // immediately show empty results while we wait
        this._onDataUpdated.next([]);

        // are we doing cross-source or single-source?
        if(dataSource1 && dataSource2 && dataSource1 !== dataSource2 && !isOneDataSourceUndefined) { isVersus = true; }

        // get the api method name to call for the stat type
        switch(statType){
            case SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES:
                apiMethod = isVersus ? 'getAmbiguouslyCrossMatchedEntityIds' : 'getAmbiguouslyMatchedEntityIds';
                break;
            case SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS:
                apiMethod = isVersus ? 'getDisclosedCrossRelatedEntityIds' : 'getDisclosedRelatedEntityIds';
                break;
            case SzCrossSourceSummaryCategoryType.MATCHES:
                apiMethod = isVersus ? 'getEntityIdsForCrossMatches' : 'getEntityIdsForSourceMatches';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES:
                apiMethod = isVersus ? 'getPossiblyCrossMatchedEntityIds' : 'getPossiblyMatchedEntityIds';
                break;
            case SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS:
                apiMethod = isVersus ? 'getPossiblyCrossRelatedEntityIds' : 'getPossiblyRelatedEntityIds';
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
            // dataSourceCode: string, vsDataSourceCode: string, matchKey?: string, principle?: string, bound?: string, boundType?: SzBoundType, pageSize?: number, sampleSize?: number, observe?: 'body', reportProgress?: boolean
            return _disAmbiMethod.call(this.statsService, dataSource1, dataSource2, matchKey, principle, bound, undefined, pageSize, sampleSize).pipe(
                tap((response: SzPagedEntitiesResponse) => {
                    console.log(`got cross source sample entity ids: `, response);
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
        } else {
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
    public _onSampleResultChange: BehaviorSubject<SzEntityData[] | undefined> = new BehaviorSubject<SzEntityData[] | undefined>(undefined);
    public onSampleResultChange = this._onSampleResultChange.asObservable().pipe(
        filter(r => r !== undefined)
    );
    private _onSampleResultChange$: Subscription;

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
        if(this._dataSources){ return this._dataSources; }
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
        return this.dataSourcesService.listDataSources().pipe(
            tap((ds: string[]) => {
                this._dataSources = ds;
            }),
            catchError((error) => {
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
        if(this._onSampleResultChange$) {
            this._onSampleResultChange$.unsubscribe();
            this._onSampleResultChange$ = undefined;
        }
        console.log('createNewSampleSetFromParameters: ', {
            statType: statType, dataSource1: dataSource1, dataSource2: dataSource2, matchKey: matchKey, principle: principle, bound: bound, sampleSize: sampleSize, pageSize: pageSize
        });
        // initialize new sample set
        this._sampleSet = new SzStatSampleSet({
            statType: statType,
            dataSource1: dataSource1,
            dataSource2: dataSource2
        }, this.statsService, this.entityDataService);
        
        this._onSampleResultChange$ = this._sampleSet.onDataUpdated.pipe(
            tap((res) =>{
                // bubble up sample set evt to service scope
                this._onSampleResultChange.next(res);
            })
        ).subscribe();

        return this._sampleSet.onDataUpdated;
    }
    /*public getRecordCounts(): Observable<any> {
        let retVal = new Observable();
        // for now just return stub data
        return of(this._recordStatsStubData);
        //return retVal;
    }*/
}