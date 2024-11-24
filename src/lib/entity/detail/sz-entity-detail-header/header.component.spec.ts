import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderComponent } from './header.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailHeaderComponent', () => {
  let component: SzEntityDetailHeaderComponent;
  let fixture: ComponentFixture<SzEntityDetailHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
