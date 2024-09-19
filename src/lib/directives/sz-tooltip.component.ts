import { Component, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
/*
@Component({
    selector: 'sz-tooltip',
    template: `{{ text }}`,
})
export class SzTooltipComponent {
    @Input() text = '';
}*/

@Component({
  selector: 'sz-tooltip',
  styleUrls: ['./sz-tooltip.component.scss'],
  templateUrl: './sz-tooltip.component.html',
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(300, style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate(300, style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class SzTooltipComponent {
  @Input() text = '';
}