import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipPathComponent } from './sz-relationship-path.component';
import { SenzingSdkGraphModule } from 'src/lib/sdk-graph-components.module';

describe('SzRelationshipPathComponent', () => {
  let component: SzRelationshipPathComponent;
  let fixture: ComponentFixture<SzRelationshipPathComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkGraphModule.forRoot()]
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
