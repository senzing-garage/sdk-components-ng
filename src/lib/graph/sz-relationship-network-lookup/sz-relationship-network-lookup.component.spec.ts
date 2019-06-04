import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkLookupComponent } from './sz-relationship-network-lookup.component';

describe('SzRelationshipNetworkLookupComponent', () => {
  let component: SzRelationshipNetworkLookupComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzRelationshipNetworkLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipNetworkLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
