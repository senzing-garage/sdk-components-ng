import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchComponent } from './sz-search.component';

describe('SzSearchComponent', () => {
  let component: SzSearchComponent;
  let fixture: ComponentFixture<SzSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
