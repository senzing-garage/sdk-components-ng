import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzOldEntityDetailGraphComponent } from './sz-entity-detail-graph.component.old';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';

describe('SzOldEntityDetailGraphComponent', () => {
  let component: SzOldEntityDetailGraphComponent;
  let fixture: ComponentFixture<SzOldEntityDetailGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot() ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzOldEntityDetailGraphComponent);
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
