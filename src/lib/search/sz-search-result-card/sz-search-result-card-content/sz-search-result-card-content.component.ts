import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';

import { SzRelatedEntity, SzEntityRecord } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-search-result-card-content',
  templateUrl: './sz-search-result-card-content.component.html',
  styleUrls: ['./sz-search-result-card-content.component.scss']
})
export class SzSearchResultCardContentComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
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

  constructor(
    private ref: ChangeDetectorRef,
    public prefs: SzPrefsService
  ) {}

  ngOnInit() {
    // get and listen for prefs change

    this._showOtherData = this.prefs.searchResults.showOtherData;
    this._showAttributeData = this.prefs.searchResults.showAttributeData;
    this._truncateOtherDataAt = this.prefs.searchResults.truncateOtherDataAt;
    this._truncateAttributeDataAt = this.prefs.searchResults.truncateAttributeDataAt;

    setTimeout(() => {
      // @deprecated
      //this.columnOneTotal = this.columnOne ? this.columnOne.nativeElement.children.length : 0;
      //this.columnTwoTotal = this.columnTwo.nativeElement.children.length;
      //this.columnThreeTotal = this.columnThree.nativeElement.children.length;
      //this.columnFourTotal = this.columnFour.nativeElement.children.length;
      //this.columnFiveTotal = this.columnFive.nativeElement.children.length;

      this.ref.markForCheck();
    });
    this.prefs.searchResults.prefsChanged.pipe(
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
    this._showOtherData = prefs.showOtherData;
    this._showAttributeData = prefs.showAttributeData;
    this._truncateOtherDataAt = prefs.truncateOtherDataAt;
    this._truncateAttributeDataAt = prefs.truncateAttributeDataAt;
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
    return (this.columnFiveTotal > 0 && this._showOtherData);
  }
  public _showAttributeData = false;
  public _showOtherData = true;
  public _truncateOtherDataAt = 2;
  public _truncateAttributeDataAt = 2;

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
        return this.entity && this.entity.attributeData && this._showAttributeData ? this.entity.attributeData : undefined;
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
