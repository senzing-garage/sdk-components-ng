import { Component, OnInit, Input, OnDestroy, HostBinding } from '@angular/core';
import { 
    EntityDataService as SzEntityDataService, 
    SzResolutionStep
} from '@senzing/rest-api-client-ng';
import { SzConfigDataService } from '../services/sz-config-data.service';
import { SzResolutionStepListItemType, SzResolutionStepNode, SzResolvedVirtualEntity } from '../models/data-how';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../services/sz-how-ui.service';

/**
 * Represents a step node in a How Report. Step Nodes wrap Step cards
 * and can have child Step Nodes.
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-how-step-node&gt;&lt;/sz-how-step&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-how-step-node&gt;&lt;/sz-wc-how-step-node&gt;<br/>
*/
@Component({
    selector: 'sz-how-step-node',
    templateUrl: './sz-how-step-node.component.html',
    styleUrls: ['./sz-how-step-node.component.scss']
})
export class SzHowStepNodeComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _data: SzResolutionStepNode | SzResolutionStep;
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _highlighted: boolean = false;
    private _hasChildStacksCached: boolean;
    
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return this.isCollapsed;
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.isExpanded;
    }
    @HostBinding('class.group-collapsed') get cssHiddenGroupClass(): boolean {
        return !this.isGroupExpanded;
    }
    @HostBinding('class.group-expanded') get cssExpandedGroupClass(): boolean {
        return this.isGroupExpanded;
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.is-stack') get cssIsStackClass(): boolean {
        return this.isStack ? true : false;
    }
    @HostBinding('class.is-final') get cssIsFinalClass(): boolean {
        return this.isFinal ? true : false;
    }
    @HostBinding('class.has-child-stacks') get cssHasChildStacksClass(): boolean {
        return this.hasChildStacks ? true : false;
    }
    
    //@Input() featureOrder: string[];

    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStepNode | SzResolutionStep) {
        this._data = value;
    }
    get data() : SzResolutionStepNode | SzResolutionStep {
        return this._data;
    }
    get dataAsNode(): SzResolutionStepNode {
        return this._data as SzResolutionStepNode;
    }
    public get isCollapsed() {
        if((this.isGroup || this.isStack) && this.hasChildren) {
            // check group
            return !this.howUIService.isGroupExpanded(this.id)
        } else {
            // check node
            return !this.howUIService.isStepExpanded(this.id);
        }
    }
    public get isExpanded() {
        if((this.isGroup || this.isStack) && this.hasChildren) {
            // check group
            return this.howUIService.isGroupExpanded(this.id)
        } else {
            // check node
            return this.howUIService.isStepExpanded(this.id);
        }
    }
    public get id(): string {
        return this.isStep ? (this._data as SzResolutionStep).resolvedVirtualEntityId : (this._data as SzResolutionStepNode).id;
    }
    public get isStack() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK)
    }
    public get isGroup() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.GROUP)
    }
    public get isStep() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP) ? true : ((_d as SzResolutionStepNode).itemType === undefined ? true : false);
    }
    public get isFinal() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.FINAL) ? true : ((_d as SzResolutionStepNode).itemType === undefined ? true : false);
    }
    public get isGroupExpanded() {
        return this.howUIService.isGroupExpanded(this.id);
    }
    public get hasChildren(): boolean {
        return (this._data as SzResolutionStepNode).children && (this._data as SzResolutionStepNode).children.length > 0;
    }
    public get hasChildStacks(): boolean {
        let _d = this._data as SzResolutionStepNode;
        if(this._hasChildStacksCached === undefined) {
            if(_d.children && _d.children.length > 0) {
                this._hasChildStacksCached = _d.children.some((childItem) => {
                    return (childItem as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK;
                })
            }
        }
        return this._hasChildStacksCached ? true : false;
    }
    public get children(): Array<SzResolutionStepNode | SzResolutionStep> {
        if(this.hasChildren) {
            return (this._data as SzResolutionStepNode).children;
        }
        return undefined;
    }
    get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
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