import { Component, OnInit, Input, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep, SzVirtualEntity, SzDataSourceRecordSummary 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../../services/sz-config-data.service';
import { SzResolutionStepNode, SzResolvedVirtualEntity } from '../../../models/data-how';
import { Subject} from 'rxjs';
import { SzHowUIService } from '../../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-rc-card-base.component';
import { MatDialog } from '@angular/material/dialog';

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
    styleUrls: ['./sz-how-rc-card-base.component.scss']
})
export class SzHowRCFinalEntityCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy  {

    @HostBinding('class.collapsed') override get cssHiddenClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.expanded') override get cssExpandedClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-collapsed') override get cssGroupCollapsedClass(): boolean {
        return this.id && !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-expanded') override get cssGroupExpandedClass(): boolean {
        return this.id && this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.type-final') override get cssTypeClass(): boolean {
        return true;
    }
    /*
    @Input() featureOrder: string[];
    @Input() set data(value: SzResolutionStep | SzResolutionStepNode) {
        this._data = (value as SzResolutionStepNode);
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
    private get id(): string {
        return this._data && this._data.id ? this._data.id : this._data.resolvedVirtualEntityId ? this._data.resolvedVirtualEntityId : undefined;
    }
    get data() : SzResolutionStepNode {
        return this._data;
    }*/
    /*get stepsByVirtualId(): {[key: string]: SzResolutionStep} {
        return this._stepMap;
    }
    public get isCollapsed() {
        return !this.howUIService.isGroupExpanded(this.id);
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
    }*/
    override get title(): string {
        let retVal = `Final Entity ${this.id}`;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity) {
            retVal = `Final Entity ${this.id}: ${_resolvedEntity.entityName}`;
        }
        return retVal;
    }
    /*public get dataSourcesAsString(): string {
        let retVal = '';
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.recordSummaries && _resolvedEntity.recordSummaries.length > 0) {
            let db_str = _resolvedEntity.recordSummaries.map((rs: SzDataSourceRecordSummary) => {
                return `${rs.dataSource} (${rs.recordCount})`;
            }).join(' | ');
            retVal += `${db_str}`;
        }
        return retVal;
    }*/
    /*public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._data && this._data.resolvedVirtualEntity) {
            retVal = this._data.resolvedVirtualEntity;
        } else if(this._virtualEntitiesById && this._virtualEntitiesById.has(this.id)) {
            retVal = this._virtualEntitiesById.get(this.id);
        } else {
            //console.log(`no virtual entity: ${this._data.virtualEntityId}`, this._virtualEntitiesById, this._data);
        }
        return retVal;
    }*/
    public override toggleExpansion() {
        this.howUIService.toggleExpansion(undefined, this.id, this.data.itemType);
    }
    
    constructor(
        entityDataService: SzEntityDataService,
        configDataService: SzConfigDataService,
        howUIService: SzHowUIService,
        dialog: MatDialog
    ){
        super(
            entityDataService,
            configDataService,
            howUIService,
            dialog
        );
    }
}