import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkComponent } from './sz-relationship-network.component';
import { SenzingSdkGraphModule } from 'src/lib/sdk-graph-components.module';

describe('SzRelationshipNetworkComponent', () => {
  let component: SzRelationshipNetworkComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkGraphModule.forRoot()]
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
