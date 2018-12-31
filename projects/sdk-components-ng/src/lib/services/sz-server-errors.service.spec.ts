import { TestBed } from '@angular/core/testing';

import { SzServerErrorsService } from './sz-server-errors.service';

describe('SzServerErrorsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzServerErrorsService = TestBed.get(SzServerErrorsService);
    expect(service).toBeTruthy();
  });
});
