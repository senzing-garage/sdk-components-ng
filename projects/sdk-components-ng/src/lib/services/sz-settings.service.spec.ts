import { TestBed } from '@angular/core/testing';

import { SzSettingsService } from './sz-settings.service';

describe('SzSettingsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzSettingsService = TestBed.get(SzSettingsService);
    expect(service).toBeTruthy();
  });
});
