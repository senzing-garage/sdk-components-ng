import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EntityGraphService } from '@senzing/rest-api-client-ng';
import { SzNetworkGraphInputs } from '../../models/graph';

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

  private _entityIds: number[];
  @Input() set entityIds(value: number[] | string[] | string) {
    let arr: any[] = [];
    if ((typeof value) === 'string') {
      const textVal = <string>value;
      if (textVal && textVal.indexOf(',')) {
        arr = textVal.split(',');
      } else {
        arr = [textVal];
      }
    } else {
      arr = <any[]>value;
    }
    this._entityIds = [];
    arr.forEach(v => {
      // skip null or undefined values
      if (v === null || v === undefined) {
        return;
      }

      // check the type of the element from the specified array
      if ((typeof v) === 'number') {
        // if a number then treat as a number
        this._entityIds.push(<number>v);
      } else if ((typeof v) === 'string') {
        const text = (<string>v).trim();
        // skip empty values
        if (text.length === 0) {
          return;
        }

        // if a string then parse as an integer
        this._entityIds.push(parseInt(text.trim()));
      } else {
        // anything else we do not handle
        console.error('Entity ID in specifeid array is not properly formatted: ', v, value);
        throw new Error('Entity ID in specified is not properly formatted: ' + v);
      }
    });
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
    if(this._entityIds) {
      return this.graphService.findEntityNetwork(
        this._entityIds,
        undefined,
        this._maxDegrees,
        this._buildOut,
        this._maxEntities,
        undefined,
        undefined,
        undefined,
        undefined,
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
