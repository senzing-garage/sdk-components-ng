import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataAnalysisComponent } from './sz-bulk-data-analysis.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzBulkDataAnalysisComponent', () => {
  let component: SzBulkDataAnalysisComponent;
  let fixture: ComponentFixture<SzBulkDataAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
