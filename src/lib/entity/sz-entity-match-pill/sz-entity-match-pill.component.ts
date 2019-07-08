import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

/**
 * @internal
 *
 * @export
 */
@Component({
  selector: 'sz-entity-match-pill',
  templateUrl: './sz-entity-match-pill.component.html',
  styleUrls: ['./sz-entity-match-pill.component.scss']
})
export class SzEntityMatchPillComponent implements OnInit {
  @Input() text: string;
  @Input() plusMinus: string;
  @Input() ambiguous: boolean;

  constructor() { }
  /**
   * get the css classes for the component. used by the template.
   */
  public get matchKeyClasses(): string {
    let classes = ['sz-match-pill-element'];
    if(this.plusMinus == 'plus') { classes.push('plus'); }
    if(this.plusMinus == 'minus') { classes.push('minus'); }
    if(this.ambiguous) { classes.push('is-ambiguous'); }
    classes.push('key-'+ this.text.toLowerCase().replace('+', '').replace('-', '') );
    return classes.join(' ');
  }

  ngOnInit() {
  }
}
