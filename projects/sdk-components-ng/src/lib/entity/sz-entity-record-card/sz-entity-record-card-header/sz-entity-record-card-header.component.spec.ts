import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardHeaderComponent } from './sz-entity-record-card-header.component';

describe('SzEntityRecordCardHeaderComponent', () => {
  let component: SzEntityRecordCardHeaderComponent;
  let fixture: ComponentFixture<SzEntityRecordCardHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityRecordCardHeaderComponent ]
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
