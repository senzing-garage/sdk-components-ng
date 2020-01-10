import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataLoadReportComponent } from './sz-bulk-data-load-report.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzBulkDataLoadReportComponent', () => {
  let component: SzBulkDataLoadReportComponent;
  let fixture: ComponentFixture<SzBulkDataLoadReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataLoadReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
