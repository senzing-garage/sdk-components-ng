
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
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
    private _dataModel: AttrRow[];

    constructor(
        public dialogRef: MatDialogRef<SzSearchIdentifiersPickerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            attributeTypes: SzAttributeType[]
            selected: string[]
        }) {

        this._dataModel = this.extendInputData(this.data.attributeTypes, this.data.selected).sort((a: AttrRow, b: AttrRow) => {
            if (a.attributeCode < b.attributeCode) 
                return -1; 
            if (a.attributeCode > b.attributeCode) 
                return 1; 
            return 0; 
        });
    }

    private extendInputData(value: SzAttributeType[], selected: string[]) {
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
        this.dialogRef.close();
    }

    public attributeCodeAsText(value: string) {
        return value;
    }

    public get orderedData(): SzAttributeType[] {
        return this._dataModel;
    }

}
  