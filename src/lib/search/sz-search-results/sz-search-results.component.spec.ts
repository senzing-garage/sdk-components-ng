import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultsComponent } from './sz-search-results.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';


describe('SzSearchResultsComponent', () => {
  let component: SzSearchResultsComponent;
  let fixture: ComponentFixture<SzSearchResultsComponent>;

  beforeEach(async(() => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
