import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzRelatedEntity, SzEntityRecord } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';

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
  /** 0 = wide layout. 1 = narrow layout */
  @Input() public layout = 0;
  @Input() public layoutClasses: string[] = [];

  /** subscription breakpoint changes */
  private layoutChange$ = new BehaviorSubject<number>(this.layout);

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
  @Input() truncateResults: boolean = true;
  @Input() truncatedTooltip: string = "Show more..";
  // css class bool
  collapsed: boolean = this.truncateResults;

  private _truncateOtherDataAt: number = 3;
  private _truncateIdentifierDataAt: number = 2;
  private _showOtherData: boolean = true;
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
  @Input() set truncateIdentifierDataAt(value: number) {
    this._truncateIdentifierDataAt = value;
  }
  get truncateIdentifierDataAt(): number {
    return this._truncateIdentifierDataAt;
  }
  constructor(
    private cd: ChangeDetectorRef,
    public prefs: SzPrefsService
  ) {}

  ngOnInit() {
    // get and listen for prefs change
    this._showOtherData = this.prefs.searchResults.showOtherData;
    this._showAttributeData = this.prefs.searchResults.showAttributeData;
    this._truncateOtherDataAt = this.prefs.searchResults.truncateOtherDataAt;
    this._truncateAttributeDataAt = this.prefs.searchResults.truncateAttributeDataAt;

    setTimeout(() => {
      this.cd.markForCheck();
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
    this._truncateIdentifierDataAt = prefs.truncateIdentifierDataAt;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  // ----------------- start total getters -------------------
  get columnOneTotal(): number {
    const totalData = this.otherData;
    return totalData && totalData.length ? totalData.length : 0;
  }
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
  get showColumnOne(): boolean {
    let retVal = false;
    if(this.entity) {
      if(this._showOtherData && this.otherData.length > 0) {
        retVal = true;
      }
    }
    return retVal;
  }
  public _showAttributeData = false;
  public _truncateAttributeDataAt = 2;

  // -----------------  end total getters  -------------------

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    if(nameData && nameData.concat && attributeData) {
      return (this._truncateAttributeDataAt > 0) ? nameData.concat(attributeData.slice(0, this._truncateAttributeDataAt)) : nameData.concat(attributeData);
    } else if(nameData) {
      return nameData;
    } else if(attributeData) {
      return (this._truncateAttributeDataAt > 0) ? attributeData.slice(0, this._truncateAttributeDataAt) : attributeData;
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
        return this.entity && this.entity.characteristicData && this._showAttributeData ? this.entity.characteristicData : undefined;
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
