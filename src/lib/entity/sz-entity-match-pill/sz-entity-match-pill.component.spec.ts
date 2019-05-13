import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityMatchPillComponent } from './sz-entity-match-pill.component';

describe('SzEntityMatchPillComponent', () => {
  let component: SzEntityMatchPillComponent;
  let fixture: ComponentFixture<SzEntityMatchPillComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityMatchPillComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityMatchPillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
