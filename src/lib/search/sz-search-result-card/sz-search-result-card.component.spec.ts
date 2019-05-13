import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardComponent } from './sz-search-result-card.component';

describe('SearchResultCardComponent', () => {
  let component: SzSearchResultCardComponent;
  let fixture: ComponentFixture<SzSearchResultCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzSearchResultCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
