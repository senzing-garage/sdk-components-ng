import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailGraphComponent } from './sz-entity-detail-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailGraphComponent', () => {
  let component: SzEntityDetailGraphComponent;
  let fixture: ComponentFixture<SzEntityDetailGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
