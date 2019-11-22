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
export class SzEntityRecordViewerComponent {
  /** the record to display */
  @Input() record: SzEntityRecord;
  /** show the JSON data for this.record<SzEntityRecord> */
  @Input() showJSON = true;
  /** show a message when a search has 0 results */
  @Input() showNoResultMessage = true;
  /** the css classes being applied. layout-wide | layout-medium  | layout-narrow | layout-rail*/
  public _layoutClasses: string[] = [];
  /** the tab to default to. "overview" | "json"*/
  private _activeView = 'overview';
  /** setter for _layoutClasses  */
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  /** getter for _layoutClasses  */
  public get layoutClasses() {
    return this._layoutClasses;
  }
  /** whether or not to force to a layout and ignore responsiveness */
  @Input() public forceLayout: boolean = false;
  /** is the "Overview" tab the actively focused tab */
  public get overViewActive(): boolean {
    return (this._activeView === 'overview' || this._activeView === 'summary');
  }
  /** is the "JSON" tab the actively focused tab */
  public get jsonViewActive(): boolean {
    return !this.overViewActive;
  }
  constructor() { }

  /** activate a tab. 'json' | 'overview' | 'summary' */
  showTab(activeView: string) {
    // check to make sure passed string is one of our allowed values
    if (['json','overview','summary'].indexOf(activeView) > -1 ) {
      this._activeView = activeView;
    }
  }
}
