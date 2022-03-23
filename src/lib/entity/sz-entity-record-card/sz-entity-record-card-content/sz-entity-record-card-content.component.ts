import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import {
  SzEntityData,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelatedEntity,
  SzRecordId
} from '@senzing/rest-api-client-ng';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzWhySelectionMode, SzWhySelectionModeBehavior } from '../../../models/data-source-record-selection';


/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-record-card-content',
  templateUrl: './sz-entity-record-card-content.component.html',
  styleUrls: ['./sz-entity-record-card-content.component.scss']
})
export class SzEntityRecordCardContentComponent implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  //@Input() entity: ResolvedEntityData | SearchResultEntityData | EntityDetailSectionData | EntityRecord;
  _entity: any;

  private _truncateOtherDataAt: number = -1;
  private _showOtherData: boolean = false;
  private _showNameData: boolean = true;
  private _showBestNameOnly: boolean = false;
  private _ignorePrefOtherDataChanges = false;
  @Input() public whySelectionMode: SzWhySelectionModeBehavior = SzWhySelectionMode.NONE;
  @Input() public showWhyUtilities: boolean = false;
  @Input() public showRecordIdWhenNative: boolean = false;
  /** allows records with empty columns to match up with records with non-empty columns. format is [true,false,true,true,true] */
  @Input() public columnsShown: boolean[] = undefined;
  @Input() public set ignorePrefOtherDataChanges(value: boolean) {
    this._ignorePrefOtherDataChanges = value;
  }
  public get ignorePrefOtherDataChanges() {
    return this._ignorePrefOtherDataChanges;
  }
  @Input() set showOtherData(value: boolean) {
    this._showOtherData = value;
  }
  get showOtherData(): boolean {
    return this._showOtherData;
  }
  @Input() set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
  }
  get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  @Input() set showNameData(value: boolean) {
    this._showNameData = value;
  }
  get showNameData(): boolean {
    return this._showNameData;
  }
  @Input() set showBestNameOnly(value: boolean) {
    this._showBestNameOnly = value;
  }
  get showBestNameOnly(): boolean {
    return this._showBestNameOnly;
  }
  public get isMultiSelect(): boolean {
    return this.whySelectionMode === SzWhySelectionMode.MULTIPLE
  }
  public get isSingleSelect(): boolean {
    return this.whySelectionMode === SzWhySelectionMode.SINGLE
  }
  public get isSelectModeActive(): boolean {
    return this.whySelectionMode !== SzWhySelectionMode.NONE
  }

  @Input() set entity(value) {
    // console.log('set entity: ', value);
    this._entity = value;
  }
  get entity() {
    return this._entity;
  }

  @Input() maxLinesToDisplay = 3;

  @Input() set parentEntity( value ) {
    this._parentEntity = value;
    if(value && value.matchKey) {
      this._matchKeys = this.getMatchKeysAsArray(value);
    }
  } // only used for displaying "linked" icons on field data(primarily on entity details relationships)

  @Input() truncateResults: boolean = true;
  @Input() truncatedTooltip: string = "Show more..";
  // css class bool
  collapsed: boolean = this.truncateResults;

  @ViewChild('columnOne')
  private columnOne: ElementRef;
  @ViewChild('columnTwo')
  private columnTwo: ElementRef;
  @ViewChild('columnThree')
  private columnThree: ElementRef;
  @ViewChild('columnFour')
  private columnFour: ElementRef;

  /** 0 = wide layout. 1 = narrow layout */
  @Input() public layout = 0;
  /** the css classes being applied. layout-wide | layout-medium  | layout-narrow | layout-rail*/
  public _layoutClasses: string[] = [];
  /** setter for _layoutClasses  */
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  /** getter for _layoutClasses  */
  public get layoutClasses() {
    return this._layoutClasses;
  }
  /** subscription breakpoint changes */
  private layoutChange$ = new BehaviorSubject<number>(this.layout);

  _parentEntity: any;
  _matchKeys: string[];

  constructor(private cd: ChangeDetectorRef, public prefs: SzPrefsService) {}

  ngOnInit() {
    setTimeout(() => {
      this.cd.markForCheck();
    });

    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );
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
    //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: `, prefs.truncateOtherDataInRecordsAt, this.truncateOtherDataAt);
    if( prefs.truncateOtherDataInRecordsAt) {
      this._truncateOtherDataAt = prefs.truncateOtherDataInRecordsAt;
    }
    if( !this.ignorePrefOtherDataChanges && typeof prefs.showOtherData == 'boolean') {
      this._showOtherData = prefs.showOtherDataInRecords;
      //console.warn(`SzEntityRecordCardContentComponent.onPrefsChange: value of this.showOtherData(${this.showOtherData}) is "${prefs.showOtherDataInRecords }" `);
    }
    this.showRecordIdWhenNative = prefs.showRecordIdWhenNative;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    return nameData.concat(attributeData);
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    return addressData.concat(phoneData);
  }

  // ----------------- start total getters -------------------

  get columnOneTotal(): number {
    if (this.entity.entityName && this.entity.addressData) {
      return this.entity.addressData.length;
    }
    return 0;
  }
  get showColumnOne(): boolean {
    let retVal = false;
    if(this.entity) {
      if(this.showOtherData && this.entity.otherData && this.entity.otherData.length > 0) {
        retVal = true;
      }
    }
    // check "columnsShown[0]" for override
    if(this.columnsShown && this.columnsShown[0] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnTwoTotal(): number {
    return (this.nameData.concat(this.attributeData).length);
  }
  get showColumnTwo(): boolean {
    const nameAndAttrData = this.getNameAndAttributeData(this.nameData, this.attributeData);
    let retVal = this._showNameData && nameAndAttrData.length > 0;
    // check "columnsShown[1]" for override
    if(this.columnsShown && this.columnsShown[0] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnThreeTotal(): number {
    return (this.addressData.concat(this.phoneData).length);
  }
  get showColumnThree(): boolean {
    const phoneAndAddrData = this.getAddressAndPhoneData(this.addressData, this.phoneData);
    let retVal  = (phoneAndAddrData && phoneAndAddrData.length > 0);
    // check "columnsShown[2]" for override
    if(this.columnsShown && this.columnsShown[2] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnFourTotal(): number {
    return this.identifierData.length;
  }
  public get showColumnFour(): boolean {
    let retVal  = (this.identifierData.length > 0);
    // check "columnsShown[3]" for override
    if(this.columnsShown && this.columnsShown[3] === true) {
      retVal = true;
    }
    return retVal;
  }
  /**
   * static method so we can figure out what columns would be displayed for a record outside 
   * of the context of the component itself. This is used to query for all columns displayed for an  
   * individual record, then fed back in to ALL records via "columnsShown" so that columns 
   * are always aligned properly.
   */
  public static getColumnsThatWouldBeDisplayedForData(entity: SzEntityRecord | SzRelatedEntity): boolean[] {
    let retVal = [false,false,false,false];
    if(entity) {
      // other data
      if(entity.otherData && entity.otherData.length > 0) {
        retVal[0] = true;
      }
      // name and attr data
      let nameAndAttrData = SzEntityRecordCardContentComponent.getNameDataFromEntity(entity).concat(SzEntityRecordCardContentComponent.getAattributeDataFromEntity(entity));
      if(nameAndAttrData.length > 0) {
        retVal[1] = true;
      }
      // address and phone data
      let phoneAndAddrData = SzEntityRecordCardContentComponent.getAddressDataFromEntity(entity).concat(SzEntityRecordCardContentComponent.getPhoneDataFromEntity(entity));
      // addressData.concat(phoneData);
      if(phoneAndAddrData && phoneAndAddrData.length > 0) {
        retVal[2] = true;
      }
      // identifier data
      let identifierData = SzEntityRecordCardContentComponent.getIdentifierDataFromEntity(entity); 
      if(identifierData.length > 0) {
        retVal[3] = true;
      }
    }
    return retVal;
  }
  // -----------------  end total getters  -------------------

  get otherData(): string[] {
    if (this.entity && this.showOtherData) {
      if (this.entity.otherData ) {
        return this.entity.otherData;
      } else if (this.entity && this.entity.nameData) {
        return this.entity.nameData;
      } else if (this.entity && this.entity.nameData) {
        return this.entity.nameData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get nameData(): string[] {
    /*
    if (this.entity) {
      if (this.entity && this.entity.nameData && this.entity.nameData.length > 0 && !this._showBestNameOnly) {
        return this.entity.nameData;
      } else if (this.entity && this.entity.bestName) {
        return [this.entity.bestName];
      } else if (this.entity && this.entity.entityName && !this._showBestNameOnly) {
        return [this.entity.entityName];
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    return SzEntityRecordCardContentComponent.getNameDataFromEntity(this.entity, this._showBestNameOnly);
  }
  public static getNameDataFromEntity(entity, showBestNameOnly?: boolean): string[] {
    if (entity) {
      if (entity && entity.nameData && entity.nameData.length > 0 && !showBestNameOnly) {
        return entity.nameData;
      } else if (entity && entity.bestName) {
        return [entity.bestName];
      } else if (entity && entity.entityName && !showBestNameOnly) {
        return [entity.entityName];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get attributeData(): string[] {
    /*
    if (this.entity) {
      if ( this.entity.characteristicData) {
        return this.entity.characteristicData;
      } else if ( this.entity.attributeData) {
        return this.entity.attributeData;
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    return SzEntityRecordCardContentComponent.getAattributeDataFromEntity(this.entity);
  }

  public static getAattributeDataFromEntity(entity): string[] {
    if (entity) {
      if ( entity.characteristicData) {
        return entity.characteristicData;
      } else if ( entity.attributeData) {
        return entity.attributeData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get addressData(): string[] {
    /*
    if (this.entity) {
      if (this.entity.addressData) {
        return this.entity.addressData;
      } else if (this.entity.addressData) {
        return this.entity.addressData;
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    return SzEntityRecordCardContentComponent.getAddressDataFromEntity(this.entity);
  }

  public static getAddressDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.addressData) {
        return entity.addressData;
      } else if (entity.addressData) {
        return entity.addressData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get phoneData(): string[] {
    /*
    if (this.entity) {
      if (this.entity.phoneData) {
        return this.entity.phoneData;
      } else if (this.entity.phoneData) {
        return this.entity.phoneData;
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    return SzEntityRecordCardContentComponent.getPhoneDataFromEntity(this.entity); 
  }

  public static getPhoneDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.phoneData) {
        return entity.phoneData;
      } else if (entity.phoneData) {
        return entity.phoneData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get identifierData(): string[] {
    /*
    if (this.entity) {
      if (this.entity.identifierData) {
        return this.entity.identifierData;
      } else if (this.entity.identifierData) {
        return this.entity.identifierData;
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    return SzEntityRecordCardContentComponent.getIdentifierDataFromEntity(this.entity); 
  }

  public static getIdentifierDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.identifierData) {
        return entity.identifierData;
      } else if (entity.identifierData) {
        return entity.identifierData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  getMatchKeysAsArray(pEntity: any): string[] {
    let ret = [];

    if(pEntity && pEntity.matchKey) {
      const mkeys = pEntity.matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .filter( val => val.indexOf('+') >= 0 )
      .forEach( val=> {
        val.split('+').forEach( key => {
          if(key !== '+' && key !== '') { ret.push(key); }
        });
      });
      // for address, also add other text keys
      if(ret.indexOf('ADDRESS') >= 0) {
        ret = ret.concat(['BILLING', 'MAILING']);
      }

      return ret;
    }

    return ret;
  }

  get matchKeys(): string[] {
    if(this._matchKeys) {
      return this._matchKeys;
    }
    // no match keys, should we retest?
    return undefined;
  }

  isLinkedAttribute(attrValue: string): boolean {
    const matchArr = this.matchKeys;
    if(attrValue && matchArr && matchArr.length > 0) {

      const keyMatch = matchArr.some( (mkey) => {
        return attrValue.indexOf(mkey+':') >=0 ;
      });

      //console.log(attrValue+ 'MATCHES VALUE IN: ('+keyMatch+')', matchArr);
      return keyMatch;
    } else {
      //console.warn('isLinkedAttribute issue. ', attrValue, matchArr);
    }
    return false;
  }

  /**
   * @deprecated
   */
  private isEntityRecord(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityRecord {
    if (data) {
      return (<SzEntityRecord>data).relationshipData !== undefined && (<SzEntityRecord>data).relationshipData.length > 0;
    }
    return false;
  }
  /**
   * @deprecated
   */
  private isEntityDetailData(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityDetailSectionData {
    if (data) {
      return (<SzEntityDetailSectionData>data).matchLevel !== undefined;
    }
    return false;
  }
  @Output('onDataSourceRecordClicked') 
  onRecordCardContentClickedEmitter: EventEmitter<SzRecordId> = new EventEmitter<SzRecordId>();

  public onRecordCardContentClicked(event: any) {
    console.log('SzEntityRecordCardContentComponent.onRecordCardContentClicked()', this.entity, this);
    
    if(this.entity && this.entity.dataSource && this.entity.recordId) {
      let recordId: SzRecordId = {src: this.entity.dataSource, id: this.entity.recordId};
      this.onRecordCardContentClickedEmitter.emit(recordId);
    } else {
      console.error('SzEntityRecordCardContentComponent.onRecordCardContentClicked() ERROR: datasource or recordId missing');
    }
  }
  @Output('onDataSourceRecordWhyClicked') 
  onRecordCardWhyClickedEmitter: EventEmitter<SzRecordId> = new EventEmitter<SzRecordId>();

  public onRecordCardWhyClicked(event: any) {
    console.log('SzEntityRecordCardContentComponent.onRecordCardWhyClicked()', this.entity, this);
    if(this.entity && this.entity.dataSource && this.entity.recordId) {
      let recordId: SzRecordId = {src: this.entity.dataSource, id: this.entity.recordId};
      this.onRecordCardWhyClickedEmitter.emit(recordId);
    } else {
      console.error('SzEntityRecordCardContentComponent.onRecordCardWhyClicked() ERROR: datasource or recordId missing');
    }
  }
}
