import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataLoadSummaryComponent } from './sz-bulk-data-load-summary.component';
import { SenzingSdkModule } from './../../../src/lib/sdk.module';

describe('SzBulkDataLoadSummaryComponent', () => {
  let component: SzBulkDataLoadSummaryComponent;
  let fixture: ComponentFixture<SzBulkDataLoadSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataLoadSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
