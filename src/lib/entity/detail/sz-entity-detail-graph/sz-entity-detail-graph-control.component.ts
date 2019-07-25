import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';

import {
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
  selector: 'sz-entity-detail-graph-control',
  templateUrl: './sz-entity-detail-graph-control.component.html',
  styleUrls: ['./sz-entity-detail-graph-control.component.scss']
})
export class SzEntityDetailGraphControlComponent implements OnInit {
  isOpen: boolean = true;

  public _showLinkLabels = true;
  @Input() public set showLinkLabels(value){
    this._showLinkLabels = value;
  }
  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @Output() public optionChanged = new EventEmitter<{name: string, value: any}>();
  constructor() {}
  ngOnInit() {}

  public changeOption(optName: string, value: any): void {
    this.optionChanged.emit({'name': optName, 'value': value});
  }
  public toggleBoolOption(optName: string, event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    this.optionChanged.emit({'name': optName, value: _checked});
  }
}
