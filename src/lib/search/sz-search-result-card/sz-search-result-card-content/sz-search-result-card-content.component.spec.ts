import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardContentComponent } from './sz-search-result-card-content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzSearchResultCardContentComponent', () => {
  let component: SzSearchResultCardContentComponent;
  let fixture: ComponentFixture<SzSearchResultCardContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultCardContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
