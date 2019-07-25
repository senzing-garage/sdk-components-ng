import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityRecord } from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-header-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class SzEntityDetailHeaderContentComponent implements OnInit {
  //@Input() entity: ResolvedEntityData | SearchResultEntityData | EntityDetailSectionData | EntityRecord;
  @Input() entity: any; // the strong typing is making it impossible to handle all variations
  @Input() maxLinesToDisplay = 3;
  @Input() set parentEntity( value ) {
    console.log('SzEntityDetailHeaderContentComponent.set parentEntity');
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

  _parentEntity: any;
  _matchKeys: string[];

  constructor(private ref: ChangeDetectorRef) {
    console.log('SzEntityDetailHeaderContentComponent.constructor');
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('SzEntityDetailHeaderContentComponent.ngOnInit #1');

      //this.columnOneTotal = this.columnOne ? this.columnOne.nativeElement.children.length : 0;
      //this.columnTwoTotal = this.columnTwo.nativeElement.children.length;
      //this.columnThreeTotal = this.columnThree.nativeElement.children.length;
      //this.columnFourTotal = this.columnFour.nativeElement.children.length;

      this.ref.markForCheck();
      console.log('SzEntityDetailHeaderContentComponent.ngOnInit #2');
    });
  }

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    console.log('SzEntityDetailHeaderContentComponent.getNameAndAttributeData #1');
    return nameData.concat(attributeData);
    console.log('SzEntityDetailHeaderContentComponent.getNameAndAttributeData #2');
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    console.log('SzEntityDetailHeaderContentComponent.getAddressAndPhoneData #1');
    return addressData.concat(phoneData);
    console.log('SzEntityDetailHeaderContentComponent.getAddressAndPhoneData #2');
  }

  // ----------------- start total getters -------------------
  get columnOneTotal(): number {
    console.log('SzEntityDetailHeaderContentComponent.get columnOneTotal');
    if (this.entity && this.entity.otherData) {
      return this.entity.otherData.length;
    }
    return 0;
  }
  get showColumnOne(): boolean {
    console.log('SzEntityDetailHeaderContentComponent.get showColumnOne');
    return (this.entity && this.entity.otherData && this.entity.otherData.length > 0);
  }
  get columnTwoTotal(): number {
    console.log('SzEntityDetailHeaderContentComponent.get columnTwoTotal');
    return (this.nameData.concat(this.attributeData).length);
  }
  get columnThreeTotal(): number {
    console.log('SzEntityDetailHeaderContentComponent.get columnThreeTotal');
    return (this.addressData.concat(this.phoneData).length);
  }
  get columnFourTotal(): number {
    console.log('SzEntityDetailHeaderContentComponent.get columnFourTotal');
    return this.identifierData.length;
  }
  public get showColumnFour(): boolean {
    console.log('SzEntityDetailHeaderContentComponent.get showColumnFour');
    return this.identifierData.length > 0;
  }
  // -----------------  end total getters  -------------------

  get nameData(): string[] {
    console.log('SzEntityDetailHeaderContentComponent.get nameData');

    if (this.entity) {
      if (this.entity && this.entity.nameData) {
        return this.entity.nameData;
      } else if (this.entity && this.entity.topNames) {
        return this.entity.topNames;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get attributeData(): string[] {
    console.log('SzEntityDetailHeaderContentComponent.get attributeData');

    if (this.entity) {
      if ( this.entity.attributeData) {
        return this.entity.attributeData;
      } else if ( this.entity.topAttributes) {
        return this.entity.topAttributes;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get addressData(): string[] {
    console.log('SzEntityDetailHeaderContentComponent.get addressData');

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
    console.log('SzEntityDetailHeaderContentComponent.get phoneData');

    if (this.entity) {
      if (this.entity.phoneData) {
        return this.entity.phoneData;
      } else if (this.entity.topPhoneNumbers) {
        return this.entity.topPhoneNumbers;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  getMatchKeysAsArray(pEntity: any): string[] {
    console.log('SzEntityDetailHeaderContentComponent.getMatchKeysAsArray');

    let ret = [];
    try{
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

  }catch(err){
    console.log('SzEntityDetailHeaderContentComponent.getMatchKeysAsArray:error', err);
  }

    return ret;
  }

  get matchKeys(): string[] {
    console.log('SzEntityDetailHeaderContentComponent.get matchKeys');
    if(this._matchKeys) {
      return this._matchKeys;
    }
    // no match keys, should we retest?
    return []
  }

  isLinkedAttribute(attrValue: string): boolean {
    console.log('SzEntityDetailHeaderContentComponent.isLinkedAttribute');

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
    console.log('SzEntityDetailHeaderContentComponent.identifierData #1');
    try{
    if (this.entity) {
      console.log('SzEntityDetailHeaderContentComponent.identifierData #2');

      if (this.entity.identifierData) {
        console.log('SzEntityDetailHeaderContentComponent.identifierData #3');

        return this.entity.identifierData;
      } else if (this.entity.topIdentifiers) {
        console.log('SzEntityDetailHeaderContentComponent.identifierData #4');

        return this.entity.topIdentifiers;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }catch(err){
    console.log('\tSzEntityDetailHeaderContentComponent.identifierData error', err);

  }
    console.log('SzEntityDetailHeaderContentComponent.identifierData #5');
    return [];
  }

  /**
   * @deprecated
   */
  private isEntityRecord(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityRecord {
    console.log('SzEntityDetailHeaderContentComponent.isEntityRecord');

    if (data) {
      return (<SzEntityRecord>data).relationshipData !== undefined && (<SzEntityRecord>data).relationshipData.length > 0;
    }
  }
  /**
   * @deprecated
   */
  private isEntityDetailData(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityDetailSectionData {
    console.log('SzEntityDetailHeaderContentComponent.isEntityDetailData');

    if (data) {
      return (<SzEntityDetailSectionData>data).matchLevel !== undefined;
    }
  }
}
