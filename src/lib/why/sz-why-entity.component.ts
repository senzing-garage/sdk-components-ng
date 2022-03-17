import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityDataService, SzAttributeSearchResult, SzEntityIdentifier } from '@senzing/rest-api-client-ng';

/**
 * Display the "Why" information for entity
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entity&gt;&lt;/sz-why-entity&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entity&gt;&lt;/sz-wc-why-entity&gt;<br/>
 */
@Component({
  selector: 'sz-why-entity',
  templateUrl: './sz-why-entities.component.html',
  styleUrls: ['./sz-why-entities.component.scss']
})
export class SzWhyEntityComponent implements OnInit {
  @Input()
  entityId:number;

  constructor(entityData: EntityDataService) {

  }
  ngOnInit() {}
}

@Component({
  selector: 'sz-dialog-why-entity',
  templateUrl: 'sz-why-entity-dialog.component.html',
})
export class SzWhyEntityDialog {
  private _entity: SzEntityIdentifier;
  public get entity(): SzEntityIdentifier {
    return this._entity;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: { entityId: SzEntityIdentifier }) {
    if(data && data.entityId) {
      this._entity = data.entityId;
    }
  }
}
