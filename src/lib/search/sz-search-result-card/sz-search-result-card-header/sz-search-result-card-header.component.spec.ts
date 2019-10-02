import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardHeaderComponent } from './sz-search-result-card-header.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
//
describe('SzSearchResultCardHeaderComponent', () => {
  let component: SzSearchResultCardHeaderComponent;
  let fixture: ComponentFixture<SzSearchResultCardHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultCardHeaderComponent);
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
