import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardContentComponent } from './sz-search-result-card-content.component';

describe('SzSearchResultCardContentComponent', () => {
  let component: SzSearchResultCardContentComponent;
  let fixture: ComponentFixture<SzSearchResultCardContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzSearchResultCardContentComponent ]
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
