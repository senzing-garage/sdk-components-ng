import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../../models/entity-detail-section-data';
import { SzEntityRecord } from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-section-collapsible-card',
  templateUrl: './sz-entity-detail-section-collapsible-card.component.html',
  styleUrls: ['./sz-entity-detail-section-collapsible-card.component.scss']
})
export class SzEntityDetailSectionCollapsibleCardComponent implements OnInit, AfterViewInit {
  //private static _msgHandler : SzMessageHandler = new SzMessageHandler('entity.collapsible-card');
  //private msgHandler: SzMessageHandler = CollapsibleCardComponent._msgHandler;
  @ViewChild('messages') private messagesContainer: HTMLElement;

  @Input() showIcon = true;
  @Input() headerIcon: string;
  @Input() cardTitle: string;
  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  get expanded(): boolean {
    return this.isOpen;
  }
  //@Input() cardData: any;
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
    this.headerTitleText = !this.isEntityRecord(this.cardData) ? this.cardData.dataSource + (this.recordCount > 0 ? '(' + this.recordCount + ')' : '') : '';
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

  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
    console.log('set new expanded state: ', this.expanded, evt);
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
