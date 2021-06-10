import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { SzRelatedEntity, SzEntityRecord } from '@senzing/rest-api-client-ng';
import { SzEntityDetailSectionCollapsibleCardComponent } from './collapsible-card.component';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { SzEntityRecordCardContentComponent } from '../../sz-entity-record-card/sz-entity-record-card-content/sz-entity-record-card-content.component';

interface SectionDataByDataSource {
  dataSource?: string;
  records?: SzEntityRecord[] | SzRelatedEntity[]
}

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-details-section',
  templateUrl: './sz-entity-details-section.component.html',
  styleUrls: ['./sz-entity-details-section.component.scss']
})
export class SzEntityDetailsSectionComponent implements OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  _sectionData: SzEntityRecord[] | SzRelatedEntity[];
  _sectionDataByDataSource: SectionDataByDataSource[];
  _sectionDataByMatchKey: SzEntityRecord[] | SzRelatedEntity[];

  @Input() entity: SzEntityRecord | SzRelatedEntity;
  @Input()
  set sectionData(value) {
    //console.log('setting section data: ', value);
    this._sectionData = value;
    this._sectionDataByDataSource = this.getSectionDataByDataSource(value);
    this._sectionDataByMatchKey = this.getSectionDataByMatchKey(value);
  }
  get sectionData() {
    return this._sectionData;
  }
  @Input() sectionTitle: string;
  @Input() sectionCount: number;
  @Input() sectionId: string;
  @Input() showOtherDataInEntities: boolean;
  @Input() showBestNameOnlyInEntities: boolean;
  @Input() showNameDataInEntities: boolean;

  /** when the user collapses or expands the ui toggle */
  @Output() onCollapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() public collapsedStatePrefsKey: string = 'borgledeerger';

  public onCollapsibleCardStateChange(isCollapsed?: boolean) {
    let totalInAll = this.collapsable.length;
    const numExpanded: number = this.collapsable.filter( (colCard ) => {
      return (colCard.expanded) == true;
    }).length;
    const numCollapsed: number = this.collapsable.filter( (colCard ) => {
      return (colCard.expanded) == false;
    }).length;
    let allCollapsed = (numCollapsed == totalInAll);
    let allExpanded = (numExpanded == totalInAll);

    if(allCollapsed || allExpanded) {
      // we only want to publish a state change if all the cards are in a uniform state
      // so we can remember expanded state of entire sections.
      // console.warn('onCollapsibleCardStateChange: ', allCollapsed, allExpanded, this.collapsedStatePrefsKey, this.collapsable);
      this.onCollapsedChange.emit(isCollapsed);
    }
  }
  @ViewChildren(SzEntityDetailSectionCollapsibleCardComponent) collapsable: QueryList<SzEntityDetailSectionCollapsibleCardComponent>

  /** the width to switch from wide to narrow layout */
  @Input() public layoutBreakpoints = [
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 700, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 699 }
  ]
  public _layoutClasses: string[] = [];
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  public get layoutClasses() {
    return this._layoutClasses;
  }
  @Input() public forceLayout: boolean = false;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  constructor(public breakpointObserver: BreakpointObserver) { }

  /**
   * This is used to query for all columns displayed for an  
   * individual records, then flatten the result in to a array of booleans so 
   * we can use that to fill empty columns for records that lack data of other 
   * records. this is for grid alignment.
   */
  public get sectionsShownColumns(): boolean[] {
    let retVal = [false, false, false, false];
    if(this.showByDataSource){
      let sectionDataRecords  = []; // we just want all possible displayed columns anyway
      this._sectionDataByDataSource.forEach( (sectionData: SectionDataByDataSource) => {
        if(sectionData && sectionData.records) {
          sectionDataRecords  = sectionDataRecords.concat( sectionData.records );
        }
      });
      let _allRecordCols = [];
      sectionDataRecords.forEach((sectionData: SzEntityRecord | SzRelatedEntity) => {
        _allRecordCols.push( SzEntityRecordCardContentComponent.getColumnsThatWouldBeDisplayedForData( sectionData ) );
      });
      // now condense to flattened array
      _allRecordCols.forEach((recordCols: boolean[]) => {
        if(recordCols[0] === true) { retVal[0] = true;}
        if(recordCols[1] === true) { retVal[1] = true;}
        if(recordCols[2] === true) { retVal[2] = true;}
        if(recordCols[3] === true) { retVal[3] = true;}
        if(recordCols[4] === true) { retVal[4] = true;}
      });
    } else {
      // TODO: do alignment for other sections
    }
    return retVal;
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // detect layout changes
    let bpSubArr = [];
    this.layoutBreakpoints.forEach( (bpObj: any) => {
      if(bpObj.minWidth && bpObj.maxWidth){
        // in between
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px) and (max-width: ${bpObj.maxWidth}px)`);
      } else if(bpObj.minWidth){
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px)`);
      } else if(bpObj.maxWidth){
        bpSubArr.push(`(max-width: ${bpObj.maxWidth}px)`);
      }
    });
    const layoutChanges = this.breakpointObserver.observe(bpSubArr);

    layoutChanges.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => { return !this.forceLayout })
    ).subscribe( (state: BreakpointState) => {

      const cssQueryMatches = [];
      // get array of media query matches
      for(let k in state.breakpoints){
        const val = state.breakpoints[k];
        if(val == true) {
          // find key in layoutBreakpoints
          cssQueryMatches.push( k )
        }
      }
      // get array of layoutBreakpoints objects that match media queries
      const _matches = this.layoutBreakpoints.filter( (_bp) => {
        const _mq = this.getCssQueryFromCriteria(_bp.minWidth, _bp.maxWidth);
        if(cssQueryMatches.indexOf(_mq) >= 0) {
          return true;
        }
        return false;
      });
      // assign matches to local prop
      this.layoutClasses = _matches.map( (_bp) => {
        return _bp.cssClass;
      })
    })
  }

  get showByDataSource(): boolean {
    if(this.sectionTitle) {
      return this.sectionTitle.toLowerCase() === 'matched records';
    }
    return !this.showEntitiesByMatchKey;
  }

  get showEntitiesByMatchKey(): boolean {
    if(this.sectionTitle) {
      return ([
        'possible matches',
        'possible relationships',
        'disclosed relationships',
        'ambiguous matches'
      ].indexOf(this.sectionTitle.toLowerCase()) >= 0);
    }
    return false;
  }

  private getSectionDataByDataSource(sectionData): SectionDataByDataSource[] {
    const _ret = sectionData;
    const byDS = {};
    const dsAsArray = [];
    if (_ret) {
      _ret.forEach(element => {
        //console.log('\t\t item: ',element);
        if ( element && element.records ) {
          element.records.forEach( innerelement => {
            //console.log('\t\t\trecords: ', element.records);
            if ( !byDS[ innerelement.dataSource ]) { byDS[ innerelement.dataSource ] = {dataSource: innerelement.dataSource, records: []}; }
            byDS[ innerelement.dataSource ].records.push(innerelement);
          });
        } else if ( element && element.dataSource ) {
          if ( !byDS[ element.dataSource ]) { byDS[ element.dataSource ] = {dataSource: element.dataSource, records: []}; }
          byDS[ element.dataSource ].records.push(element);
        }
      });
    }
    if (byDS) {
      for (const _k in byDS) {
        dsAsArray.push(byDS[_k]);
      }
    }
    //if (_ret && _ret.length > 0) { console.log('records by source: ', dsAsArray); }
    return dsAsArray;
  }

  private getSectionDataByMatchKey(sectionData) {
    const _ret = sectionData;

    const _retByMK = {};
    const _retByMKAsArray = [];
    if(_ret && _ret.forEach) {
      _ret.forEach(matchGroup => {
        if(! _retByMK[ matchGroup.matchKey]) {
          _retByMK[ matchGroup.matchKey] = {matchKey: matchGroup.matchKey, records: []};
        }
        _retByMK[ matchGroup.matchKey].records.push(matchGroup);
      });
    }

    if (_retByMK) {
      for (const _k in _retByMK) {
        _retByMKAsArray.push(_retByMK[_k]);
      }
    }
    return _retByMKAsArray;
  }

  get showIcon(): boolean {
    const section = this.sectionTitle.toLowerCase();
    return section === 'matched records' || section === 'discovered relationships';
  }

  get headerIcon(): string {
    return this.sectionTitle.toLowerCase() === 'matched records' ? 'senzing-datasource' : 'senzing-key';
  }

  get sectionIcon(): string {
    let _className = 'senzing-relationships';
    if(!this.sectionTitle){ return _className; }
    switch(this.sectionTitle.toLowerCase()) {
      case 'matched records':
        _className = 'senzing-matches';
        break;
      case 'disclosed relationships':
        _className = 'senzing-disclosedrelationships';
        break;
      default:
        _className = 'senzing-relationships';
    }
    return _className;
  }

  public onEntityRecordClick(entityId: number): void {
    console.log('sz-entity-details-section: ', entityId);
    this.entityRecordClick.emit(entityId);
  }

  getCssQueryFromCriteria(minWidth?: number, maxWidth?: number): string | undefined {
    if(minWidth && maxWidth){
      // in between
      return (`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
    } else if(minWidth){
      return (`(min-width: ${minWidth}px)`);
    } else if(maxWidth){
      return (`(max-width: ${maxWidth}px)`);
    }
    return
  }

}
