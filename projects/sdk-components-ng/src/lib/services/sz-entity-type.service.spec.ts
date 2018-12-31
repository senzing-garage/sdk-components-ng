import { TestBed } from '@angular/core/testing';

import { SzEntityTypeService } from './sz-entity-type.service';

describe('SzEntityTypeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzEntityTypeService = TestBed.get(SzEntityTypeService);
    expect(service).toBeTruthy();
  });
});
