import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SzNetworkGraphInputs } from '../../models/network-graph-inputs';

@Component({
  selector: 'sz-relationship-network-upload',
  templateUrl: './sz-relationship-network-upload.component.html',
  styleUrls: ['./sz-relationship-network-upload.component.scss']
})
export class SzRelationshipNetworkUploadComponent implements OnInit {

  @Output() networkLoaded = new EventEmitter<SzNetworkGraphInputs>();
  showLinkLabels: boolean = true;

  constructor() {
  }

  ngOnInit() {
  }

  loadNetwork(event) {
    let file;
    let fr;

    file = event.srcElement.files[0];
    fr = new FileReader();
    fr.onload = function(e) {
      this.emitResult(fr.result);
    }.bind(this);
    fr.readAsText(file);
  }

  private emitResult(result) {
    console.log("Received result: " + result);
    console.log("Network Loaded: " + this.networkLoaded);
    const showLinkLabels = this.showLinkLabels;
    this.networkLoaded.emit(new class implements SzNetworkGraphInputs {
      data = result;
      showLinkLabels = showLinkLabels;
    });
  }

}
