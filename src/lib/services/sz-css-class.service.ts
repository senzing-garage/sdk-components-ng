import { Injectable } from '@angular/core';

/**
 * A service that provides the capability to "dynamically" add CSS
 * classes to the head of the document or app
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzCSSClassService {
  private _headElement: HTMLHeadElement;
  private _styleSheetTitle: string = 'senzing-dyn-css-classing';
  private _styleSheet: CSSStyleSheet;

  private get headElement(): HTMLHeadElement {
    if(!this._headElement && document.getElementsByTagName("head").length > 0) {
      this._headElement = document.getElementsByTagName("head")[0];
    }
    return this._headElement;
  }

  private get styleSheet(): CSSStyleSheet {
    if(!this._styleSheet) {
      if(!document.styleSheets || this.headElement === null) return null;

      // get stylesheet that matches the "_styleSheetTitle" value
      this._styleSheet = Array.from(document.styleSheets)
      .find(s => s.title === this._styleSheetTitle);

      if(!this._styleSheet) {
        console.warn('initialized dyn css block');
        this._styleSheet = this.initCssBlock();
      }
    }

    return this._styleSheet;
  }

  constructor() {}

  /** initialize the dyn classing block */
  private initCssBlock(): CSSStyleSheet {
    // Create the style sheet element.
    let cssEle = document.createElement("style");
    cssEle.type   = "text/css";
    cssEle.title  = this._styleSheetTitle;

    // Append the style sheet element to the head.
    this.headElement.appendChild(cssEle);
    return cssEle.sheet as CSSStyleSheet;
  }

  public setStyle(selectorText: string, styleName: string, value: string): void {
    let rules: CSSRuleList = this.styleSheet.cssRules.length > 0 || this.styleSheet.rules.length == 0 ? this.styleSheet.cssRules : this.styleSheet.rules;
    let ruleIndex: number  = Array.from(rules).findIndex(r => r instanceof CSSStyleRule && r.selectorText.toLowerCase() == selectorText.toLowerCase());
    let rule: CSSStyleRule = Array.from(rules)[ruleIndex] as CSSStyleRule;

    if(!styleName || !value){ return; }

    if(!rule){ 
      // create 
      let newRuleIndex = this.styleSheet.insertRule(selectorText + `{ ${styleName}: ${value}}`, rules.length);
      return; 
    } else {
      this.styleSheet.deleteRule(ruleIndex);
      this.styleSheet.insertRule(selectorText + `{ ${styleName}: ${value}}`, rules.length);
    }
  }
}