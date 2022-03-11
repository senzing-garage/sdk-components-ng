import { Component, Input } from '@angular/core';
import {
  SzEntityRecord
} from '@senzing/rest-api-client-ng';

/**
 * A component for displaying the result(s) of the sz-search-by-id component
 * when the results are of type SzEntityRecord. The fragment only displays information
 * that was present in the record itself. The easiest way to use this component is to pair it
 * with the &lt;sz-search-by-id&gt;/&lt;sz-wc-search-by-id&gt; component(s).
 * @export
 *
 * @example 
 * <code>
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-search-by-id #searchBox<br/>
  [dataSource]="'COMPANIES'"<br/>
  (resultChange)="formResult = $event"&gt;&lt;/sz-search-by-id&gt;<br/>
 * &lt;sz-entity-record-viewer *ngIf="formResult" [record]="formResult"&gt;&lt;/sz-entity-record-viewer&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-search-by-id id="formInput"<br/>
  data-source="COMPANIES"&gt;&lt;/sz-wc-search-by-id&gt;<br/>
 * &lt;sz-wc-entity-record-viewer id="formResult"&gt;<br/>
 * &lt;/sz-wc-entity-record-viewer&gt;<br/>
 * &lt;script&gt;<br/>
 * document.getElementById('formInput').addEventListener('resultChange', function(evt) {<br/>
 *     document.getElementById('formResult').record = evt.detail;<br/>
 * });<br/>
 * &lt;/script&gt;<br/>
 * </code>
 * 
 */
@Component({
  selector: 'sz-entity-record-viewer',
  templateUrl: './sz-entity-record-viewer.component.html',
  styleUrls: ['./sz-entity-record-viewer.component.scss']
})
export class SzEntityRecordViewerComponent {
  /** the record to display */
  private _record: SzEntityRecord;
  /** set the record to display */
  @Input() public set record(value: SzEntityRecord | string) {
    if((value as SzEntityRecord).recordId) {
      this._record = (value as SzEntityRecord);
    } else {
      // assume string
      this._record = JSON.parse(value as string);
    }
  };
  /** return the record data */
  public get record() {
    return this._record;
  }
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
