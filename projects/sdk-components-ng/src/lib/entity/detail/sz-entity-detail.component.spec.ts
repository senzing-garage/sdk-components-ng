import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailComponent } from './sz-entity-detail.component';

describe('SzEntityDetailComponent', () => {
  let component: SzEntityDetailComponent;
  let fixture: ComponentFixture<SzEntityDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
