import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderContentComponent } from './sz-entity-detail-header-content.component';

describe('SzEntityDetailHeaderContentComponent', () => {
  let component: SzEntityDetailHeaderContentComponent;
  let fixture: ComponentFixture<SzEntityDetailHeaderContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailHeaderContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailHeaderContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
