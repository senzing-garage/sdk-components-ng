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
  public _layoutClasses: string[] = [];
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  public get layoutClasses() {
    return this._layoutClasses;
  }
  @Input() public forceLayout: boolean = false;

  constructor() { }
  /**
   * get the css classes for the component. used by the template.
   */
  public get matchKeyClasses(): string {
    let classes = ['sz-match-pill-element'];
    if(this.plusMinus == 'plus') { classes.push('plus'); }
    if(this.plusMinus == 'minus') { classes.push('minus'); }
    if(this.ambiguous) { classes.push('is-ambiguous'); }
    if(this.text && this.text.toLowerCase && this.text.replace) {
      classes.push('key-'+ this.text.toLowerCase().replace('+', '').replace('-', '') );
    }
    if( this._layoutClasses && this._layoutClasses.concat && this._layoutClasses.length > 0){
      classes = classes.concat(this._layoutClasses);
    }
    return classes.join(' ');
  }

  ngOnInit() {
  }
}
