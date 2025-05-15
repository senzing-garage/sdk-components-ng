import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
    SzFeatureScore, SzVirtualEntityRecord 
} from '@senzing/rest-api-client-ng';
import { SzHowStepCardBase } from './sz-how-card-base.component';

/**
 * @internal
 * 
 * This is the basic card that represents a step in the how report for an entity.
 * The cards will display the step number, title, match keys, and inbound and outbound 
 * features and scores etc.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-step-card [data]="data" [virtualEntitiesById]="virtualEntitiesById"></sz-how-step-card>
 * 
 * @example 
 * <!-- (WC) -->
 * <sz-wc-how-rc-step-card data="data" virtualEntitiesById="virtualEntitiesById"></sz-wc-how-rc-step-card>
*/
@Component({
    selector: 'sz-how-singleton-card',
    templateUrl: './sz-how-singleton-card.component.html',
    styleUrls: ['./sz-how-card-base.component.scss'],
    standalone: false
})
export class SzHowSingletonCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy {
    override get title(): string {
        let retVal = '';
        if(this.isSingleton) {
            retVal = 'Record';
            if(this._data && this._data.records && this._data.records.length > 1) {
                retVal += 's';
            }
        }
        return retVal;
    }
    get dataRecords(): SzVirtualEntityRecord[] {
        let retVal = [];

        if(this._data && this._data.records) {
            retVal = this._data.records;
            /*
            let _tempMap = new Map<string,SzFeatureScore>();
            for(let fkey in this._data.matchInfo.featureScores) {
                this._data.matchInfo.featureScores[fkey].forEach((featScore: SzFeatureScore) => {
                    if(_tempMap.has(fkey)) {
                        // we only want to append if highest score of fType
                        if(_tempMap.get(fkey).score < featScore.score) {
                            _tempMap.set(fkey, featScore);
                        }
                    } else {
                        // just append
                        _tempMap.set(fkey, featScore);
                    }
                });
            }
            retVal = [..._tempMap.values()];
            // if we have features from config we should return the  
            // values in that order
            if(this.howUIService.orderedFeatures && this.howUIService.orderedFeatures.length > 0) {
                //console.log('reordering virtual card features by config order: ', this.featureOrder);
                retVal.sort((
                    a: SzFeatureScore, 
                    b: SzFeatureScore
                ) => {
                    return this.howUIService.orderedFeatures.indexOf(a.featureType) - this.howUIService.orderedFeatures.indexOf(b.featureType);
                });
            }*/

        }
        //console.info('dataRows: ', retVal, this.featureOrder);
        return retVal;
    }
}