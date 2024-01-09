import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRecordStatsDonutChart } from './sz-donut.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzRecordStatsDonutChart', () => {
  let component: SzRecordStatsDonutChart;
  let fixture: ComponentFixture<SzRecordStatsDonutChart>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzRecordStatsDonutChart);
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
