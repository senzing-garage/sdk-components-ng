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
  @Input() entity: SzEntityDetailSectionData;
  @Input() maxLinesToDisplay = 3;
  @Input() showAllInfo: boolean;

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
    return (this.nameData.concat(this.attributeData).length);
  }
  get showColumnTwo(): boolean {
    return (this.columnTwoTotal > 0);
  }
  get columnThreeTotal(): number {
    return (this.addressData.concat(this.phoneData).length);
  }
  get showColumnThree(): boolean {
    return (this.columnThreeTotal > 0);
  }
  get columnFourTotal(): number {
    return this.identifierData.length;
  }
  public get showColumnFour(): boolean {
    return this.identifierData.length > 0;
  }
  get columnFiveTotal(): number {
    return this.otherData.length;
  }
  get showColumnFive(): boolean {
    return (this.columnFiveTotal > 0);
  }
  // -----------------  end total getters  -------------------

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    return nameData.concat(attributeData);
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    return addressData.concat(phoneData);
  }

  get nameData(): string[] {
        return this.entity.nameData;
  }

  get attributeData(): string[] {
        return this.entity.attributeData;
  }

  get addressData(): string[] {
        return this.entity.addressData;
  }

  get phoneData(): string[] {
        return this.entity.phoneData;
  }

  get identifierData(): string[] {
        return this.entity.identifierData;
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
    if (obj.otherData !== undefined) {
      return {...obj} as SzEntityRecord;
    } else {
      return {} as SzEntityRecord;
    }
  }
}
