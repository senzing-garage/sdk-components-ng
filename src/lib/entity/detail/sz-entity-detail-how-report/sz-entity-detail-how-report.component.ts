import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ElementRef, HostBinding } from '@angular/core';
import { SzSectionDataByDataSource, SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityIdentifier, SzEntityRecord, SzHowEntityResult, SzRecordId } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SzDataSourceRecordsSelection, SzWhySelectionMode, SzWhySelectionModeBehavior } from '../../../models/data-source-record-selection';
import { SzMultiSelectButtonComponent } from '../../../shared/multi-select-button/multi-select-button.component';
import { SzHowUIService } from '../../../services/sz-how-ui.service';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-detail-section-how-report',
    templateUrl: './sz-entity-detail-how-report.component.html',
    styleUrls: ['./sz-entity-detail-how-report.component.scss'],
    standalone: false
})
export class SzEntityDetailHowReportComponent implements OnDestroy, OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input() showIcon = true;
  @Input() headerIcon: string;
  @Input() cardTitle: string;
  @Input() public entityId: SzEntityIdentifier;
  @Input() public layoutClasses: string[] = [];
  /** the width to switch from wide to narrow layout */
  @Input() public layoutBreakpoints = [
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 700, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 699 }
  ]
  @Input() public forceLayout: boolean = false;
  isOpen: boolean = false;

  @HostBinding('class.open') get cssClssOpen() { return this.expanded; }
  @HostBinding('class.closed') get cssClssClosed() { return !this.expanded; }

  /** emits an event when the collapsed state of the card changes */
  @Output()
  public onCollapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() public collapsedStatePrefsKey: string;

  /**
   * set the expanded state of the component
   */
  @Input()
  set expanded(value) {
    this.isOpen = value;
    // publish event change emitter
    this.onCollapsedChange.emit(!this.isOpen);
  }
  /**
   * get the expanded state of the component
   */
  get expanded(): boolean {
    return this.isOpen;
  }

  /** get header title */
  get title() {
    return 'How Report';
  }
  private _stepCount = 0;
  get count() {
    return this._stepCount;
  }

  public get howContentIsReasonable(): boolean {
    return (this.count < 10) ?  true : false;
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );

    if(this.entityId){

        /*SzHowUIService.getHowDataForEntity(this.entityId).pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe((result) => {
            console.log(`@senzing/sdk-components-ng/sz-entity-detail-section-how-report`, result);
        });*/
    }
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    if( typeof prefs[ this.collapsedStatePrefsKey ] == 'boolean') {
      this.isOpen = !(prefs[ this.collapsedStatePrefsKey ]);
      //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: value of this.collapsedStatePrefsKey(${this.collapsedStatePrefsKey}) is "${prefs[ this.collapsedStatePrefsKey ]}" `, `isOpen set to ${ !(prefs[ this.collapsedStatePrefsKey ])}`, prefs[ this.collapsedStatePrefsKey ]);
    }
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  onExpand() {
    this.isOpen = true;
  }

  onCollapse() {
    this.isOpen = false;
  }

  onDataChange(howData: SzHowEntityResult) {
    console.log(`@senzing/sdk-components-ng/sz-entity-detail-section-how-report/onDataChange: `, howData);
    if(howData && howData.resolutionSteps && Object.keys(howData.resolutionSteps).length) {
        this._stepCount = Object.keys(howData.resolutionSteps).length;
    }
  }

  /**
   * toggle the collapse/expand state
   */
  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
  }

  /**
   * get the css classes for the component.
   * used by the template.
   * @readonly
   */
  public get cssClasses(): string {
    let retArr = ['sz-entity-detail-section-collapsible-card-content'];
    if( this.expanded ) {
      retArr.push('open');
    } else {
      retArr.push('closed');
    }
    // check for layout classes, concat if exists
    if(this.layoutClasses && this.layoutClasses.length > 0){
      retArr = retArr.concat(this.layoutClasses);
    }
    const retStr = retArr.join(' ');
    return retArr.join(' ');
  }

}
