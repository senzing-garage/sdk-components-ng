import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphComponent } from './sz-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';

describe('SzGraphComponent', () => {
  let component: SzGraphComponent;
  let fixture: ComponentFixture<SzGraphComponent>;

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

    fixture = TestBed.createComponent(SzGraphComponent);
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
