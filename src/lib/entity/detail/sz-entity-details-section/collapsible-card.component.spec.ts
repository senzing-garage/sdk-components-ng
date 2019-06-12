import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailSectionCollapsibleCardComponent } from './collapsible-card.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailSectionCollapsibleCardComponent', () => {
  let component: SzEntityDetailSectionCollapsibleCardComponent;
  let fixture: ComponentFixture<SzEntityDetailSectionCollapsibleCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailSectionCollapsibleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
