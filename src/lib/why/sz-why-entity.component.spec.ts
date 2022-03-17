import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzWhyEntityComponent } from './sz-why-entity.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzPoweredByComponent', () => {
  let component: SzWhyEntityComponent;
  let fixture: ComponentFixture<SzWhyEntityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzWhyEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
