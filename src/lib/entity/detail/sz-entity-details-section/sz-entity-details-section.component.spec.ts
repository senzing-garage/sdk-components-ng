import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailsSectionComponent } from './sz-entity-details-section.component';

describe('SzEntityDetailsSectionComponent', () => {
  let component: SzEntityDetailsSectionComponent;
  let fixture: ComponentFixture<SzEntityDetailsSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailsSectionComponent ]
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
