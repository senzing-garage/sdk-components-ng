import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzCrossSourceSummaryComponent } from './sz-cross-source-summary.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzRecordStatsDonutChart', () => {
  let component: SzCrossSourceSummaryComponent;
  let fixture: ComponentFixture<SzCrossSourceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzCrossSourceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    // test fails on CI only (issue #75)
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
