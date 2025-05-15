import { Component, OnInit, Input } from '@angular/core';

/**
 * A simple "powered by senzing" component.
 * Used for configuration debugging since this does
 * not require any Rest API communication.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-powered-by></sz-powered-by>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-powered-by></sz-wc-powered-by>
 */
@Component({
    selector: 'sz-powered-by',
    templateUrl: './sz-powered-by.component.html',
    styleUrls: ['./sz-powered-by.component.scss'],
    standalone: false
})
export class SzPoweredByComponent implements OnInit {
  @Input()
  format = 'small';
  constructor() {}
  ngOnInit() {}
}
