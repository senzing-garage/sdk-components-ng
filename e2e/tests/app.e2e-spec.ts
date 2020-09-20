import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('@senzing/sdk-components-ng', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have app-root element', () => {
    page.navigateTo();
    expect(page.getAppRoot());
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
