import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EntityGraphService } from '@senzing/rest-api-client-ng';
import { SzNetworkGraphInputs } from '../../models/network-graph-inputs';

@Component({
  selector: 'sz-relationship-network-lookup',
  templateUrl: './sz-relationship-network-lookup.component.html',
  styleUrls: ['./sz-relationship-network-lookup.component.scss']
})
export class SzRelationshipNetworkLookupComponent implements OnInit {

  @Output() networkLoaded = new EventEmitter<SzNetworkGraphInputs>();

  private _showLinkLabels: any = false;
  @Input() public set showLinkLabels(value: boolean) {this._showLinkLabels = value; }
  public get showLinkLabels(): boolean { return this._showLinkLabels; }

  private _entityIds: string[];
  @Input() set entityIds(value: string) {
    if(value && value.indexOf(',')) {
      this._entityIds = value.split(',');
    } else {
      this._entityIds = [value];
    }
  }

  private _maxDegrees: number;
  @Input() set maxDegrees(value: string) { this._maxDegrees = +value; }

  private _buildOut: number;
  @Input() set buildOut(value: string) { this._buildOut = +value; }

  private _maxEntities: number;
  @Input() set maxEntities(value: string) { this._maxEntities = +value; }

  static readonly WITH_RAW: boolean = true;

  constructor(private graphService: EntityGraphService) {
  }

  ngOnInit() {
    this.broadcastInputs();
  }

  broadcastInputs() {
    if(this._entityIds){
      return this.graphService.findNetworkByEntityID(
        this._entityIds,
        this._maxDegrees,
        this._buildOut,
        this._maxEntities,
        SzRelationshipNetworkLookupComponent.WITH_RAW )
        .subscribe(this.emitResult.bind(this));
    } else {
      return false;
    }
  }

  private emitResult(result) {
    console.log("Received result");
    const _showLinkLabels = this.showLinkLabels;
    this.networkLoaded.emit(new class implements SzNetworkGraphInputs {
      data = result;
      showLinkLabels = _showLinkLabels;
    });
  }

}
