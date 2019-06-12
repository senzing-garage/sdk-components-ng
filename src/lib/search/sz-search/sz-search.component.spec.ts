import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchComponent } from './sz-search.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';


describe('SzSearchComponent', () => {
  let component: SzSearchComponent;
  let fixture: ComponentFixture<SzSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
