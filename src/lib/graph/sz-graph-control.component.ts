import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SzPrefsService } from '../services/sz-prefs.service';
import { Subject } from 'rxjs';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-graph-control',
  templateUrl: './sz-graph-control.component.html',
  styleUrls: ['./sz-graph-control.component.scss']
})
export class SzGraphControlComponent implements OnInit, OnDestroy {
  isOpen: boolean = true;
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  public _showLinkLabels = true;
  @Input() public set showLinkLabels(value){
    this._showLinkLabels = value;
  }
  public get showLinkLabels(): boolean {
    return this._showLinkLabels;
  }
  @Output() public optionChanged = new EventEmitter<{name: string, value: any}>();

  constructor(
    public prefs: SzPrefsService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {}

  public changeOption(optName: string, value: any): void {
    this.optionChanged.emit({'name': optName, 'value': value});
  }
  public toggleBoolOption(optName: string, event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    this.optionChanged.emit({'name': optName, value: _checked});
  }
}
