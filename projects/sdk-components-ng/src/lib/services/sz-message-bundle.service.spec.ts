import { TestBed } from '@angular/core/testing';

import { SzMessageBundleService } from './sz-message-bundle.service';

describe('SzMessageBundleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzMessageBundleService = TestBed.get(SzMessageBundleService);
    expect(service).toBeTruthy();
  });
});
