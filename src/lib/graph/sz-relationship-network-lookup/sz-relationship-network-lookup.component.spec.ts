import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkLookupComponent } from './sz-relationship-network-lookup.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzRelationshipNetworkLookupComponent', () => {
  let component: SzRelationshipNetworkLookupComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
