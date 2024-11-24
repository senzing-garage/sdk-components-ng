import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultsComponent } from './sz-search-results.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';


describe('SzSearchResultsComponent', () => {
  let component: SzSearchResultsComponent;
  let fixture: ComponentFixture<SzSearchResultsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultsComponent);
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
