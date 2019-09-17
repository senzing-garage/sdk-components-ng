import { Component, OnInit, Input } from '@angular/core';

/**
 * A simple "powered by senzing" component.
 * Used for configuration debugging since this does
 * not require any Rest API communication.
 *
 * @example
 * <sz-powered-by></sz-powered-by>
 */
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
