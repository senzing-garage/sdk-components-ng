import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPreferencesComponent } from './sz-preferences.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzPreferencesComponent', () => {
  let component: SzPreferencesComponent;
  let fixture: ComponentFixture<SzPreferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
