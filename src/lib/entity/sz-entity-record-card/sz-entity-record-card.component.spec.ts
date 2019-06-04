import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardComponent } from './sz-entity-record-card.component';

describe('SzEntityRecordCardComponent', () => {
  let component: SzEntityRecordCardComponent;
  let fixture: ComponentFixture<SzEntityRecordCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzEntityRecordCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
