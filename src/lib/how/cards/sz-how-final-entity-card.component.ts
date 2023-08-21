import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-card-base.component';
import { MatDialog } from '@angular/material/dialog';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzResolutionStepListItemType } from '../../models/data-how';

/**
 * @internal
 * How Final Entity Card
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-final-entity-card [data]="szVirtualEntityInstance"></sz-how-final-entity-card>
 *
*/
@Component({
    selector: 'sz-how-final-entity-card',
    templateUrl: './sz-how-final-entity-card.component.html',
    styleUrls: ['./sz-how-card-base.component.scss']
})
export class SzHowFinalEntityCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy  {

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
    @HostBinding('class.unresolved') override get cssUnResolvedClass(): boolean {
        return this.isUnResolved;
    }
    public get isUnResolved(): boolean {
        return this._data && this._data.itemType === SzResolutionStepListItemType.FINAL && (this._data.singleton || !this._data.resolvedVirtualEntityId) ? true : false;
    }
    override get title(): string {
        let _isUnResolved = this.isUnResolved;
        let retVal = _isUnResolved ? `Un-Resolved Records ${this.id}` : `Final Entity ${this.id}`;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(!_isUnResolved && _resolvedEntity) {
            retVal += `: ${_resolvedEntity.entityName}`;
        }
        return retVal;
    }
    
    public override toggleExpansion() {
        this.howUIService.toggleExpansion(undefined, this.id, this.data.itemType);
    }
    
    constructor(
        entityDataService: SzEntityDataService,
        configDataService: SzConfigDataService,
        howUIService: SzHowUIService,
        dialog: MatDialog,
        prefs: SzPrefsService
    ){
        super(
            entityDataService,
            configDataService,
            howUIService,
            dialog,
            prefs
        );
    }
}