import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzFeatureScore, SzResolutionStep, SzVirtualEntity, SzVirtualEntityRecord, SzDataSourceRecordSummary, SzResponseWithRawData 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../../services/sz-config-data.service';
import { SzHowFinalCardData, SzResolutionStepListItemType, SzResolutionStepDisplayType, SzResolutionStepNode, SzResolvedVirtualEntity, SzVirtualEntityRecordsClickEvent } from '../../../models/data-how';
import {  Subject } from 'rxjs';
import { parseSzIdentifier } from '../../../common/utils';
//import { SzHowResolutionUIStep, SzHowStepUIStateChangeEvent, SzHowUICoordinatorService } from '../../../services/sz-how-ui-coordinator.service';
import { SzHowUIService } from '../../../services/sz-how-ui.service';
import { SzHowRCVirtualEntityDialog } from '../sz-how-rc-virtual-entity-dialog.component';
import { SzHowStepCardBase } from './sz-how-rc-card-base.component';

/**
 * Why
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-rc-step-card [data]="data" [featureOrder]="featureOrder" [virtualEntitiesById]="virtualEntitiesById"&gt;&lt;/sz-how-rc-step-card&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-how-rc-step-card data="data" featureOrder="featureOrder" virtualEntitiesById="virtualEntitiesById"&gt;&lt;/sz-wc-how-rc-step-card&gt;<br/>
*/
@Component({
    selector: 'sz-how-rc-step-card',
    templateUrl: './sz-how-rc-step-card.component.html',
    styleUrls: ['./sz-how-rc-card-base.component.scss']
})
export class SzHowRCStepCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy {
    
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
            if(this._data.matchInfo && this._data.matchInfo.resolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.matchInfo.resolutionRule}</span>`);
            }
        }
        return retVal;
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