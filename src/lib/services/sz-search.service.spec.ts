import { TestBed } from '@angular/core/testing';

import { SzSearchService } from './sz-search.service';

describe('SzSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzSearchService = TestBed.get(SzSearchService);
    expect(service).toBeTruthy();
  });
});
