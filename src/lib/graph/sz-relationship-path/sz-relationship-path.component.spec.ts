import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipPathComponent } from './sz-relationship-path.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzRelationshipPathComponent', () => {
  let component: SzRelationshipPathComponent;
  let fixture: ComponentFixture<SzRelationshipPathComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipPathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
