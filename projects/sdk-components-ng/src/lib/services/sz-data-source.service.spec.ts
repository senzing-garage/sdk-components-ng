import { TestBed } from '@angular/core/testing';

import { SzDataSourceService } from './sz-data-source.service';

describe('SzDataSourceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SzDataSourceService = TestBed.get(SzDataSourceService);
    expect(service).toBeTruthy();
  });
});
