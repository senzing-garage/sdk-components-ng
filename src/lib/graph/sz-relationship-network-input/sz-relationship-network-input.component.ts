import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SzRelationshipNetworkComponent } from '../sz-relationship-network/sz-relationship-network.component';
import { EntityGraphService, SzDetailLevel } from '@senzing/rest-api-client-ng';
import { SzNetworkGraphInputs } from '../../models/graph';

/**
 * @internal
 */
@Component({
    selector: 'sz-relationship-network-input',
    templateUrl: './sz-relationship-network-input.component.html',
    styleUrls: ['./sz-relationship-network-input.component.scss'],
    standalone: false
})
export class SzRelationshipNetworkInputComponent implements OnInit {

  @Output() networkLoaded = new EventEmitter<SzNetworkGraphInputs>();

  // Graph Controls
  private entityInputCount: number = 2;
  showLinkLabels = true;
  networkBuildout: number = 2;
  networkMaxDegrees: number = 3;
  maxEntities: number;

  constructor(private graphService: EntityGraphService) {}

  ngOnInit() {
  }

  addEntityInput() {
    this.entityInputCount += 1;
    const newInputLabel = document.createElement('label');
    newInputLabel['for'] = 'entity' + this.entityInputCount;
    newInputLabel.appendChild(document.createTextNode('Entity ' + this.entityInputCount + ': '));
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.id = 'entity' + this.entityInputCount;
    const newInputBreak = document.createElement('br');

    const inputs = document.getElementById('entityInputs');
    inputs.appendChild(newInputLabel);
    inputs.appendChild(newInput);
    inputs.appendChild(newInputBreak);
  }

  entityIds() {
    const ids: string[] = [];
    ids.push((document.getElementById('entity1') as HTMLInputElement).value);
    for (let i = 2; i <= this.entityInputCount; i++) {
      const inputId = (document.getElementById('entity' + i) as HTMLInputElement).value;
      if (inputId) {
        ids.push(inputId);
      }
    }
    return ids;
  }

  broadcastInputs() {
    this.graphService.findEntityNetwork(this.entityIds(),
      undefined,
      this.networkMaxDegrees,
      this.networkBuildout,
      this.maxEntities,
      SzDetailLevel.BRIEF,
      undefined,
      undefined,
      undefined,
      undefined,
      SzRelationshipNetworkComponent.WITHOUT_RAW)
      .subscribe(this.emitResult.bind(this));
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
