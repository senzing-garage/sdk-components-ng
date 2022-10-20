import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { SzSectionDataByDataSource, SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityIdentifier, SzEntityRecord, SzRecordId } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SzDataSourceRecordsSelection, SzWhySelectionMode, SzWhySelectionModeBehavior } from '../../../models/data-source-record-selection';
import { SzMultiSelectButtonComponent } from '../../../shared/multi-select-button/multi-select-button.component';

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
  @Input() public showWhyUtilities: boolean = false;
  @Input() public recordWhyMultiselectActive: boolean = false;
  @Input() public relatedWhyMultiselectActive: boolean = false;

  private _whySelectionMode: SzWhySelectionModeBehavior = SzWhySelectionMode.NONE;
  @Output() onCompareRecordsForWhy = new EventEmitter<SzRecordId[]>();
  @Output() onCompareEntitiesForWhyNot = new EventEmitter<SzEntityIdentifier[]>();

  /** 
   * if "showRecordWhyUtilities" set to true there is a "single-record" select behavior, and a 
   * "multi-select" behavior. possible values are `SINGLE` and `MUTLI`
   */
  public get whySelectionMode(): SzWhySelectionModeBehavior {
    return this._whySelectionMode;
  }
  @Input() set whySelectionMode(value: SzWhySelectionModeBehavior) {
    this._whySelectionMode = value;
  }
  public get isMultiSelect(): boolean {
    return this._whySelectionMode === SzWhySelectionMode.MULTIPLE
  }
  public get isSingleSelect(): boolean {
    return this._whySelectionMode === SzWhySelectionMode.SINGLE
  }
  
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

  @Input() cardData: SzEntityDetailSectionData | SzSectionDataByDataSource;
  isOpen: boolean = false;
  matchPills: { text: string, ambiguous: boolean, plusMinus: string }[];
  headerTitleText: string;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('multiSelectButton') private multiSelectButton: HTMLElement;
  @ViewChild('multiSelectButtonWrapper') private multiSelectButtonWrapper: ElementRef;

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
  /** is responsible for deciding whether or not the 'selected' css class is applied
   * to the "sz-entity-record-card-content" component when it's a record
   */
  public isRecordSelected(value: SzEntityRecord) {
    if(this.isMultiSelect && value.dataSource && value.recordId) {
      let dataSources = Object.keys(this._dataSourceRecordsSelected);
      if(dataSources.indexOf(value.dataSource) > -1) {
        // datasource exists, now check for record
        return this._dataSourceRecordsSelected[value.dataSource].indexOf(value.recordId) > -1 ? true : false;
      }
    }
    return false;
  }

  /** is responsible for deciding whether or not the 'selected' css class is applied
   * to the "sz-entity-record-card-content" component when it's an entity
   */
  public isRelatedEntitySelected(value: SzEntityRecord) {

    /*
    if(this.isMultiSelect && value.dataSource && value.recordId) {
      let dataSources = Object.keys(this._dataSourceRecordsSelected);
      if(dataSources.indexOf(value.dataSource) > -1) {
        // datasource exists, now check for record
        return this._dataSourceRecordsSelected[value.dataSource].indexOf(value.recordId) > -1 ? true : false;
      }
    }
    */
    return false;
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
    if(evt && evt.target) {
      let isFromMultiSelectButton = (this.multiSelectButtonWrapper as ElementRef).nativeElement.contains(evt.target as HTMLElement)
      if(isFromMultiSelectButton) {
        return;
      }
    }
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
    // check for "why" mode
    if(this.showWhyUtilities) {
      if(this.isMultiSelect) {
        retArr.push('select-mode-multiple');
      } else if(this.isSingleSelect) {
        retArr.push('select-mode-single');
      }
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
    //console.log('sz-entity-detail-section-collapsible-card: ', entityId);
    this.entityRecordClick.emit(entityId);
  }
  /** handler is invoked when the "Why" button for a multi-select is clicked */
  public onRecordsWhyButtonClick(event: any) {
    //console.log('SzEntityDetailSectionCollapsibleCardComponent.onRecordsWhyButtonClick() ', event);
    this.onCompareRecordsForWhy.emit([]);
  }
  /** handler is invoked when a "Why Not" button for a multi-select is clicked */
  public onEntityWhyNotButtonClick(event: any) {
    //console.log('SzEntityDetailSectionCollapsibleCardComponent.onEntityWhyNotButtonClick() ', event);
    this.onCompareEntitiesForWhyNot.emit([]);
  }

  /** when using the "MULTI" mode record select, the "click-to-select" behavior can be toggled, 
   * when the icon is clicked to toggle the mode this event is emitted */
  @Output('dataSourceSelectModeChanged') onDataSourceSelectModeChangedEmitter = new EventEmitter<boolean>();
  /** when using the "MULTI" mode record select, the "click-to-select" behavior can be toggled, 
   * when the icon is clicked this handler is invoked */
  public onWhyRecordComparisonModeActiveChange(isActive: boolean) {
    this.onDataSourceSelectModeChangedEmitter.emit(isActive);
  }
  /** are records selectable via a "click" user event */
  public get relatedWhyNotSelectActive() {
    return this.relatedWhyMultiselectActive || this.isSingleSelect;
  };
  
  /** are records selectable via a "click" user event */
  public get recordWhySelectActive() {
    return this.recordWhyMultiselectActive || this.isSingleSelect;
  };
  /** event that is emitted when a data source record is clicked */
  @Output('dataSourceRecordClicked') onDataSourceRecordClickedEmitter = new EventEmitter<SzRecordId>();
  /** event handler that is invoked when a data source record is clicked */
  public onDataSourceRecordClicked(recordIdentifier: SzRecordId | any) {
    //console.log('sz-entity-detail-section-collapsible-card: ', recordIdentifier);
    this.onDataSourceRecordClickedEmitter.emit(recordIdentifier);
  }
  /** event that is emitted when a data source records "Why" button is clicked */
  @Output('dataSourceRecordWhyClicked') onDataSourceRecordWhyClickedEmitter = new EventEmitter<SzRecordId>();
  /** event handler that is invoked when a data source records "Why" button is clicked */
  public onDataSourceRecordWhyClicked(recordIdentifier: SzRecordId | any) {
    //console.log('sz-entity-detail-section-collapsible-card: ', recordIdentifier);
    this.onDataSourceRecordWhyClickedEmitter.emit(recordIdentifier);
  }
  /** event that is emitted when a related entity's "Why Not" button is clicked */
  @Output('entityRecordWhyNotClick') onEntityRecordWhyNotClickedEmitter = new EventEmitter<SzEntityIdentifier>();
  /** event handler that is invoked when a related entity's "Why Not" button is clicked */
  public onEntityRecordWhyNotClicked(entityId: SzEntityIdentifier | any) {
    //console.log('sz-entity-detail-section-collapsible-card.onEntityRecordWhyNotClicked: ', entityId);
    this.onEntityRecordWhyNotClickedEmitter.emit(entityId);
  }

  /** get the user-selected "records" when multi-select "Why" feature is active  */
  public get selectedRecords(): SzRecordId[] {
    let retVal = [];
    let _dataSources = Object.keys(this.dataSourceRecordsSelected);
    _dataSources.forEach((selectedDataSource) => {
      retVal = retVal.concat( 
        this.dataSourceRecordsSelected[selectedDataSource].map((selectedRecordId) => {
          return {src: selectedDataSource, id: selectedRecordId}
        }) 
      )
    })
    return retVal
  }
  /** @internal  */
  private _dataSourceRecordsSelected: SzDataSourceRecordsSelection = {}
  /** get the user-selected "records" when multi-select "Why" feature is active  */
  @Input() set dataSourceRecordsSelected(records: SzDataSourceRecordsSelection) {
    //console.log('SzEntityDetailSectionCollapsibleCardComponent setting "dataSourceRecordsSelected"', records);
    this._dataSourceRecordsSelected = records;
  }
  /** get the user-selected "records" when multi-select "Why" feature is active  */
  get dataSourceRecordsSelected(): SzDataSourceRecordsSelection {
    return this._dataSourceRecordsSelected;
  }

  get hasAmbiguousMatch(): boolean {
    if(this.matchPills && this.matchPills.length) {
      return this.matchPills.some((mPill) => {
        return mPill.ambiguous;
      });
    }
    return false;
  }

  private createPillInfo(data: SzEntityDetailSectionData | SzSectionDataByDataSource): { text: string, ambiguous: boolean, plusMinus: string }[] {
    if(data && ((data as SzEntityDetailSectionData).matchKey)) {
      const pills = (data as SzEntityDetailSectionData).matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .map(item => item.startsWith('+') ? item : `-${item}`)
      .map(item => {
        return { text: item.replace('(Ambiguous)', ''), plusMinus: item.startsWith('+') ? 'plus' : 'minus', ambiguous: (item.indexOf('(Ambiguous)') > -1) };
      });
      return pills;
    }
    return undefined;
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
    return undefined;
  }
}
