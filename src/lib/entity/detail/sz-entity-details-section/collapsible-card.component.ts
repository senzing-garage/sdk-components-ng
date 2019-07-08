import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityRecord } from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-section-collapsible-card',
  templateUrl: './collapsible-card.component.html',
  styleUrls: ['./collapsible-card.component.scss']
})
export class SzEntityDetailSectionCollapsibleCardComponent implements OnInit, AfterViewInit {
  @ViewChild('messages') private messagesContainer: HTMLElement;

  @Input() showIcon = true;
  @Input() headerIcon: string;
  @Input() cardTitle: string;
  /**
   * set the expanded state of the component
   */
  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  /**
   * get the expanded state of the component
   */
  get expanded(): boolean {
    return this.isOpen;
  }
  @Input() displayType: string = 'entity';
  @Input() truncateResults: boolean = true;

  @Input() cardData: SzEntityDetailSectionData;
  isOpen: boolean = false;
  matchPills: { text: string, ambiguous: boolean, plusMinus: string }[];
  headerTitleText: string;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  constructor() {
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
  }

  ngAfterViewInit() {
    //this.msgHandler.processMessages(this.messagesContainer);
  }
  /*
  public get msg() : SzMessageHandlerView {
    return this.msgHandler.view;
  }*/

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
    console.log('set new expanded state: ', this.expanded, evt);
  }

  /**
   * get the css classes for the component.
   * used by the template.
   * @readonly
   */
  public get cssClasses(): string {
    const retArr = ['sz-entity-detail-section-collapsible-card-content'];
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
