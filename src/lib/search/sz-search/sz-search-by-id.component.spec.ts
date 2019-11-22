import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchByIdComponent } from './sz-search-by-id.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';


describe('SzSearchByIdComponent', () => {
  let component: SzSearchByIdComponent;
  let fixture: ComponentFixture<SzSearchByIdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchByIdComponent);
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
