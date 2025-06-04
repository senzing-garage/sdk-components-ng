import { Component, HostBinding, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, take, takeUntil, tap } from 'rxjs';
import { SzEntityData } from '@senzing/rest-api-client-ng';
import { SzCrossSourceCount, SzCrossSourceSummaryCategoryType } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { isNotNull } from '../../common/utils';
import { SzPrefsService } from '../../services/sz-prefs.service';

/**
 * @internal
 */
@Component({
    selector: 'sz-css-matchkeys-dialog',
    templateUrl: 'sz-cross-source-matchkey-picker.component.html',
    styleUrls: ['sz-cross-source-matchkey-picker.component.scss'],
    standalone: false
})
  export class SzCrossSourceSummaryMatchKeyPickerDialog implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _showOkButton = true;
    public _title: string = 'Filter by Match Key';
    public text: string;
    public buttonText: string = "Ok";
    private _data: Array<SzCrossSourceCount>;
    private _statType: SzCrossSourceSummaryCategoryType;
    private _selectedCount = 0;

    public get selectedMatchKey(): string {
        if(this.hasSelectedMatchKey) {
            return this.dataMartService.sampleSetMatchKey;
        }
        return undefined;
    }
    public set selectedMatchKey(value: string) {
        this.dataMartService.sampleSetMatchKey = value;
    }

    public get showDialogActions(): boolean {
      return this._showOkButton;
    }

    public get dataRows() {
        return this._data;
    }

    public get title() {
        let retVal = '';
        let selectedCount = this._selectedCount ? this._selectedCount : this.getSelectedCount(this._data, undefined, this._statType);

        if(this.hasSelectedMatchKey) {
            // filter selected
            retVal = selectedCount + (selectedCount > 1 ? ' Matching Items' : ' Matching Item');
        } else {
            // no filter selected
            retVal  = 'Choose Match Key\'s';
        }
        return retVal;
    }
    public get hasSelectedMatchKey(): boolean {
        if(this._statType !== this.dataMartService.sampleStatType) {
            return false;
        }
        return this.dataMartService.sampleSetMatchKey && this.dataMartService.sampleSetMatchKey !== '';
    }

    public onMatchKeyFilterChange(value) {
        if(value && value.value) {
            this.dataMartService.doNotFetchSampleSetOnParameterChange = true;
            this.dataMartService.sampleSetMatchKey  = value;
            this._updateSampleData(value.value);
            // set debounce timer so that if no new value shows up before the timer
            // expires then we assume that's the request they want
        }
    }

    /** we use this on click to immediately close the dialog on mouse click */
    public setMatchKey(value: string) {
        this._updateSampleData(value);
        this.dialogRef.close(true);
    }

    private _updateSampleData(matchKey: string) {
        console.log(`_updateSampleData: ${matchKey}`, matchKey);
        this.dataMartService.doNotFetchSampleSetOnParameterChange = true;
        let changeWholeSampleSet = false; // we don't want to fetch new requests 4 times while we change parameters
        if(this.dataMartService.sampleStatType !== this._statType) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleStatType = this._statType;
        }
        if(this.dataMartService.dataSource1 !== this.dataMartService.sampleDataSource1) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleDataSource1 = this.dataMartService.dataSource1;
        }
        if(this.dataMartService.dataSource2 !== this.dataMartService.sampleDataSource2) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleDataSource2 = this.dataMartService.dataSource2;
        }
        this.dataMartService.sampleSetMatchKey  = matchKey;
        this.dataMartService.sampleSetPage      = 0;
        this.dataMartService.matchKeyCounts     = this._data;

        if(isNotNull(this.dataMartService.sampleSetMatchKey)) {
            // get null matchkey count
            let totalItem = this._data.find((item)=>{ return !item.matchKey });
            let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';

            console.info(`!!! totalItem: ${totalItem ? totalItem[countKey] : undefined}`, totalItem);
            if(totalItem) {
                this.dataMartService.sampleSetUnfilteredCount   = totalItem[countKey];
            }
        } else {
            console.warn(`setting unfiltered count to undefined `);
        }

        if(changeWholeSampleSet) {
            console.info(`\t_updateSampleData: `, this.dataMartService.sampleStatType,
            this.dataMartService.sampleDataSource1,
            this.dataMartService.sampleDataSource2,
            this.dataMartService.sampleSetMatchKey,
            this.dataMartService.sampleSetPrinciple,
            this.dataMartService.sampleSetUnfilteredCount);

            this.dataMartService.createNewSampleSetFromParameters(
                this.dataMartService.sampleStatType,
                this.dataMartService.sampleDataSource1,
                this.dataMartService.sampleDataSource2,
                this.dataMartService.sampleSetMatchKey,
                this.dataMartService.sampleSetPrinciple,
                undefined, undefined, undefined,
                this.dataMartService.sampleSetUnfilteredCount).pipe(
                  takeUntil(this.unsubscribe$),
                  take(1),
                  tap((data: SzEntityData[]) => {
                    //this._loading.next(false);
                    //this._onNewSampleSet.next(data);
                    this.dataMartService.doNotFetchSampleSetOnParameterChange = false;
                  })
            )
        } else {
            // just update the data
            this.dataMartService.refreshSampleSet();
            this.dataMartService.doNotFetchSampleSetOnParameterChange = false;
        }
    }

    public isTotalRow(row: SzCrossSourceCount) {
        return row && !row.matchKey ? true : false;
    }

    public getSelectedCount(data?: Array<SzCrossSourceCount>, matchKey?: string, statType?: SzCrossSourceSummaryCategoryType) {
        let _tConnections = 0;
        let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';
        data        = data ? data : this._data;
        matchKey    = matchKey ? matchKey : (this.dataMartService && this.dataMartService.sampleSetMatchKey ? this.dataMartService && this.dataMartService.sampleSetMatchKey : undefined);
        statType    = statType ? statType : this._statType;

        if(data && data.length && this.dataMartService.sampleSetMatchKey) {
            data.forEach((item)=> {
                if(item.matchKey === matchKey){
                    _tConnections = _tConnections + item[countKey];
                }
            });
            return _tConnections;
        } else if(!this.dataMartService.sampleSetMatchKey) {
            // just get the total
            let totalItem = data.find((item)=>{ return !item.matchKey });

            if(totalItem) {
                _tConnections = totalItem[countKey];
            }
        }
        this._selectedCount = _tConnections;
        return _tConnections;
    }

    public get currentlySelected() {
        let retVal = '';
        return retVal;
    }

    public clearMatchKey() {
        this.dataMartService.sampleSetMatchKey = undefined;
        this.dialogRef.close(true);
    }

    public getCount(row: SzCrossSourceCount) {
        let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';
        return row && row[countKey] ? row[countKey] : 0;
    }

    public get showMatchKeyFiltersOnSelect() {
        return this.prefs.dataMart.showMatchKeyFiltersOnSelect;
    }

    public toggleShowMatchKeyFiltersOnSelect() {
        this.prefs.dataMart.showMatchKeyFiltersOnSelect = !this.prefs.dataMart.showMatchKeyFiltersOnSelect;
    }

    @HostBinding("class.sample-type-ambiguous-matches") get classAmbiguousMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES;
    }
    @HostBinding("class.sample-type-matches") get classMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.MATCHES;
    }
    @HostBinding("class.sample-type-possible-matches") get classPossibleMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES;
    }
    @HostBinding("class.sample-type-possible-relations") get classPossibleRelations() {
      return this._statType === SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS;
    }
    @HostBinding("class.sample-type-disclosed-relations") get classDisclosedRelations() {
      return this._statType === SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS;
    }

    constructor(public dialogRef: MatDialogRef<SzCrossSourceSummaryMatchKeyPickerDialog>,
        @Inject(MAT_DIALOG_DATA) public data: {
        data: Array<SzCrossSourceCount>,
        statType: SzCrossSourceSummaryCategoryType
        }, private dataMartService: SzDataMartService, private prefs: SzPrefsService) {
      if(data) {
        if(data) {
          this._data        = data.data;
          this._statType    = data.statType;
          console.info(`SzCrossSourceSummaryMatchKeyPickerDialog: `, this._data);
        }
      }
    }

    /**
     * unsubscribe when component is destroyed
     * @internal
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * sets up initial service listeners etc
     * @internal
     */
    ngOnInit() {}
  }
