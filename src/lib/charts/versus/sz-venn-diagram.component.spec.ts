import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzVennDiagramsComponent } from './sz-venn-diagram.component';
import { SenzingSdkModule } from '../../sdk.module';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from 'src/lib/interceptors/mock-test-data.interceptor.service';

describe('SzVennDiagramsComponent', () => {
  let component: SzVennDiagramsComponent;
  let fixture: ComponentFixture<SzVennDiagramsComponent>;

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

    fixture = TestBed.createComponent(SzVennDiagramsComponent);
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
