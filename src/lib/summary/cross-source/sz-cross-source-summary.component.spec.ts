import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from '../../interceptors/mock-test-data.interceptor.service';

import { SzCrossSourceSummaryComponent } from './sz-cross-source-summary.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzCrossSourceSummaryComponent', () => {
  let component: SzCrossSourceSummaryComponent;
  let fixture: ComponentFixture<SzCrossSourceSummaryComponent>;

  beforeEach(async(() => {
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
