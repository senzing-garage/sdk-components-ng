import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from '../../interceptors/mock-test-data.interceptor.service';

import { SzCrossSourceStatistics } from './sz-cross-source-statistics.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzCrossSourceStatistics', () => {
  let component: SzCrossSourceStatistics;
  let fixture: ComponentFixture<SzCrossSourceStatistics>;

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

    fixture = TestBed.createComponent(SzCrossSourceStatistics);
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
