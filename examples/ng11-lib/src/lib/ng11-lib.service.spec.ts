import { TestBed } from '@angular/core/testing';

import { Ng11LibService } from './ng11-lib.service';

describe('Ng11LibService', () => {
  let service: Ng11LibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ng11LibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
