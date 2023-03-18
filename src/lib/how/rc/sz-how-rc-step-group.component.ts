import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary, SzResolvedEntity 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzResolutionStepDisplayType, SzResolutionStepGroup, SzResolvedVirtualEntity} from '../../models/data-how';
import { filter, Subject, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowUIService } from '../../services/sz-how-ui.service';

/**
 * Why
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-rc-step-group&gt;&lt;/sz-how-rc-step&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-how-rc-step-group&gt;&lt;/sz-how-rc-step&gt;<br/>
*/
@Component({
    selector: 'sz-how-rc-step-group',
    templateUrl: './sz-how-rc-step-group.component.html',
    styleUrls: ['./sz-how-rc-step-group.component.scss']
})
export class SzHowRCStepGroupComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep};
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean           = false;
    //private _collapsed: boolean             = true;
    private _childrenCollapsed: boolean     = false;
    private _data: SzResolutionStepGroup;
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() set data(value: SzResolutionStepGroup) {
        if(this._data && value !== undefined) {
            //console.log('SzHowRCStepGroupComponent.setData() ', value);
        }
        this._data = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
    }
    
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }

    public get id(): string {
        return this._data && this._data.id ? this._data.id : undefined;
    }

    public get data(): SzResolutionStepGroup {
        return this._data;
    }

    get numberOfCards(): number {
        let retVal = 0;
        if(this._data && this._data.virtualEntityIds && this._data.virtualEntityIds.length) {
            retVal = this._data.virtualEntityIds.length;
        }
        return retVal;
    }

    get isInterimStep(): boolean {
        return (this._data && this._data.interimSteps && this._data.interimSteps.length > 0) ? true : false;
    }
    get isMergeStepGroup(): boolean {
        return (this._data && this._data.mergeStep) ? true : false;
    }

    getCardTitleForStep(title: string, cardIndex: number) {
        return cardIndex === 0 ? title : undefined;
    }

    get interimStepTitle(): string {
        let retVal = 'Interim Entity';
        if(this._data) {
            if(this._data.id) {
                retVal = this._data.id +': '+ retVal;
                // get just the single item matching the id
                if(this._virtualEntitiesById && this._virtualEntitiesById.has(this._data.id)){
                    // add name
                    let _vEnt = this._virtualEntitiesById.get(this._data.id);
                    retVal = _vEnt ? retVal +': ' : retVal;
                    retVal = retVal + (_vEnt.bestName ? _vEnt.bestName : _vEnt.entityName);
                }
            }
        }
        return retVal;
    }

    get title(): string {
        let retVal = 'Steps';
        if(this._data) {
            let _retTypes = new Map<SzResolutionStepDisplayType, number>();
            this._data.resolutionSteps.forEach((step: SzResolutionStep) => {
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
        return retVal;
    }

    getStepTitle(step: SzResolutionStep): string {
        let retVal = '';
        if(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) {
            // both items are records
            retVal = 'Create Virtual Entity';
        } else if(!step.candidateVirtualEntity.singleton && !step.inboundVirtualEntity.singleton) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(!(step.candidateVirtualEntity.singleton && step.inboundVirtualEntity.singleton) && (step.candidateVirtualEntity.singleton === false || step.inboundVirtualEntity.singleton === false)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return retVal;
    }

    isStepDisplayType(step: SzResolutionStep, typeVerb: SzResolutionStepDisplayType): boolean {
        let stepType = SzHowUIService.getResolutionStepCardType(step);
        return stepType === typeVerb;
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