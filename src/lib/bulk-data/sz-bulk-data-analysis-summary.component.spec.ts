import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataAnalysisSummaryComponent } from './sz-bulk-data-analysis-summary.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzBulkDataLoadSummaryComponent', () => {
  let component: SzBulkDataAnalysisSummaryComponent;
  let fixture: ComponentFixture<SzBulkDataAnalysisSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataAnalysisSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
