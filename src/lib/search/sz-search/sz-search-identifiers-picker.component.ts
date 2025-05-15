
import { Component, HostBinding, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

import { SzAttributeType } from '@senzing/rest-api-client-ng';

/** @internal */
interface AttrRow extends SzAttributeType {
    checked: boolean;
}
/** @internal */
interface AttrData {
    attributeTypes: SzAttributeType[]
    selected: string[]
}

/**
 * Provides a component that allows the user to select what "Identity Types" are displayed
 * in the search form. Uses Angular Material "Dialog" to load in to view.
 *
 * @example 
 * // (Angular) SzSearchIdentifiersPickerDialogComponent
 * const dialogRef = this.dialog.open(SzSearchIdentifiersPickerDialogComponent, {
 *       width: '375px',
 *       height: '50vh',
 *       data: {
 *         attributeTypes: this._attributeTypesFromServer,
 *         selected: this.allowedTypeAttributes
 *       }
 * });
 * 
 * @export
 */
@Component({
    selector: 'sz-search-identifiers-picker-dialog',
    templateUrl: './sz-search-identifiers-picker.component.html',
    styleUrls: ['./sz-search-identifiers-picker.component.scss'],
    standalone: false
})
export class SzSearchIdentifiersPickerDialogComponent {
    protected _dataModel: AttrRow[];
    public showButtons: boolean = true;

    /** 
     * get an array of selected attributes from the list
     * @returns AttrRow[]
     */
    public get checkedAttributeTypes() {
        return this._dataModel.filter((attrValue: AttrRow) => {
            return (attrValue && attrValue.checked);
        });
    }
    /**
     * are all attributes selected in the list
     */
    public get allOptionsSelected(): boolean {
        return this._dataModel.every((attr: AttrRow) => {
            return attr.checked === true;
        });
    }
    /**
     * select or deselect all available attrs in the list
     */
    public set allOptionsSelected(value: boolean) {        
        this._dataModel.forEach((attr: AttrRow) => {
            attr.checked = value;
        });
    }
    /**
     * Are any attribute options selected in the list
     */
    public get anyOptionsSelected(): boolean {
        return this._dataModel.some((attr: AttrRow) => {
            return attr.checked === true;
        });
    }

    constructor(
        public dialogRef?: MatDialogRef<SzSearchIdentifiersPickerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data?: AttrData) {
        
        if(this.data) {
            this._dataModel = this.extendInputData(this.data.attributeTypes, this.data.selected).sort((a: AttrRow, b: AttrRow) => {
                if (a.attributeCode < b.attributeCode) 
                    return -1; 
                if (a.attributeCode > b.attributeCode) 
                    return 1; 
                return 0; 
            });
        }
    }

    /**
     * used for taking a plain list of SzAttributeType[] and converting it to 
     * a type of AttrRow[] which can hold checkbox state as well as SzAttributeType properties.
     * @param value SzAttributeType[]
     * @param selected array of attributeCode strings that are selected
     */
    protected extendInputData(value: SzAttributeType[], selected: string[]) {
        //console.log('extendInputData: ', value, selected);
        let retVal: Array<AttrRow> = [];
        if(value && value.map) {
            retVal = value.map( (attrObj: SzAttributeType) => {
                return Object.assign({checked: (attrObj.attributeCode && selected.indexOf(attrObj.attributeCode) > -1) }, attrObj);
            });
        }
        return retVal;
    }

    /** when the user clicks the Cancel button */
    onNoClick(): void {
        if(this.dialogRef && this.dialogRef.close){
            this.dialogRef.close();
        }
    }
    /**
     * when the user clicks the Apply button
     */
    onApplyClick(): void {
        if(this.dialogRef && this.dialogRef.close){
            this.dialogRef.close(this.checkedAttributeTypes);
        }
    }
    /*
    onToggleAllSelectedClick(event: Event) {
        if(this.anyOptionsSelected) {
            this._dataModel.forEach((attr: AttrRow) => {
                attr.checked = false;
            });
        } else {
            this._dataModel.forEach((attr: AttrRow) => {
                attr.checked = true;
            });
        }
    }*/

    /** takes an attributeCode string and applies formatting */
    public attributeCodeAsText(attrCode: string) {
        if(attrCode && attrCode.replace) {
            return attrCode.replace(/_/g,' ');
        }
        return attrCode;
    }
    /** get the current attribute list ordered alphabetically*/
    public get orderedData(): AttrRow[] {
        return this._dataModel;
    }

}

/**
 * Provides a component that allows the user to select what "Identity Types" are displayed
 * in the search form. Uses Angular Material "Bottom Sheet" to load in to view.
 *
 * @example 
 * // (Angular) SzSearchIdentifiersPickerSheetComponent
 *   const bottomSheetRef = this.bottomSheet.open(SzSearchIdentifiersPickerSheetComponent, {
 *       ariaLabel: 'Identifier Types',
 *       panelClass: ['sz-search-identifiers-picker-sheet'],
 *       backdropClass: 'sz-search-identifiers-picker-sheet-backdrop',
 *       hasBackdrop: false,
 *       data: {
 *         attributeTypes: this._attributeTypesFromServer,
 *         selected: this.allowedTypeAttributes
 *       }
 * });
 * 
 * @export
 * @extends SzSearchIdentifiersPickerDialogComponent
 */
@Component({
    selector: 'sz-search-identifiers-picker-sheet',
    templateUrl: './sz-search-identifiers-picker.component.html',
    styleUrls: ['./sz-search-identifiers-picker.component.scss'],
    standalone: false
})
export class SzSearchIdentifiersPickerSheetComponent extends SzSearchIdentifiersPickerDialogComponent {
    @HostBinding('class.isMatSheet') true;

    constructor(
        public sheetRef: MatBottomSheetRef<SzSearchIdentifiersPickerSheetComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public override data: AttrData) {
        
        super();

        if(this.data) {
            this._dataModel = this.extendInputData(this.data.attributeTypes, this.data.selected).sort((a: AttrRow, b: AttrRow) => {
                if (a.attributeCode < b.attributeCode) 
                    return -1; 
                if (a.attributeCode > b.attributeCode) 
                    return 1; 
                return 0; 
            });
        }
    }
    /** when the user clicks the Cancel button */
    override onNoClick(): void { 
        if(this.sheetRef && this.sheetRef.dismiss){
            this.sheetRef.dismiss();
        }
    }
    /**
     * when the user clicks the Apply button
     */
    override onApplyClick(): void {
        if(this.sheetRef && this.sheetRef.dismiss){
            this.sheetRef.dismiss(this.checkedAttributeTypes);
        }
    }
}