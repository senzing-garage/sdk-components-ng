
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

interface AttrData {
    attributeTypes: SzAttributeType[]
    selected: string[]
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

    public get allOptionsSelected(): boolean {
        return this._dataModel.every((attr: AttrRow) => {
            return attr.checked === true;
        });
    }
    public set allOptionsSelected(value: boolean) {
        console.log('SzSearchIdentifiersPickerDialogComponent.allOptionsSelected.set:', value);
        
        this._dataModel.forEach((attr: AttrRow) => {
            attr.checked = value;
        });
    }

    public get anyOptionsSelected(): boolean {
        return this._dataModel.some((attr: AttrRow) => {
            return attr.checked === true;
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
    }

    public attributeCodeAsText(attrCode: string) {
        if(attrCode && attrCode.replace) {
            return attrCode.replace(/_/g,' ');
        }
        return attrCode;
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
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: AttrData) {
        
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