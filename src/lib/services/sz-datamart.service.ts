import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';

import {
    ConfigService as SzConfigService, SzConfigResponse,
    StatisticsService as SzStatisticsService,
    SzCountStats
} from '@senzing/rest-api-client-ng';

import { take, tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SzCountStatsForDataSourcesResponse } from '../models/stats';

// use mock data
import * as recordStatsStubData from '../../stubs/statistics/loaded/1.json';


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
    private _recordStatsStubData = recordStatsStubData;

    public onCountStats: Subject<SzCountStats | undefined> = new BehaviorSubject<SzCountStats>(undefined);
    
    constructor(private http: HttpClient, private statsService: SzStatisticsService) {}

    public getCountStatistics(): Observable<SzCountStatsForDataSourcesResponse> {
        //return this.statsService.getCountStatistics();
        let retVal = new Observable<SzCountStatsForDataSourcesResponse>();
        // for now just return stub data
        return of(this._recordStatsStubData as unknown as SzCountStatsForDataSourcesResponse).pipe(
            tap((response) => {
                if(response && response.data) {
                    this.onCountStats.next(response.data);
                }
            })
        )
    }

    /*public getRecordCounts(): Observable<any> {
        let retVal = new Observable();
        // for now just return stub data
        return of(this._recordStatsStubData);
        //return retVal;
    }*/
}