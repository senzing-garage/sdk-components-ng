import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkUploadComponent } from './sz-relationship-network-upload.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzRelationshipNetworkUploadComponent', () => {
  let component: SzRelationshipNetworkUploadComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
