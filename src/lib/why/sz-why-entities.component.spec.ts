import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzWhyEntitiesComparisonComponent } from './sz-why-entities.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzPoweredByComponent', () => {
  let component: SzWhyEntitiesComparisonComponent;
  let fixture: ComponentFixture<SzWhyEntitiesComparisonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzWhyEntitiesComparisonComponent);
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
