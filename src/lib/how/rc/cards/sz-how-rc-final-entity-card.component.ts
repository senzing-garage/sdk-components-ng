import { Component, OnInit, Input, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../../services/sz-config-data.service';
import { SzResolvedVirtualEntity } from '../../../models/data-how';
import { Subject} from 'rxjs';
import { SzHowUIService } from '../../../services/sz-how-ui.service';

/**
 * How Final Entity Card
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-rc-final-entity-card [data]="szVirtualEntityInstance"&gt;&lt;/sz-how-rc-final-entity-card&gt;<br/><br/>
 *
*/
@Component({
    selector: 'sz-how-rc-final-entity-card',
    templateUrl: './sz-how-rc-final-entity-card.component.html',
    styleUrls: ['./sz-how-rc-final-entity-card.component.scss']
})
export class SzHowRCFinalEntityCardComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep};
    private _data: SzVirtualEntity;
    private _parentStep: SzResolutionStep;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isFinalEntityExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isFinalEntityExpanded(this.id);
    }
    @HostBinding('class.type-final') get cssTypeClass(): boolean {
        return true;
    }

    @Input() featureOrder: string[];
    @Input() set data(value: SzVirtualEntity) {
        this._data = value;
    }
    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    get id(): string {
        return this._data && this._data.virtualEntityId ? this._data.virtualEntityId : undefined;
    }
    get data() : SzVirtualEntity {
        return this._data;
    }
    get parentStep() {
        return this._parentStep;
    }
    get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    public get isCollapsed() {
        return !this.howUIService.isFinalEntityExpanded(this.id);
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    public isFinalEntity: true;
    public get hasDataSources(): number {
        let retVal = 0;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            retVal = _resolvedEntity.recordSummaries.length;
        }
        return retVal;
    }
    public get title(): string {
        let retVal = '';
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity) {
            retVal = `Final Entity ${_resolvedEntity.virtualEntityId}: ${_resolvedEntity.entityName}`;
        }
        return retVal;
    }
    public get dataSourcesAsString(): string {
        let retVal = '';
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            let db_str = _resolvedEntity.recordSummaries.map((rs: SzDataSourceRecordSummary) => {
                return `${rs.dataSource} (${rs.recordCount})`;
            }).join(' | ');
            retVal += `${db_str}`;
        }
        return retVal;
    }
    public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this._data.virtualEntityId)) {
            let retVal = this._virtualEntitiesById.get(this._data.virtualEntityId);
            return retVal;
        } else {
            //console.log(`no virtual entity: ${this._data.virtualEntityId}`, this._virtualEntitiesById, this._data);
        }
        return retVal;
    }
    public togglExpansion() {
        console.log('togglExpansion: ', this.id, this._data, this._virtualEntitiesById);
        this.howUIService.toggleExpansion(undefined, undefined, this.id);
    }
    
    constructor(
        public entityDataService: SzEntityDataService,
        public configDataService: SzConfigDataService,
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}