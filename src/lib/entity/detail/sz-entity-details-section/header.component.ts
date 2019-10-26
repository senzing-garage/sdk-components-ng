import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-section-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class SzEntityDetailSectionHeaderComponent implements OnInit {
  @Input() sectionTitle: string;
  @Input() sectionCount: number;
  @Input() sectionIcon: string;
  @Input() sectionId: string;

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

  constructor() { }

  ngOnInit() {
  }

  get ngClasses() {
    let retVal = [];
    if(this.isMatchedRecords){ retVal.push('matched-records'); }
    if(this.isPossibleMatches){ retVal.push('possible-matches'); }
    if(this.isPossibleRelationships){ retVal.push('possible-relationships'); }
    if(this.isDisclosedRelationships){ retVal.push('disclosed-relationships'); }
    if(this._layoutClasses && this._layoutClasses.length > 0){
      retVal = retVal.concat(this._layoutClasses);
    }
    return retVal;
  }

  get countLabel(): string {
    if(!this.sectionTitle) { return ''; }
    switch (this.sectionTitle.toLowerCase()) {
      case 'matched records': return 'Records';
      case 'possible matches': return 'Matches';
      case 'disclosed relationships':
      case 'possible relationships': return 'Relationships';
      default: return '';
    }
  }

  get isMatchedRecords(): boolean {
    return this.sectionTitle && this.sectionTitle.toLowerCase() === 'matched records';
  }

  get isPossibleMatches(): boolean {
    return this.sectionTitle && this.sectionTitle.toLowerCase() === 'possible matches';
  }
  get isPossibleRelationships(): boolean {
    return this.sectionTitle && this.sectionTitle.toLowerCase() === 'possible relationships';
  }
  get isDisclosedRelationships(): boolean {
    return this.sectionTitle && this.sectionTitle.toLowerCase() === 'disclosed relationships';
  }
}
