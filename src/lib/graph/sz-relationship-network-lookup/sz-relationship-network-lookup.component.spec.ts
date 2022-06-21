import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkLookupComponent } from './sz-relationship-network-lookup.component';
import { SenzingSdkGraphModule } from 'src/lib/sdk-graph-components.module';

describe('SzRelationshipNetworkLookupComponent', () => {
  let component: SzRelationshipNetworkLookupComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkGraphModule.forRoot()]
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
