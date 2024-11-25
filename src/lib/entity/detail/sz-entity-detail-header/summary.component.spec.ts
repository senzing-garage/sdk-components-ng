import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailSectionSummaryComponent } from './summary.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailSectionSummaryComponent', () => {
  let component: SzEntityDetailSectionSummaryComponent;
  let fixture: ComponentFixture<SzEntityDetailSectionSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailSectionSummaryComponent);
    component = fixture.componentInstance;
    component.section = {total: 0, title: ''};
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isMatchedRecords getter', () => {
    it('should return true when title is matched records', () => {
      component.section = {title: 'MATCHED RECORDS', total: 0};
      fixture.detectChanges();
      expect(component.isMatchedRecords).toBe(true);
    });
    it('should return false when title is not matched records', function () {
      component.section = {title: 'not MATCHED RECORDS', total: 0};
      fixture.detectChanges();
      expect(component.isMatchedRecords).toBe(false);
    });
  });
  describe('isPossibleMatches getter', () => {
    it('should return true when title is possible matches', () => {
      component.section = {title: 'POSSIBLE MATCHES', total: 0};
      fixture.detectChanges();
      expect(component.isPossibleMatches).toBe(true);
    });
    it('should return false when title is not possible matches', function () {
      component.section = {title: 'not POSSIBLE MATCHES', total: 0};
      fixture.detectChanges();
      expect(component.isPossibleMatches).toBe(false);
    });
  });
  describe('isPossibleRelationships getter', () => {
    it('should return true when title is possible relationships', () => {
      component.section = {title: 'POSSIBLE RELATIONSHIPS', total: 0};
      fixture.detectChanges();
      expect(component.isPossibleRelationships).toBe(true);
    });
    it('should return false when title is not possible relationships', function () {
      component.section = {title: 'not POSSIBLE RELATIONSHIPS', total: 0};
      fixture.detectChanges();
      expect(component.isPossibleRelationships).toBe(false);
    });
  });
  describe('isDisclosedRelationships getter', () => {
    it('should return true when title is disclosed relationships', () => {
      component.section = {title: 'DISCLOSED RELATIONSHIPS', total: 0};
      fixture.detectChanges();
      expect(component.isDisclosedRelationships).toBe(true);
    });
    it('should return false when title is not disclosed relationships', function () {
      component.section = {title: 'not DISCLOSED RELATIONSHIPS', total: 0};
      fixture.detectChanges();
      expect(component.isDisclosedRelationships).toBe(false);
    });
  });
});
