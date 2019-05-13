import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailSectionHeaderComponent } from './header.component';

describe('SzEntityDetailSectionHeaderComponent', () => {
  let component: SzEntityDetailSectionHeaderComponent;
  let fixture: ComponentFixture<SzEntityDetailSectionHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityDetailSectionHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailSectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
