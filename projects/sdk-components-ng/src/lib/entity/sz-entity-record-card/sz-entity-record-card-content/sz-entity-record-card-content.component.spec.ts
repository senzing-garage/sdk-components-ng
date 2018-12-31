import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardContentComponent } from './sz-entity-record-card-content.component';

describe('SzEntityRecordCardContentComponent', () => {
  let component: SzEntityRecordCardContentComponent;
  let fixture: ComponentFixture<SzEntityRecordCardContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityRecordCardContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
