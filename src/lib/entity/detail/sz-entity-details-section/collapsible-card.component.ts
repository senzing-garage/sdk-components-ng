import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityRecord } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-section-collapsible-card',
  templateUrl: './collapsible-card.component.html',
  styleUrls: ['./collapsible-card.component.scss']
})
export class SzEntityDetailSectionCollapsibleCardComponent implements OnInit, OnDestroy {
  @ViewChild('messages') private messagesContainer: HTMLElement;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input() showIcon = true;
  @Input() headerIcon: string;
  @Input() cardTitle: string;
  @Input() public layoutClasses: string[] = [];

  @Input() public showNameDataInEntities: boolean = true;
  @Input() public showBestNameOnlyinEntities: boolean = false;
  @Input() public showOtherDataInDatasourceRecords: boolean = true;
  @Input() public showOtherDataInEntities: boolean = false;
  @Input() public columnsShown: boolean[] = undefined;
  
  public truncateOtherDataInRecordsAt: number = -1; // < 0 is unlimited

  /**
   * set the expanded state of the component
   */
  @Input()
  set expanded(value) {
    this.isOpen = value;
    // publish event change emmitter
    this.onCollapsedChange.emit(!this.isOpen);
  }
  /**
   * get the expanded state of the component
   */
  get expanded(): boolean {
    return this.isOpen;
  }

  /** emits an event when the collapsed state of the card changes */
  @Output()
  public onCollapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() public collapsedStatePrefsKey: string;

  @Input() displayType: string = 'entity';
  @Input() truncateResults: boolean = true;

  @Input() cardData: SzEntityDetailSectionData;
  isOpen: boolean = false;
  matchPills: { text: string, ambiguous: boolean, plusMinus: string }[];
  headerTitleText: string;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get recordCount() {
    return (this.cardData && this.cardData.records) ? this.cardData.records.length : 0;
  }

  ngOnInit() {
    //console.log('CARD DATA: ', this.cardData);
    this.matchPills = this.createPillInfo(this.cardData);
    //console.log('MATCH PILLS! ', this.matchPills);
    //this.matchPills = this.createMatchPillInfo(this.cardData.records);
    this.headerTitleText = !this.isEntityRecord(this.cardData) && this.cardData && this.cardData.dataSource ? this.cardData.dataSource + (this.recordCount > 0 ? '(' + this.recordCount + ')' : '') : '';

    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    if( typeof prefs[ this.collapsedStatePrefsKey ] == 'boolean') {
      this.isOpen = !(prefs[ this.collapsedStatePrefsKey ]);
      //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: value of this.collapsedStatePrefsKey(${this.collapsedStatePrefsKey}) is "${prefs[ this.collapsedStatePrefsKey ]}" `, `isOpen set to ${ !(prefs[ this.collapsedStatePrefsKey ])}`, prefs[ this.collapsedStatePrefsKey ]);
    }
    if( typeof prefs.showOtherDataInDatasourceRecords == 'boolean') {
      this.showOtherDataInDatasourceRecords = prefs.showOtherDataInDatasourceRecords;
      this.truncateOtherDataInRecordsAt = prefs.truncateOtherDataInRecordsAt
      //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: value of this.collapsedStatePrefsKey(${this.collapsedStatePrefsKey}) is "${prefs[ this.collapsedStatePrefsKey ]}" `, `isOpen set to ${ !(prefs[ this.collapsedStatePrefsKey ])}`, prefs[ this.collapsedStatePrefsKey ]);
    }
    if( typeof prefs.showOtherDataInEntities == 'boolean') {
      //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: value of showOtherDataInEntities(${this.showOtherDataInEntities}) is "${prefs.showOtherDataInEntities}" `);
      this.showOtherDataInEntities = prefs.showOtherDataInEntities;
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
    // match pill obj shape
    // { text: string, ambiguous: boolean, plusMinus: string }
    if(this.matchPills && this.matchPills.forEach) {
      this.matchPills.forEach(( m ) => {
        let k = m.text;
        if(k.indexOf && k.indexOf('+') <= 0) {
          k = k.substr(1);
        }
        if(k.replace) { k = k.replace('+', '_'); }
        if(k.toLowerCase) { k = k.toLowerCase(); }
        retArr.push( 'key-'+ k );
      });
    }
    // check for layout classes, concat if exists
    if(this.layoutClasses && this.layoutClasses.length > 0){
      retArr = retArr.concat(this.layoutClasses);
    }
    const retStr = retArr.join(' ');
    return retArr.join(' ');
  }

  isEntityRecord(data: SzEntityDetailSectionData | SzEntityRecord): data is SzEntityRecord {
    return (this.displayType === 'entity');
    //return (<EntityRecord>data).relationshipData !== undefined;
  }

  public onEntityRecordClick(entityId: number): void {
    console.log('sz-entity-detail-section-collapsible-card: ', entityId);
    this.entityRecordClick.emit(entityId);
  }

  get hasAmbiguousMatch(): boolean {
    if(this.matchPills && this.matchPills.length) {
      return this.matchPills.some((mPill) => {
        return mPill.ambiguous;
      });
    }
    return false;
  }

  private createPillInfo(data: SzEntityDetailSectionData): { text: string, ambiguous: boolean, plusMinus: string }[] {
    if(data && data.matchKey) {
      const pills = data.matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .map(item => item.startsWith('+') ? item : `-${item}`)
      .map(item => {
        return { text: item.replace('(Ambiguous)', ''), plusMinus: item.startsWith('+') ? 'plus' : 'minus', ambiguous: (item.indexOf('(Ambiguous)') > -1) };
      });
      return pills;
    }
  }

  private createMatchPillInfo(data: any): { text: string, plusMinus: string }[] {
    if (data && data.matchKey) {
        let pills;
        try {
          pills = data.matchKey
          .split(/[-](?=\w)/)
          .filter(i => !!i)
          .map(item => item.startsWith('+') ? item : `-${item}`)
          .map(item => {
            return { text: item, plusMinus: item.startsWith('+') ? 'plus' : 'minus' };
          });
        } catch(err) {
          console.log('what the? ', data);
        }
        if(pills) { return pills; }
    }
  }
}
