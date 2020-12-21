
import { Component, HostBinding, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

import { SzAttributeType } from '@senzing/rest-api-client-ng';
import { retry } from 'rxjs/operators';

/** @internal */
export interface DialogData {
    animal: string;
    name: string;
}

interface AttrRow extends SzAttributeType {
    checked: boolean;
}
  
@Component({
selector: 'sz-search-identifiers-picker-dialog',
templateUrl: './sz-search-identifiers-picker.component.html',
styleUrls: ['./sz-search-identifiers-picker.component.scss']
})
export class SzSearchIdentifiersPickerDialogComponent {
    protected _dataModel: AttrRow[];
    public showButtons: boolean = true;
    constructor(
        public dialogRef?: MatDialogRef<SzSearchIdentifiersPickerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data?: {
            attributeTypes: SzAttributeType[]
            selected: string[]
        }) {
        
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

    protected extendInputData(value: SzAttributeType[], selected: string[]) {
        console.log('extendInputData: ', value, selected);
        let retVal: Array<AttrRow> = [];
        if(value && value.map) {
            retVal = value.map( (attrObj: SzAttributeType) => {
                return Object.assign({checked: (attrObj.attributeCode && selected.indexOf(attrObj.attributeCode) > -1) }, attrObj);
            });
        }
        return retVal;
    }

    public get checkedAttributeTypes() {
        return this._dataModel.filter((attrValue: AttrRow) => {
            return (attrValue && attrValue.checked);
        });
    }

    onNoClick(): void {
        console.log('SzSearchIdentifiersPickerDialogComponent.onNoClick');

        if(this.dialogRef && this.dialogRef.close){
            this.dialogRef.close();
        }
    }

    onApplyClick(): void {
        if(this.dialogRef && this.dialogRef.close){
            console.log('SzSearchIdentifiersPickerDialogComponent.onApplyClick');
            this.dialogRef.close(this.checkedAttributeTypes);
        }
    }

    public attributeCodeAsText(value: string) {
        return value;
    }

    public get orderedData(): SzAttributeType[] {
        return this._dataModel;
    }

}

@Component({
    selector: 'sz-search-identifiers-picker-sheet',
    templateUrl: './sz-search-identifiers-picker.component.html',
    styleUrls: ['./sz-search-identifiers-picker.component.scss']
})
export class SzSearchIdentifiersPickerSheetComponent extends SzSearchIdentifiersPickerDialogComponent {
    @HostBinding('class.isMatSheet') true;

    constructor(
        public sheetRef: MatBottomSheetRef<SzSearchIdentifiersPickerSheetComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
            attributeTypes: SzAttributeType[]
            selected: string[]
        }) {
        
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

    onNoClick(): void { 
        if(this.sheetRef && this.sheetRef.dismiss){
            console.log('SzSearchIdentifiersPickerSheetComponent.onNoClick');
            this.sheetRef.dismiss();
        }
    }

    onApplyClick(): void {
        if(this.sheetRef && this.sheetRef.dismiss){
            console.log('SzSearchIdentifiersPickerSheetComponent.onApplyClick');
            this.sheetRef.dismiss(this.checkedAttributeTypes);
        }
    }
}