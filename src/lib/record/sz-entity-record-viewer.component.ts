import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  SzEntityRecord
} from '@senzing/rest-api-client-ng';
import { SzSearchByIdFormParams } from '../search/sz-search/sz-search-by-id.component';

/**
 * A component for displaying the result(s) of the sz-search-by-id
 * when the results are of type SzEntityRecord
 * @export
 */
@Component({
  selector: 'sz-entity-record-viewer',
  templateUrl: './sz-entity-record-viewer.component.html',
  styleUrls: ['./sz-entity-record-viewer.component.scss']
})
export class SzEntityRecordViewerComponent implements OnInit {
  @Input() record: SzEntityRecord;
  @Input() datasource: string;
  @Input() parameters: SzSearchByIdFormParams;
  @Input() showJSON = true;
  @Input() showNoResultMessage = true;
  public _layoutClasses: string[] = [];
  private _activeView = 'overview';

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

  public get overViewActive(): boolean {
    return (this._activeView === 'overview' || this._activeView === 'summary');
  }
  public get jsonViewActive(): boolean {
    return !this.overViewActive;
  }

  constructor() { }
  ngOnInit() {}

  showTab(activeView: string) {
    // check to make sure passed string is one of our allowed values
    if (['json','overview','summary'].indexOf(activeView) > -1 ) {
      this._activeView = activeView;
    }
  }
}
