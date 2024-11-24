import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderContentComponent } from './content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailHeaderContentComponent', () => {
  let component: SzEntityDetailHeaderContentComponent;
  let fixture: ComponentFixture<SzEntityDetailHeaderContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    // test fails on CI only (issue #75)
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
