import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ng11LibComponent } from './ng11-lib.component';

describe('Ng11LibComponent', () => {
  let component: Ng11LibComponent;
  let fixture: ComponentFixture<Ng11LibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Ng11LibComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Ng11LibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
