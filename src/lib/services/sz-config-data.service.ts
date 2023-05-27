import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import {
    ConfigService as SzConfigService, SzConfigResponse,
} from '@senzing/rest-api-client-ng';

import { take, tap, map } from 'rxjs/operators';

/**
 * methods used to get data from the api server about its 
 * configuration.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzConfigDataService {
    private _config: any;
    private _orderedFeatureTypes: string[] | undefined;

    constructor(public configDataService: SzConfigService) {}

    /** get the active config from the api/poc server */
    getActiveConfig() {
        return this.configDataService.getActiveConfig().pipe(
            take(1)
        ).pipe(
            tap((res: SzConfigResponse)=>{
                console.log('getActiveConfig: ', res);
            }),
            map((res: SzConfigResponse): any => {
                if(res.rawData && Object.keys(res.rawData).length > 0) {
                    // we have at least "1" config
                    let defConfig = res.rawData[ Object.keys(res.rawData)[0] ];
                    console.log('\tkeys: ', Object.keys(res.rawData)[0], defConfig);

                    return defConfig;
                }
                return res
            })
        );
    }
    /** get features as defined/ordered from configuration response */
    getFeaturesFromConfig(config: {[key: string]: Array<any> | any}) {
        console.log('getFeaturesFromConfig: ', config);
        if(config && config['CFG_FTYPE']) {
            // config has featuress
            return config['CFG_FTYPE']
        }
    }
    /** the feature names from a poc/api server in the order defined on the server  */
    getOrderedFeatures(pullFromCacheIfAvailable?: boolean): Observable<string[]> | undefined{
        let _retVal = new Subject<string[]>();
        let retVal = _retVal.asObservable();
        if(pullFromCacheIfAvailable && this._orderedFeatureTypes) {
            _retVal.next(this._orderedFeatureTypes);
        } else {
            this.getActiveConfig().subscribe((res: any)=>{
                let fTypes = this.getFeaturesFromConfig(res)
                let assocFtypes = fTypes.map((feat: any) => {
                    return feat.FTYPE_CODE;
                });
                this._orderedFeatureTypes = assocFtypes;
                _retVal.next(assocFtypes);
                console.log('getOrderedFeatures: ', assocFtypes);
            });
        }
        return retVal;
    }
}