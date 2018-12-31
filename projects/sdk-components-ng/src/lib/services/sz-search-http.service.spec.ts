import { TestBed } from '@angular/core/testing';

import { SzSearchHttpService } from './sz-search-http.service';

describe('SzSearchHttpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzSearchHttpService = TestBed.get(SzSearchHttpService);
    expect(service).toBeTruthy();
  });
});
