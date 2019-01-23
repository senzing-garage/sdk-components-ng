import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import {
  EntityDataService,
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-details-section',
  templateUrl: './sz-entity-details-section.component.html',
  styleUrls: ['./sz-entity-details-section.component.scss']
})
export class SzEntityDetailsSectionComponent implements OnInit {
  _sectionData: SzEntityRecord[] | SzRelatedEntity[];
  _sectionDataByDataSource: SzEntityRecord[] | SzRelatedEntity[];
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


  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
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

  private getSectionDataByDataSource(sectionData) {
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

    let _retByMK = {};
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

}
