import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzConfigurationComponent } from './sz-configuration.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzConfigurationComponent', () => {
  let component: SzConfigurationComponent;
  let fixture: ComponentFixture<SzConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
