import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'sz-powered-by',
  templateUrl: './sz-powered-by.component.html',
  styleUrls: ['./sz-powered-by.component.scss']
})
export class SzPoweredByComponent implements OnInit {
  @Input()
  format = 'small';
  constructor() {}
  ngOnInit() {}
}
