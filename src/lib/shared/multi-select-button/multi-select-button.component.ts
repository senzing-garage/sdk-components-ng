import { TemplateLiteral } from '@angular/compiler';
import { Component, OnInit, Input, OnDestroy, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * A button component with a "selected" count and action emitters and methods.
 * used for selecting multiple search results for comparison.
 * used for selected multiple records on the entity detail for comparison.
 */
@Component({
  selector: 'sz-button-multi-select',
  templateUrl: './multi-select-button.component.html',
  styleUrls: ['./multi-select-button.component.scss']
})
export class SzMultiSelectButtonComponent implements OnInit, OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    @Input() public isSelectActive: boolean = false;
    public onIconClick(event: any) {
        this.isSelectActive = !this.isSelectActive;
        this.onSelectActiveChange.emit(this.isSelectActive);
    }
    @Input() public selectedCount: number = 0;
    //public toolTipText: string  = "selected"
    public ariaIconTooltipText: string = "Select for Why comparison"
    @Input() public text: string = "Select"

    @Input() selectedItemTypeSingular   = "item";
    @Input() selectedItemTypePlural     = "items";
    @Input() selectedActionVerb         = "comparison";
    @Input() selectedActionVerbCTA      = "comparison";

    private _selectItemsTooltipTemplate = `${this.selectedCount} ${(this.selectedCount > 1 ? this.selectedItemTypePlural : this.selectedItemTypeSingular)} selected.`;
    @Input() set selectItemsTooltipTemplate(value: any) {
        this._selectItemsTooltipTemplate = value;
    }
    @Input('mat-icon') maticon = 'compare';
    @Input('minimumSelected') minimumSelected = 2;

    @Output() onSelectActiveChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onSelectedClick: EventEmitter<any> = new EventEmitter<any>();

    public get tooltipText(): string {
        let minumumDelta            = (this.minimumSelected - this.selectedCount);
        let itemTypeRemainingText   = minumumDelta <= 1 ? this.selectedItemTypeSingular : this.selectedItemTypePlural;
        let itemTypeText            = this.selectedCount <= 1 ? this.selectedItemTypeSingular : this.selectedItemTypePlural;
        if(!this.isSelectActive){
            // this button has a mode lock, let user know they have to engage first
            return `Click to toggle ${this.selectedItemTypePlural} select mode for ${this.selectedActionVerb}`;
        } else if(this.selectedCount && this.selectedCount >= this.minimumSelected) {
            return `${this.selectedCount} ${itemTypeText} selected. Click to ${this.selectedActionVerbCTA}`;
        } else if(this.selectedCount && this.selectedCount == 1) {
            let retVal = `${this.selectedCount} ${itemTypeText} selected.`;
            if(this.selectedCount < this.minimumSelected && (this.minimumSelected - this.selectedCount) <= 1) {
                retVal  +=  ` Another must be selected for ${this.selectedActionVerb}.`;
            } else {
                retVal  +=  ` Another ${minumumDelta} ${itemTypeRemainingText} must be selected for ${this.selectedActionVerb}.`;
            }
            return retVal;
        } else {
            return `no ${this.selectedItemTypePlural} selected. click each ${this.selectedItemTypeSingular} to select for ${this.selectedActionVerb}.`;
        }
        return this._selectItemsTooltipTemplate;
    }

    constructor() {}
    ngOnInit() {}
    ngAfterViewInit() {}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    public onActionClick(event: any) {
        this.onSelectedClick.emit(event);
    }
}
