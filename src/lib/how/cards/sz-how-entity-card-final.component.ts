import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { SzEntityIdentifier, SzVirtualEntity, SzVirtualEntityRecord } from '@senzing/rest-api-client-ng';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowFinalCardData } from '../../models/data-how';
import { SzHowCardBaseComponent } from './sz-how-entity-card-base.component';

/**
 * Display the "Why" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity entityId="5"&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity entityId="5"&gt;&lt;/sz-wc-why-entity&gt;<br/>
*/
@Component({
    selector: 'sz-how-entity-card-final',
    templateUrl: './sz-how-entity-card-final.component.html',
    styleUrls: ['./sz-how-entity-card-final.component.scss']
})
export class SzHowFinalCardComponent extends SzHowCardBaseComponent implements OnInit, OnDestroy {
  
    @Input()
    entityId: SzEntityIdentifier;
    @Input()
    virtualEntityId: SzVirtualEntity

    @HostBinding('class.sz-how-entity-card') cssCardClass: boolean = true;

    public stepsPanelOpenState = false;

    private _data: SzHowFinalCardData;
    @Input()
    set data(value: SzHowFinalCardData) {
        this._data = value;
        console.log('@senzing/sdk-components-ng/sz-how-entity-card-final.setData(): ', this._data);
    }
    get data(): SzHowFinalCardData {
        return this._data;
    }
    private _sources: {
        [key: string]: Array<SzVirtualEntityRecord> 
    };
    get sources() {
        // check if we have a cached version of this first
        if(!this._sources) {
            let _recordsByDataSource: {
                [key: string]: Array<SzVirtualEntityRecord> 
            } = {};
            this._data.resolvedVirtualEntity.records.forEach((dsRec) => {
                if(!_recordsByDataSource[dsRec.dataSource]) {
                    _recordsByDataSource[dsRec.dataSource] = [];
                }
                _recordsByDataSource[dsRec.dataSource].push(dsRec);
    
            });
            this._sources = _recordsByDataSource;
        }
        return this._sources;
    }
    get stepNumber() {
        return this._data.stepNumber;
    }

    /*
    private _data = {
        sources: [],
        names: [],
        addresses: [],
        emails: [],
        phone: [],
        ssn: [],
        dl: []
    }*/

    constructor(){
        super();
    }
    override ngOnInit() {}
    /**
     * unsubscribe when component is destroyed
     */
    override ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}