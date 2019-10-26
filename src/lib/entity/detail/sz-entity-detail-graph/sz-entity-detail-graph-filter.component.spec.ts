import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailGraphFilterComponent } from './sz-entity-detail-graph-filter.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailGraphFilterComponent', () => {
  let component: SzEntityDetailGraphFilterComponent;
  let fixture: ComponentFixture<SzEntityDetailGraphFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailGraphFilterComponent);
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

  it('graph should default to show link labels', () => {
    expect(component.showLinkLabels).toBeTruthy();
  });
});
