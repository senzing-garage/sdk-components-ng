import { TestBed } from '@angular/core/testing';

import { SzMappingAttrService } from './sz-mapping-attr.service';

describe('SzMappingAttrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzMappingAttrService = TestBed.get(SzMappingAttrService);
    expect(service).toBeTruthy();
  });
});
