import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardHeaderComponent } from './sz-entity-record-card-header.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityRecordCardHeaderComponent', () => {
  let component: SzEntityRecordCardHeaderComponent;
  let fixture: ComponentFixture<SzEntityRecordCardHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
