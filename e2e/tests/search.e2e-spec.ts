import { SearchBox } from './search.po';
import { browser, until, by, $$, $ } from 'protractor';

describe('@senzing/sdk-components-ng/sz-search tests', () => {
  let page: SearchBox;

  beforeEach(() => {
    page = new SearchBox();
  });

  it('should have search box', () => {
    page.navigateTo();
    expect(page.getSearchComponent().isPresent()).toBeTruthy();
  });

  it('should be able to search by name', () => {
    page.setSearchInputName('Jenny Smith');
    expect(page.getSearchInputNameValue()).toBe('Jenny Smith');
  });

  it('should have SSN in identifier pulldown', () => {
    expect(page.existsSearchIdentifierOptionByValue('SSN_NUMBER')).toBeTruthy();
  });

  it('submit button should be clickable', () => {
    expect(page.getSearchButtonSubmit().isEnabled).toBeTruthy();
  });

  /*
  it('should have search results', () => {
    page.clickSearchButtonSubmit();
    browser.sleep(60000);
    expect( $$('sz-search-result-card').count() ).toBeGreaterThan(0);
  });*/

});
