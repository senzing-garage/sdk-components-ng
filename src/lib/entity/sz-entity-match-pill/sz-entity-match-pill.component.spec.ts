import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityMatchPillComponent } from './sz-entity-match-pill.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityMatchPillComponent', () => {
  let component: SzEntityMatchPillComponent;
  let fixture: ComponentFixture<SzEntityMatchPillComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityMatchPillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
