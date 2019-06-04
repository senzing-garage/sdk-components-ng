import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPoweredByComponent } from './sz-powered-by.component';

describe('SzPoweredByComponent', () => {
  let component: SzPoweredByComponent;
  let fixture: ComponentFixture<SzPoweredByComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzPoweredByComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPoweredByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
