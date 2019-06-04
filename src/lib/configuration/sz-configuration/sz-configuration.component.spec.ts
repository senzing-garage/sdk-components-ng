import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzConfigurationComponent } from './sz-configuration.component';

describe('SzConfigurationComponent', () => {
  let component: SzConfigurationComponent;
  let fixture: ComponentFixture<SzConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
