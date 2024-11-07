import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import * as datasourceStubData from '../../../stubs/datasources/datasources.json';
import * as statisticsLoadedStubData from '../../../stubs/statistics/loaded/loaded.json';
import * as statisticsSummaryStubData from '../../../stubs/statistics/summary/summary.json';

@Injectable()
export class MockTestDataInterceptor implements HttpInterceptor {
    constructor(private injector: Injector) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if(request.method === "GET" && request.url.indexOf("/data-sources") > 0) {
            console.log('intercepted datasource http request: ', request);
            return of(new HttpResponse({ status: 200, body: datasourceStubData }));
        }
        if(request.method === "GET" && request.url.indexOf("/statistics/loaded") > 0) {
            console.log('intercepted loaded statistics http request: ', request);
            return of(new HttpResponse({ status: 200, body: statisticsLoadedStubData }));
        }
        if(request.method === "GET" && request.url.indexOf("/statistics/summary") > 0) {
            console.log('intercepted summary statistics http request: ', request);
            return of(new HttpResponse({ status: 200, body: statisticsSummaryStubData }));
        }
        return next.handle(request);
    }
}