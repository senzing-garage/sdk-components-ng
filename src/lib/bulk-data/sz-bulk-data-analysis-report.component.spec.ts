import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataAnalysisReportComponent } from './sz-bulk-data-analysis-report.component';
import { SenzingSdkModule } from './../../../src/lib/sdk.module';

describe('SzBulkDataAnalysisReportComponent', () => {
  let component: SzBulkDataAnalysisReportComponent;
  let fixture: ComponentFixture<SzBulkDataAnalysisReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
