import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderComponent } from './header.component';

describe('SzEntityDetailHeaderComponent', () => {
  let component: SzEntityDetailHeaderComponent;
  let fixture: ComponentFixture<SzEntityDetailHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
