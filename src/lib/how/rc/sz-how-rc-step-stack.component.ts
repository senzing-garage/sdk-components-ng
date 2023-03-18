import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    EntityDataService as SzEntityDataService, 
    SzAttributeSearchResult, SzDetailLevel, SzEntityData, SzEntityFeature, SzEntityIdentifier, SzFeatureMode, SzFeatureScore, SzFocusRecordId, SzHowEntityResponse, SzHowEntityResult, SzMatchedRecord, SzRecordId, SzResolutionStep, SzVirtualEntity, SzVirtualEntityData, SzWhyEntityResponse, SzWhyEntityResult, SzConfigResponse, SzVirtualEntityRecord, SzDataSourceRecordSummary, SzResolvedEntity 
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../../services/sz-config-data.service';
import { SzResolutionStepDisplayType, SzResolutionStepGroup, SzResolvedVirtualEntity} from '../../models/data-how';
import { Subject, takeUntil } from 'rxjs';
import { parseSzIdentifier } from '../../common/utils';
import { SzHowUIService } from '../../services/sz-how-ui.service';

/**
 * How Step Stack (multiple steps represented as a collapsible group)
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-rc-step-stack&gt;&lt;/sz-how-rc-step-stack&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-how-rc-step-stack&gt;&lt;/sz-how-rc-step-stack&gt;<br/>
*/
@Component({
    selector: 'sz-how-rc-step-stack',
    templateUrl: './sz-how-rc-step-stack.component.html',
    styleUrls: ['./sz-how-rc-step-stack.component.scss']
})
export class SzHowRCStepStackComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _stepMap: {[key: string]: SzResolutionStep};
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean           = false;
    private _collapsed: boolean             = true;
    private _childrenCollapsed: boolean     = false;
    private _data: SzResolutionStepGroup;
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return this._collapsed ? true : false;
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this._collapsed ? false : true;
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @Input() featureOrder: string[];

    @Input() set stepsByVirtualId(value: {[key: string]: SzResolutionStep}) {
        this._stepMap = value;
    }
    @Input() set data(value: SzResolutionStepGroup) {
        this._data = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    /*
    @Input() set expanded(value: boolean) {
        this._collapsed = !value;
    }*/

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

    getCardTitleForStep(title: string, cardIndex: number) {
        return cardIndex === 0 ? title : undefined;
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

    ngOnInit() {
        this.howUIService.onGroupExpansionChange.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe(this.onGroupExpansionChange.bind(this));
    }

    onGroupExpansionChange(gId: string) {
        console.log(`onGroupExpansionChange: ${gId}`, this);
        this._collapsed = !this.howUIService.isExpanded(gId);
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}