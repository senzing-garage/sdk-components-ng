import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailSectionCollapsibleCardComponent } from './sz-entity-detail-section-collapsible-card.component';

describe('SzEntityDetailSectionCollapsibleCardComponent', () => {
  let component: SzEntityDetailSectionCollapsibleCardComponent;
  let fixture: ComponentFixture<SzEntityDetailSectionCollapsibleCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailSectionCollapsibleCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailSectionCollapsibleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
