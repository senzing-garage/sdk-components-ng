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

  ngOnInit() {
  }
}
