import { Injectable } from '@angular/core';

/**
 * A service that provides the capability to "dynamically" add CSS
 * classes to the head of the document or app. Also can dynamically set css vars 
 * on the document body.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzCSSClassService {
  private _headElement: HTMLHeadElement;
  private _bodyElement: HTMLBodyElement;
  private _styleSheetTitle: string = 'senzing-dyn-css-classing';
  private _styleSheet: CSSStyleSheet;

  /** get head element
   * @internal
   */
  private get headElement(): HTMLHeadElement {
    if(!this._headElement && document.getElementsByTagName("head").length > 0) {
      this._headElement = document.getElementsByTagName("head")[0];
    }
    return this._headElement;
  }
  /** get body element 
   * @internal
  */
  private get bodyElement(): HTMLBodyElement {
    if(!this._bodyElement && document.getElementsByTagName("body").length > 0) {
      this._bodyElement = document.getElementsByTagName("body")[0];
    }
    return this._bodyElement;
  }
  /** get the existing styleshee
   * @internal
   */
  private get styleSheet(): CSSStyleSheet {
    if(!this._styleSheet) {
      if(!document.styleSheets || this.headElement === null) return null;

      // get stylesheet that matches the "_styleSheetTitle" value
      this._styleSheet = Array.from(document.styleSheets)
      .find(s => s.title === this._styleSheetTitle);

      if(!this._styleSheet) {
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
    cssEle.title  = this._styleSheetTitle;

    // Append the style sheet element to the head.
    this.headElement.appendChild(cssEle);
    return cssEle.sheet as CSSStyleSheet;
  }
  /** dynamically set/create a css class and it's values */
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
      if(ruleIndex >= 0) { 
        this.styleSheet.deleteRule(ruleIndex);
      }
      this.styleSheet.insertRule(selectorText + `{ ${styleName}: ${value}}`, rules.length);
    }
  }
  /** dynamically remove a css class by selector and  */
  public removeStyle(selectorText: string, styleName?: string) {
    if(!this.styleSheet){ return; }
    let rules: CSSRuleList = this.styleSheet.cssRules.length > 0 || this.styleSheet.rules.length == 0 ? this.styleSheet.cssRules : this.styleSheet.rules;
    let ruleIndex: number  = Array.from(rules).findIndex(r => r instanceof CSSStyleRule && r.selectorText.toLowerCase() == selectorText.toLowerCase());
    if(ruleIndex >= 0){ 
      //try{
        if(!styleName) {
          this.styleSheet.deleteRule(ruleIndex);
        } else {
          (this.styleSheet.cssRules[ruleIndex] as CSSStyleRule).style.removeProperty(styleName);
        }
      //} catch(err) {}
    }
  }
  /** dynamically set a css variable on the body element */
  public setVariable(variableName: string, value: string) {
    if(this.bodyElement && this.bodyElement.style && this.bodyElement.style.setProperty) {
      this.bodyElement.style.setProperty(variableName, value);
    }
  }
}