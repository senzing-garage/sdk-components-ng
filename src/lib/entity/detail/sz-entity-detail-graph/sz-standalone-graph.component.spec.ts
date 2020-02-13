import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzStandaloneGraphComponent } from './sz-standalone-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';

describe('SzStandaloneGraphComponent', () => {
  let component: SzStandaloneGraphComponent;
  let fixture: ComponentFixture<SzStandaloneGraphComponent>;

  /*
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();
  }));
  */

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzStandaloneGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
