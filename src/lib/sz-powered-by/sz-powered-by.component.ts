import { Component, OnInit, Input } from '@angular/core';

/**
 * A simple "powered by senzing" component.
 * Used for configuration debugging since this does
 * not require any Rest API communication.
 *
 * @example 
 * &lt;!-- (Angular) --&gt;<br/>
 * &lt;sz-powered-by&gt;&lt;/sz-powered-by&gt;<br/><br/>
 *
 * &lt;!-- (WC) --&gt;<br/>
 * &lt;sz-wc-powered-by&gt;&lt;/sz-wc-powered-by&gt;<br/>
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
