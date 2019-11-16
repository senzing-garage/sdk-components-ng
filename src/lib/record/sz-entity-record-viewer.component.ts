import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  SzEntityRecord
} from '@senzing/rest-api-client-ng';

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
  @Input() data: SzEntityRecord;
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
}
