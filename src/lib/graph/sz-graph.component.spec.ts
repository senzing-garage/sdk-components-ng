import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphComponent } from './sz-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzGraphComponent', () => {
  let component: SzGraphComponent;
  let fixture: ComponentFixture<SzGraphComponent>;

  /*
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();
  }));
  */

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
