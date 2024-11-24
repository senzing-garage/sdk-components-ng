import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRecordStatsDonutChart } from './sz-donut.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from 'src/lib/interceptors/mock-test-data.interceptor.service';

describe('SzRecordStatsDonutChart', () => {
  let component: SzRecordStatsDonutChart;
  let fixture: ComponentFixture<SzRecordStatsDonutChart>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockTestDataInterceptor,
          multi: true
        }
       ]    
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
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
