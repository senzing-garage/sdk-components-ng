import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzConfigurationAboutComponent } from './sz-configuration-about.component';

describe('SzConfigurationAboutComponent', () => {
  let component: SzConfigurationAboutComponent;
  let fixture: ComponentFixture<SzConfigurationAboutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzConfigurationAboutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzConfigurationAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
