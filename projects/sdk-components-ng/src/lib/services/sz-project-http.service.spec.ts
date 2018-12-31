import { TestBed } from '@angular/core/testing';

import { SzProjectHttpService } from './sz-project-http.service';

describe('SzProjectHttpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzProjectHttpService = TestBed.get(SzProjectHttpService);
    expect(service).toBeTruthy();
  });
});
