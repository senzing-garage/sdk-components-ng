import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailGraphControlComponent } from './sz-entity-detail-graph-control.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailGraphControlComponent', () => {
  let component: SzEntityDetailGraphControlComponent;
  let fixture: ComponentFixture<SzEntityDetailGraphControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailGraphControlComponent);
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
