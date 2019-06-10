import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkComponent } from './sz-relationship-network.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzRelationshipNetworkComponent', () => {
  let component: SzRelationshipNetworkComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
