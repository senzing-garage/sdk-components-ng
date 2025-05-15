import { Component, Input, OnInit, OnDestroy, Optional } from '@angular/core';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';
import { Location } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-detail-section-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
    standalone: false
})
export class SzEntityDetailSectionSummaryComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Input()section: SzEntityDetailSectionSummary;
  @Input()sectionId: number;
  @Input() public layoutClasses: string[] = [];

  //private navigationSubscription;
  public routePath: string = "";
  @Input() public inheritRoutePath = true;

  constructor(@Optional() private location: Location, @Optional() router: Router ) {
    if(router && location){
      router.events.pipe(
        takeUntil(this.unsubscribe$),
        filter(event => event instanceof NavigationEnd)
      ).subscribe(val => {
        if (location.path( false ) !== "" && location.path( false ) !== this.routePath && this.inheritRoutePath) {
          this.routePath = location.path( false );
        }
      });
    }
  }

  /**
   * when a summary box is clicked, this handler is invoked and updates the
   * url fragment.
   */
  public onSummaryClick(event: any) {
    //console.warn('onSummaryClick: ', event, this.routePath, this.sectionTarget);
    let loc = window.location.href;
    if(loc.indexOf('#') > 0){
      loc = loc.substring(0, loc.indexOf('#'));
    }
    loc = loc +'#'+ this.sectionTarget;
    // check to see if user is trying to highlight text
    if(window && window.getSelection){
      var selection = window.getSelection();
      if(selection.toString().length === 0) {
        // now invoke href
        window.location.href = loc;
      }
    } else {
      window.location.href = loc;
    }
  }

  ngOnInit() {
    // get current location
    if(this.inheritRoutePath) { this.routePath = this.location.path( false ); }
  }

  ngOnDestroy() {
    // avoid memory leaks here by cleaning up after ourselves. If we
    // don't then we will continue to run our routepath updates
    // on every navigationEnd event.
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get sectionTarget(): string {
    return 'detail-section-'+ this.sectionId;
  }

  get noResults(): boolean {
    if(this.section) {
      return this.section.total <= 0;
    }
    return true;
  }

  get isMatchedRecords(): boolean {
    return this.section.title.toLowerCase() === 'matched records' || this.section.title.toLowerCase() === 'matched record';
  }

  get isPossibleMatches(): boolean {
    return this.section.title.toLowerCase() === 'possible matches' || this.section.title.toLowerCase() === 'possible match';
  }
  get isPossibleRelationships(): boolean {
    return this.section.title.toLowerCase() === 'possible relationships' || this.section.title.toLowerCase() === 'possible relationship';
  }
  get isDisclosedRelationships(): boolean {
    return this.section.title.toLowerCase() === 'disclosed relationships' || this.section.title.toLowerCase() === 'disclosed relationship';
  }

  public get cssClasses(): string[] {
    let retVal = [];
    // apply icons and colors to section
    if(this.isMatchedRecords){ retVal.push('matched-records'); }
    if(this.isPossibleMatches){ retVal.push('possible-matches'); }
    if(this.isPossibleRelationships){ retVal.push('possible-relationships'); }
    if(this.isDisclosedRelationships){ retVal.push('disclosed-relationships'); }
    if(this.noResults){ retVal.push('no-results'); }
    // merge with cssLayoutClasses
    retVal = retVal.concat( this.layoutClasses );

    return retVal;
  }
}
