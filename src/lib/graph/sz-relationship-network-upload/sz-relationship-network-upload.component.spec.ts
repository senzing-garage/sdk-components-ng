import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkUploadComponent } from './sz-relationship-network-upload.component';

describe('SzRelationshipNetworkUploadComponent', () => {
  let component: SzRelationshipNetworkUploadComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzRelationshipNetworkUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipNetworkUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
