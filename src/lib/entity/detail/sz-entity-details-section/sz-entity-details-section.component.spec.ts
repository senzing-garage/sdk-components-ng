import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailsSectionComponent } from './sz-entity-details-section.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailsSectionComponent', () => {
  let component: SzEntityDetailsSectionComponent;
  let fixture: ComponentFixture<SzEntityDetailsSectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailsSectionComponent);
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
