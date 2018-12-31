import { TestBed } from '@angular/core/testing';

import { SzMappingTemplateService } from './sz-mapping-template.service';

describe('SzMappingTemplateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzMappingTemplateService = TestBed.get(SzMappingTemplateService);
    expect(service).toBeTruthy();
  });
});
