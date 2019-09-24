import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardComponent } from './sz-entity-record-card.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityRecordCardComponent', () => {
  let component: SzEntityRecordCardComponent;
  let fixture: ComponentFixture<SzEntityRecordCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
