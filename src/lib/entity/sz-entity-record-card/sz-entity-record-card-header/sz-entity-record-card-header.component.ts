import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzResolvedEntity, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-record-card-header',
  templateUrl: './sz-entity-record-card-header.component.html',
  styleUrls: ['./sz-entity-record-card-header.component.scss']
})
export class SzEntityRecordCardHeaderComponent implements OnInit, OnDestroy {
  @Input() searchResult: SzSearchResultEntityData;
  @Input() searchValue: string;
  @Input() hideBackGroundColor: boolean;
  @Input() entityData: SzResolvedEntity;
  @Input() showRecordIdWhenSingleRecord: boolean = false;
  @Input() public layoutClasses: string[] = [];

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  alert = false;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  /** listen for click even on entire header */
  @HostListener('click', ['$event.target']) public onHeaderNameClick(event: MouseEvent) {
    if(this.entityDetailsId) { this.onEntityDetailLinkClick( this.entityDetailsId ); }
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  get breakDownInfoExist(): boolean {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.recordSummaries.length > 0;
    } else if(this.entityData) {
      return this.entityData.recordSummaries.length > 0;
    } else {
      return false;
    }
  }

  get breakDownInfo(): SzDataSourceRecordSummary[] {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.recordSummaries;
    } else if(this.entityData && this.entityData.recordSummaries) {
      return this.entityData.recordSummaries;
    }
  }

  get entityDetailsLinkName(): string {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.bestName;
    } else if(this.entityData && this.entityData.bestName) {
      return this.entityData.bestName;
    } else if(this.entityData && this.entityData.entityName) {
      return this.entityData.entityName;
    }
  }

  get entityDetailsLink(): string | boolean {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return `/search/details/${this.searchResult.resolvedEntity.entityId}`;
    } else if(this.entityData && this.entityData.entityId ) {
      //return '/search/by-entity-id/3086';
      return `/search/by-entity-id/${this.entityData.entityId}`;
    }
    return false;
  }

  get entityDetailsId(): number | boolean {
    if (this.searchResult && this.searchResult.resolvedEntity) {
      return this.searchResult.resolvedEntity.entityId;
    } else if(this.entityData && this.entityData.entityId ) {
      //return '/search/by-entity-id/3086';
      return this.entityData.entityId;
    }
    return false;
  }

  public onEntityDetailLinkClick(entityId: number | boolean): void {
    if(entityId && entityId > 0 && typeof entityId == 'number') {
      console.log('onEntityDetailLinkClick: "'+ entityId +'"');
      this.entityRecordClick.emit(entityId);
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    //console.warn('@senzing/sdk-components-ng/sz-entity-record-card-header.onPrefsChange(): ', prefs);
    this.showRecordIdWhenSingleRecord = prefs.showTopEntityRecordIdsWhenSingular;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
}
