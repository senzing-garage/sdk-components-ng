import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ChangeDetectorRef, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';

import { SzDataSourcesResponseData } from '@senzing/rest-api-client-ng';
import { isValueTypeOfArray, parseBool, parseNumber, parseSzIdentifier, sortDataSourcesByIndex } from '../../common/utils';
import { SzRecordCountDataSource, SzStatCountsForDataSources } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzDataSourcesService } from '../../services/sz-datasources.service';

/**
 * Embeddable Donut Graph showing how many 
 * records belong to which datasources for the repository in a visual way. 
 * 
 * @internal
 * @example <!-- (Angular) -->
 * <sz-venn-diagram></sz-venn-diagram>
 *
 * @example <!-- (WC) by attribute -->
 * <sz-wc-venn-diagram></sz-wc-venn-diagram>
 *
 */
@Component({
  selector: 'sz-venn-diagram',
  templateUrl: './sz-venn-diagram.component.html',
  styleUrls: ['./sz-venn-diagram.component.scss']
})
export class SzVennDiagramsComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  // tslint:disable-next-line:no-input-rename
  @Input("sz-singular")
  @HostBinding("class.singular")
  public singular: boolean = false;

  // tslint:disable-next-line:no-input-rename
  @Input("sz-left-count")
  public leftCount: number = 0;

  // tslint:disable-next-line:no-input-rename
  @Input("sz-right-count")
  public rightCount: number = 0;

  // tslint:disable-next-line:no-input-rename
  @Input("sz-overlap-count")
  public overlapCount: number = 0;

  // tslint:disable-next-line:no-input-rename
  @Input("sz-left-caption")
  public leftCaption: string = "";

  // tslint:disable-next-line:no-input-rename
  @Input("sz-overlap-caption")
  public overlapCaption: string = "";

  // tslint:disable-next-line:no-input-rename
  @Input("sz-right-caption")
  public rightCaption: string = "";

  // tslint:disable-next-line:no-input-rename
  @Input("sz-left-legend")
  public leftLegend: string = "";

  // tslint:disable-next-line:no-input-rename
  @Input("sz-right-legend")
  public rightLegend: string = "";

  // colors
  private _color: string | null = null;
  @Input("sz-color")
  public set color(color: string) {
    this._color = color;
  }
  public get color() : string {
    return this._color;
  }
  /*
  @Input()
  public backgorundColorA: string;
  @Input()
  public borderColorA: string;
  @Input()
  public blendModeA: string | null = null;
  @Input()
  public backgorundColorB: string;
  @Input()
  public borderColorB: string;
  @Input()
  public blendModeB: string | null = null;
  */

  // tslint:disable-next-line:no-output-rename
  @Output("sz-left-clicked")
  public leftClicked : EventEmitter<number> = new EventEmitter<number>();

  // tslint:disable-next-line:no-output-rename
  @Output("sz-overlap-clicked")
  public overlapClicked : EventEmitter<number> = new EventEmitter<number>();

  // tslint:disable-next-line:no-output-rename
  @Output("sz-right-clicked")
  public rightClicked : EventEmitter<number> = new EventEmitter<number>();

  @HostBinding("class.colorized")
  public get colorized() : boolean {
    return (this.color && this.color.length > 0);
  }

  @ViewChild("leftCircle")
  private leftCircle: ElementRef;

  @ViewChild("rightCircle")
  private rightCircle: ElementRef;

  public handleLeftClick() {
    this.leftClicked.emit(this.leftCount);
  }

  public handleOverlapClick() {
    console.log(`overlapClicked: ${this.overlapCount}`);
    this.overlapClicked.emit(this.overlapCount);
  }

  public handleRightClick() {
    this.rightClicked.emit(this.rightCount);
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private dataMartService: SzDataMartService,
    private dataSourcesService: SzDataSourcesService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {}

}