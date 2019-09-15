import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardComponent } from './sz-search-result-card.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SearchResultCardComponent', () => {
  let component: SzSearchResultCardComponent;
  let fixture: ComponentFixture<SzSearchResultCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultCardComponent);
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
