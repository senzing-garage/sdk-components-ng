import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
    selector: 'sz-alert-dialog',
    templateUrl: 'sz-alert-dialog.component.html',
    styleUrls: ['sz-alert-dialog.component.scss']
  })
  export class SzAlertMessageDialog {
    private _showOkButton = true;
    public title: string = 'Alert';
    public text: string;
    public buttonText: string = "Ok";

    public get showDialogActions(): boolean {
      return this._showOkButton;
    }
  
    constructor(@Inject(MAT_DIALOG_DATA) public data: { title?: string, text?: string, buttonText?: string, showButton?: boolean }) {
      if(data) {
        if(data.title) {
          this.title = data.title;
        }
        if(data.text) {
          this.text = data.text;
        }
        if(data.buttonText) {
          this.buttonText = data.buttonText;
        }
        if(data.showButton) {
          this._showOkButton = data.showButton;
        }
      }
    }
  }