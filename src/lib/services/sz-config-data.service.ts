import { Injectable } from '@angular/core';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';

import {
    ConfigService as SzConfigService, SzConfigResponse,
} from '@senzing/rest-api-client-ng';

import { SzDataSourcesService } from './sz-datasources.service';
import { SzAdminService } from './sz-admin.service';
import { take, tap, map } from 'rxjs/operators';
/**
 * methods used to get data from the api server about its 
 * configuration
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzConfigDataService {
    private _config: any;
    constructor(public configDataService: SzConfigService) {

    }

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

    getFeaturesFromConfig(config: {[key: string]: Array<any> | any}) {
        console.log('getFeaturesFromConfig: ', config);
        if(config && config['CFG_FTYPE']) {
            // config has featuress
            return config['CFG_FTYPE']
        }
    }

    getOrderedFeatures(): Observable<string[]> | undefined{
        let _retVal = new Subject<string[]>();
        let retVal = _retVal.asObservable();
        this.getActiveConfig().subscribe((res: any)=>{
            let fTypes = this.getFeaturesFromConfig(res)
            let assocFtypes = fTypes.map((feat: any) => {
                return feat.FTYPE_CODE;
            });
            _retVal.next(assocFtypes);
            console.log('getOrderedFeatures: ', assocFtypes);
        });
        return retVal;
    }
}