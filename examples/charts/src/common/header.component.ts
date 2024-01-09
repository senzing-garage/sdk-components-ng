import { Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'sz-example-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
  })
  export class SzExamplesHeader {
    @Input() public title: string = '';
    @Input() public description: string = '';

    constructor() {

    }
  }