import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzResolutionStepDisplayType, SzResolutionStepNode, } from '../../models/data-how';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-card-base.component';
import { SzPrefsService } from '../../services/sz-prefs.service';

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
    selector: 'sz-how-step-card',
    templateUrl: './sz-how-step-card.component.html',
    styleUrls: ['./sz-how-card-base.component.scss']
})
export class SzHowStepCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy {
    /** the title if the cards itemType is a 'GROUP' or 'STACK' */
    override get groupTitle(): string {
        let retVal;
        if(this.hasChildren) {
            if(this.isInterimStep) {
                let _data = (this._data as SzResolutionStepNode);
                retVal = 'Interim Entity';
                if(_data) {
                    if(_data.id) {
                        retVal = _data.id +': '+ retVal;
                        // get just the single item matching the id
                        if(this._virtualEntitiesById && this._virtualEntitiesById.has(_data.id)){
                            // add name
                            let _vEnt = this._virtualEntitiesById.get(_data.id);
                            retVal = _vEnt ? retVal +': ' : retVal;
                            retVal = retVal + (_vEnt.bestName ? _vEnt.bestName : _vEnt.entityName);
                        }
                    }
                }
            }
        } else if(this.isStackGroupMember) {
            if(this._groupIndex > 0){
                retVal = '';
            } else {
                retVal = 'Stack group member';
                if(this._siblings) {
                    let _retTypes = new Map<SzResolutionStepDisplayType, number>();
                    // get this type
                    _retTypes.set(SzHowUIService.getResolutionStepCardType(this._data), 1);
                    // get sibling types
                    this._siblings.forEach((step: SzResolutionStep) => {
                        let _retType = SzHowUIService.getResolutionStepCardType(step);
                        if(_retTypes.has(_retType)){
                            _retTypes.set(_retType, (_retTypes.get(_retType) + 1));
                        } else {
                            _retTypes.set(_retType, 1);
                        }
                    });
                    if(_retTypes.size > 0) {
                        retVal = '';
                        //console.log('_retTypes: ', _retTypes);
        
                        _retTypes.forEach((typeCount, retType) => {
                            //console.log(`\t\t${retType}`, typeCount);
                            if(retType === SzResolutionStepDisplayType.ADD) {
                                retVal += `${typeCount} x Add Record to Virtual Entity\n\r`;
                            }
                        });
                    }
                }
            }
        }
        return retVal;
    }
    /** the title if a card's itemType is 'STEP' */
    override get title(): string {
        let retVal = '';
        let displayType: SzResolutionStepDisplayType = this.getStepListItemCardType(this._data);

        if(displayType === SzResolutionStepDisplayType.INTERIM) {
            let _resolvedEntity = this.resolvedVirtualEntity;
            if(_resolvedEntity) {
                retVal = `${_resolvedEntity.virtualEntityId}: Interim Entity: ${_resolvedEntity.entityName}`;
            }
        } else if(displayType === SzResolutionStepDisplayType.CREATE) {
            // both items are virtual entities
            let _resolvedEntity = this.resolvedVirtualEntity;
            retVal = 'Create Virtual Entity'+ (_resolvedEntity && _resolvedEntity.virtualEntityId ? ' '+_resolvedEntity.virtualEntityId : '');
        } else if(displayType === SzResolutionStepDisplayType.MERGE) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(displayType === SzResolutionStepDisplayType.ADD) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return (displayType !== SzResolutionStepDisplayType.INTERIM) ? `Step ${this._data.stepNumber}: ${retVal}` : retVal;
    }
    /** the description of a step with match keys and principle etc */
    override get description(): string[] {
        let retVal = [];
        //let displayType: SzResolutionStepDisplayType = this.getStepListItemCardType(this._data);
        //let _resolvedEntity = this.resolvedVirtualEntity;

        if(this._data) {
            let eType = this.isInterimStep && this.hasChildren ? 'Interim Entity' : 'Virtual Entity';
            retVal.push(`Forms <span class="emphasized">${eType} <span class="nw">${this._data.resolvedVirtualEntityId}</span></span>`);
            if(this._data.matchInfo && this._data.matchInfo.matchKey) {
                let _mkTokens = this.getMatchKeyAsObjects(this._data.matchInfo.matchKey);
                //console.log(`${this._data.matchInfo.matchKey} as objects: `,_mkTokens);
                let _desc = `On `;
                _mkTokens.forEach((value: boolean, token: string) => {
                    _desc += `<div class="emphasized ilb">${value ? '+' : '-'}${token}</div>`;
                });
                retVal.push(_desc);
            }
            if(this._data.matchInfo && this._data.matchInfo.resolutionRule && this.showResolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.matchInfo.resolutionRule}</span>`);
            }
        }
        return retVal;
    }
    public isStackGroupMemberDbg() {
        let retVal = this.isStackGroupMemberDebug;
        console.log(`isStackGroupMemberDbg(): `, retVal);
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