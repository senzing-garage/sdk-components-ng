import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityDataService, SzAttributeSearchResult, SzEntityIdentifier } from '@senzing/rest-api-client-ng';

/**
 * Display the "Why" information for entities
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-why-entities&gt;&lt;/sz-why-entities&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-why-entities&gt;&lt;/sz-wc-why-entities&gt;<br/>
 */
@Component({
  selector: 'sz-why-entities',
  templateUrl: './sz-why-entities.component.html',
  styleUrls: ['./sz-why-entities.component.scss']
})
export class SzWhyEntitiesComparisonComponent implements OnInit {
  @Input()
  entityId:number;

  constructor(entityData: EntityDataService) {

  }
  ngOnInit() {}
}
/*
@Component({
  selector: 'sz-dialog-why-entities',
  templateUrl: 'sz-why-entities-dialog.component.html'
})
export class SzWhyEntitiesDialog {
  private _entities: SzEntityIdentifier[] = [];
  public get entities(): SzEntityIdentifier[] {
    return this._entities;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: {entities: SzEntityIdentifier[]}) {
    if(data && data.entities) {
      this._entities = data.entities;
    }
  }
}
*/
@Component({
  selector: 'sz-dialog-why-entities',
  templateUrl: 'sz-why-entities-dialog.component.html'
})
export class SzWhyEntitiesDialog {
  private _entities: SzEntityIdentifier[] = [];
  public get entities(): SzEntityIdentifier[] {
    return this._entities;
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    if(data && data.entities) {
      this._entities = data.entities;
    }
  }
}