import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardContentComponent } from './sz-entity-record-card-content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityRecordCardContentComponent', () => {
  let component: SzEntityRecordCardContentComponent;
  let fixture: ComponentFixture<SzEntityRecordCardContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardContentComponent);
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
