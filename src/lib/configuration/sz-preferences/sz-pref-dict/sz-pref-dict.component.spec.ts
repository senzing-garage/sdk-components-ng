import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPrefDictComponent } from './sz-pref-dict.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzConfigurationAboutComponent', () => {
  let component: SzPrefDictComponent;
  let fixture: ComponentFixture<SzPrefDictComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPrefDictComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
