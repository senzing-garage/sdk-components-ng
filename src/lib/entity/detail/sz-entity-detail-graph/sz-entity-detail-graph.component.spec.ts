import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailGraphComponent } from './sz-entity-detail-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';

describe('SzEntityDetailGraphComponent', () => {
  let component: SzEntityDetailGraphComponent;
  let fixture: ComponentFixture<SzEntityDetailGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot() ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailGraphComponent);
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
