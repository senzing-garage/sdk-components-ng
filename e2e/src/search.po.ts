import { browser, by, element, $, $$ } from 'protractor';

export class SearchBox {
  navigateTo() {
    return browser.get('/');
  }

  getAppRoot() {
    return element(by.css('app-root'));
  }

  getSearchComponent() {
    return element(by.tagName('sz-search'));
  }

  getSearchButtonSubmit() {
    return this.getSearchComponent().$('.button__search-go');
  }

  clickSearchButtonSubmit() {
    return this.getSearchButtonSubmit().click();
  }

  getSearchInputName() {
    return this.getSearchComponent().$('#entity-name');
  }

  setSearchInputName(value: string) {
    this.getSearchInputName().click();
    this.getSearchInputName().sendKeys(value);
  }

  getSearchInputNameValue() {
    return this.getSearchInputName().getAttribute('value');
  }

  getSearchInputIdentifier() {
    return this.getSearchComponent().$('select.identifier-dropdown');
  }

  getSearchIdentifierOptionByValue(value: string) {
    return this.getSearchInputIdentifier().$('[value="' + value + '"]');
  }

  getSearchIdentifierOptionByTextSelector(value: string) {
    return `select.identifier-dropdown option[text=${value}]`;
  }

  getSearchIdentifierOptionByText(value: string) {
    return this.getSearchInputIdentifier().$('[text="' + value + '"]');
  }

  existsSearchIdentifierOptionByText(value: string) {
    return this.getSearchInputIdentifier().$(`option[text=${value}]`).isPresent();
  }

  existsSearchIdentifierOptionByValue(value: string) {
    return this.getSearchInputIdentifier().$(`option[value=${value}]`).isPresent();
  }
}
