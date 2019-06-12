import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';

import { SzRelatedEntity, SzEntityRecord } from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-search-result-card-content',
  templateUrl: './sz-search-result-card-content.component.html',
  styleUrls: ['./sz-search-result-card-content.component.scss']
})
export class SzSearchResultCardContentComponent implements OnInit {
  @Input() public entity: SzEntityDetailSectionData;
  @Input() public maxLinesToDisplay = 3;
  @Input() public showAllInfo: boolean;

  @ViewChild('columnOne')
  private columnOne: ElementRef;
  @ViewChild('columnTwo')
  private columnTwo: ElementRef;
  @ViewChild('columnThree')
  private columnThree: ElementRef;
  @ViewChild('columnFour')
  private columnFour: ElementRef;
  @ViewChild('columnFive')
  private columnFive: ElementRef;

  // collapse and expand state
  collapsed: boolean = true;

  // @deprecated
  //columnOneTotal: number;
  //columnTwoTotal: number;
  //columnThreeTotal: number;
  //columnFourTotal: number;
  //columnFiveTotal: number;

  constructor(private ref: ChangeDetectorRef) {
  }

  ngOnInit() {
    setTimeout(() => {
      // @deprecated
      //this.columnOneTotal = this.columnOne ? this.columnOne.nativeElement.children.length : 0;
      //this.columnTwoTotal = this.columnTwo.nativeElement.children.length;
      //this.columnThreeTotal = this.columnThree.nativeElement.children.length;
      //this.columnFourTotal = this.columnFour.nativeElement.children.length;
      //this.columnFiveTotal = this.columnFive.nativeElement.children.length;

      this.ref.markForCheck();
    });
  }

  // ----------------- start total getters -------------------
  get columnTwoTotal(): number {
    const totalData = this.getNameAndAttributeData(this.nameData, this.attributeData);
    return totalData && totalData.length ? totalData.length : 0;
  }
  get showColumnTwo(): boolean {
    return (this.columnTwoTotal > 0);
  }
  get columnThreeTotal(): number {
    const totalData = this.getAddressAndPhoneData(this.addressData, this.phoneData);
    return totalData && totalData.length ? totalData.length : 0;
  }
  get showColumnThree(): boolean {
    return (this.columnThreeTotal > 0);
  }
  get columnFourTotal(): number {
    return this.identifierData ? this.identifierData.length : 0;
  }
  public get showColumnFour(): boolean {
    return this.identifierData ? this.identifierData.length > 0 : false;
  }
  get columnFiveTotal(): number {
    return this.otherData ? this.otherData.length : 0;
  }
  get showColumnFive(): boolean {
    return (this.columnFiveTotal > 0);
  }
  // -----------------  end total getters  -------------------

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    if(nameData && nameData.concat && attributeData) {
      return nameData.concat(attributeData);
    } else if(nameData) {
      return nameData;
    } else if(attributeData) {
      return attributeData;
    }
    return [];
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    if(addressData && addressData.concat && phoneData) {
      return addressData.concat(phoneData);
    } else if(addressData) {
      return addressData;
    } else if(phoneData) {
      return phoneData;
    }
    return [];

    return addressData.concat(phoneData);
  }

  get nameData(): string[] | undefined {
        return this.entity && this.entity.nameData ? this.entity.nameData : undefined;
  }

  get attributeData(): string[] | undefined {
        return this.entity && this.entity.attributeData ? this.entity.attributeData : undefined;
  }

  get addressData(): string[] | undefined {
        return this.entity && this.entity.addressData ? this.entity.addressData : undefined;
  }

  get phoneData(): string[] | undefined {
        return this.entity && this.entity.phoneData ? this.entity.phoneData : undefined;
  }

  get identifierData(): string[] | undefined {
        return this.entity && this.entity.identifierData ? this.entity.identifierData : undefined;
  }

  get otherData(): string[] {
    let _otherData = [];
    let _eData = this.getEntityRecord(this.entity);

    if(_eData && _eData.otherData) {
      _otherData = _eData.otherData;
    } else if(this.entity && this.entity.records) {
      // check to see if records has "otherData"
      /*
      console.warn('otherData: ', this.entity);
      this.entity.records.forEach( rec => {
        _otherData = _otherData.concat(rec.otherData);
      });*/
    }
    return _otherData;
  }

  private getEntityRecord(obj: any): SzEntityRecord {
    if (obj && obj.otherData !== undefined) {
      return {...obj} as SzEntityRecord;
    } else {
      return {} as SzEntityRecord;
    }
  }
}
