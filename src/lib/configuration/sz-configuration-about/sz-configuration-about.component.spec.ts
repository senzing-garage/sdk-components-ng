import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzConfigurationAboutComponent } from './sz-configuration-about.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzConfigurationAboutComponent', () => {
  let component: SzConfigurationAboutComponent;
  let fixture: ComponentFixture<SzConfigurationAboutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
