import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailsSectionComponent } from './sz-entity-details-section.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailsSectionComponent', () => {
  let component: SzEntityDetailsSectionComponent;
  let fixture: ComponentFixture<SzEntityDetailsSectionComponent>;

  beforeEach(async(() => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
