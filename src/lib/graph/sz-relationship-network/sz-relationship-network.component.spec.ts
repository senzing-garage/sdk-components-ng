import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkComponent } from './sz-relationship-network.component';

describe('SzRelationshipNetworkComponent', () => {
  let component: SzRelationshipNetworkComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzRelationshipNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
