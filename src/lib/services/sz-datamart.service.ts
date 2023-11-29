import { Injectable, OnInit } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';

import {
    ConfigService as SzConfigService, SzConfigResponse,
} from '@senzing/rest-api-client-ng';

import { take, tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

// use mock data
import * as recordStatsStubData from '../../stubs/record-counts/by-datasource/1.json';

/**
 * methods used to get data from the poc server using the 
 * datamart api(s)
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataMartService implements OnInit {
    private _recordStatsStubData = recordStatsStubData;

    constructor(private http: HttpClient) {
        console.log('SzDataMartService(): ', this._recordStatsStubData);
        this.getRecordCounts();
    }

    ngOnInit(): void {
        this.getRecordCounts();
    }

    public getRecordCounts(): Observable<any> {
        let retVal = new Observable();
        // for now just return stub data
        return of(this._recordStatsStubData);
        //return retVal;
    }
}