import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphFilterComponent } from './sz-graph-filter.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzGraphFilterComponent', () => {
  let component: SzGraphFilterComponent;
  let fixture: ComponentFixture<SzGraphFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzGraphFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to open', () => {
    expect(component.isOpen).toBeTruthy();
  });
  // labels hidden by default
  it('graph should default to show link labels', () => {
    expect(component.showLinkLabels).toBeTruthy();
  });
});
