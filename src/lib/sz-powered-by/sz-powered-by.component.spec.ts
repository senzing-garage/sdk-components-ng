import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPoweredByComponent } from './sz-powered-by.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzPoweredByComponent', () => {
  let component: SzPoweredByComponent;
  let fixture: ComponentFixture<SzPoweredByComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPoweredByComponent);
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
