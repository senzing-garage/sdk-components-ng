import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-card-base.component';
import { MatDialog } from '@angular/material/dialog';

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
    override get title(): string {
        let retVal = `Final Entity ${this.id}`;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity) {
            retVal = `Final Entity ${this.id}: ${_resolvedEntity.entityName}`;
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