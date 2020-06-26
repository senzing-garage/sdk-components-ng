import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import {
  SzEntityData,
  SzResolvedEntity,
  SzEntityRecord
} from '@senzing/rest-api-client-ng';
import { Subject, BehaviorSubject } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { SzPrefsService } from '../../../services/sz-prefs.service';


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
  @Input() public showRecordIdWhenNative: boolean = false;
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
  @Input() public layoutClasses: string[] = [];

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
    return retVal;
  }
  get columnTwoTotal(): number {
    return (this.nameData.concat(this.attributeData).length);
  }
  get showColumnTwo(): boolean {
    const nameAndAttrData = this.getNameAndAttributeData(this.nameData, this.attributeData);
    return this._showNameData && nameAndAttrData.length > 0;
  }
  get columnThreeTotal(): number {
    return (this.addressData.concat(this.phoneData).length);
  }
  get showColumnThree(): boolean {
    const phoneAndAddrData = this.getAddressAndPhoneData(this.addressData, this.phoneData);
    return (phoneAndAddrData && phoneAndAddrData.length > 0);
  }
  get columnFourTotal(): number {
    return this.identifierData.length;
  }
  public get showColumnFour(): boolean {
    return this.identifierData.length > 0;
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
    }
  }

  get attributeData(): string[] {
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
    }
  }

  get addressData(): string[] {
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
    }
  }

  get phoneData(): string[] {
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

  get identifierData(): string[] {
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
    }
  }

  /**
   * @deprecated
   */
  private isEntityRecord(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityRecord {
    if (data) {
      return (<SzEntityRecord>data).relationshipData !== undefined && (<SzEntityRecord>data).relationshipData.length > 0;
    }
  }
  /**
   * @deprecated
   */
  private isEntityDetailData(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityDetailSectionData {
    if (data) {
      return (<SzEntityDetailSectionData>data).matchLevel !== undefined;
    }
  }
}
