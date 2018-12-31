import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchResultCardHeaderComponent } from './sz-search-result-card-header.component';

describe('SzSearchResultCardHeaderComponent', () => {
  let component: SzSearchResultCardHeaderComponent;
  let fixture: ComponentFixture<SzSearchResultCardHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SzSearchResultCardHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchResultCardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
