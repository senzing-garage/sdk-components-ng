import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderContentComponent } from './content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailHeaderContentComponent', () => {
  let component: SzEntityDetailHeaderContentComponent;
  let fixture: ComponentFixture<SzEntityDetailHeaderContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
