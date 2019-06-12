import { TestBed } from '@angular/core/testing';

import { SzSearchService } from './sz-search.service';
import { SenzingSdkModule } from 'src/lib/sdk.module';
//
describe('SzSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [SenzingSdkModule.forRoot()]
  }));

  it('should be created', () => {
    const service: SzSearchService = TestBed.get(SzSearchService);
    expect(service).toBeTruthy();
  });
});
