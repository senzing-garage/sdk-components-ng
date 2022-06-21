import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkInputComponent } from './sz-relationship-network-input.component';
import { SenzingSdkGraphModule } from 'src/lib/sdk-graph-components.module';

describe('SzRelationshipNetworkInputComponent', () => {
  let component: SzRelationshipNetworkInputComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipNetworkInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
