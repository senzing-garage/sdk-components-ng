import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SzSdkPrefsModel, SzPrefsService } from '../../services/sz-prefs.service';
import { SzPreferencesComponent } from './sz-preferences.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzPreferencesComponent', () => {
  let component: SzPreferencesComponent;
  let fixture: ComponentFixture<SzPreferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SzPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('showControls', () => {
    it('should default to false', () => {
      fixture.detectChanges();
      expect(component.showControls).toBe(false);
    });
    it('no controls should be showing', () => {
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.sz-preferences'))).toBeNull();
    });
  });

  describe('should have column: ', () => {
    it('search', () => {
      fixture.componentInstance.showControls = true;
      fixture.detectChanges();
      let dbgEle = fixture.debugElement.query( By.css('.prefs-ui-column-search'));
      expect(dbgEle).toBeTruthy();
    });
    it('entity detail', () => {
      fixture.componentInstance.showControls = true;
      fixture.detectChanges();
      let dbgEle = fixture.debugElement.query( By.css('.prefs-ui-column-entity-detail'));
      expect(dbgEle).toBeTruthy();
    });
    it('graph', () => {
      fixture.componentInstance.showControls = true;
      fixture.detectChanges();
      let dbgEle = fixture.debugElement.query( By.css('.prefs-ui-column-graph'));
      expect(dbgEle).toBeTruthy();
    });
  });

  describe('Should emit change event on prefs change:', () => {
    // --------------------------- search form
    it('search form can set "allowedTypeAttributes" by array', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchForm.allowedTypeAttributes).toEqual([
          'PASSPORT_NUMBER',
          'NATIONAL_ID_NUMBER',
          'OTHER_ID_NUMBER',
          'TAX_ID_NUMBER',
          'TRUSTED_ID_NUMBER'
         ]);
         done();
      });
      fixture.componentInstance.SearchFormAllowedTypeAttributes = [
        'PASSPORT_NUMBER',
        'NATIONAL_ID_NUMBER',
        'OTHER_ID_NUMBER',
        'TAX_ID_NUMBER',
        'TRUSTED_ID_NUMBER'
      ];
    });
    it('search form can set "allowedTypeAttributes" by string', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchForm.allowedTypeAttributes).toEqual([
          'PASSPORT_NUMBER',
          'NATIONAL_ID_NUMBER',
          'OTHER_ID_NUMBER',
          'TAX_ID_NUMBER',
          'TRUSTED_ID_NUMBER'
         ]);
         done();
      });
      fixture.componentInstance.SearchFormAllowedTypeAttributes = "PASSPORT_NUMBER,NATIONAL_ID_NUMBER,OTHER_ID_NUMBER,TAX_ID_NUMBER,TRUSTED_ID_NUMBER";
    });

    // --------------------------- search results -----------------------------------------
    it('search results "openInNewTab" changes to true', (done) => {
        fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
           expect(g.searchResults.openInNewTab).toEqual(true);
           done();
        });
        fixture.componentInstance.SearchResultsOpenInNewTab = true;
    });
    it('search results "showOtherData" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.showOtherData).toEqual(true);
         done();
      });
      fixture.componentInstance.SearchResultsShowOtherData = true;
    });
    it('search results "showCharacteristicData" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.showCharacteristicData).toEqual(true);
         done();
      });
      fixture.componentInstance.SearchResultsShowCharacteristicData = true;
    });
    it('search results "truncateRecordsAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.truncateRecordsAt).toEqual(9);
         done();
      });
      fixture.componentInstance.SearchResultsTruncateRecordsAt = 9;
    });
    it('search results "truncateOtherDataAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.truncateOtherDataAt).toEqual(9);
         done();
      });
      fixture.componentInstance.SearchResultsTruncateOtherDataAt = 9;
    });
    it('search results "truncateCharacteristicDataAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.truncateCharacteristicDataAt).toEqual(9);
         done();
      });
      fixture.componentInstance.SearchResultsTruncateCharacteristicDataAt = 9;
    });
    it('search results "showEmbeddedGraph" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.showEmbeddedGraph).toEqual(true);
         done();
      });
      fixture.componentInstance.SearchResultsShowEmbeddedGraph = true;
    });
    it('search results "showRecordIds" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.showRecordIds).toEqual(true);
         done();
      });
      fixture.componentInstance.SearchResultsShowRecordIds = true;
    });
    it('search results "linkToEmbeddedGraph" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.linkToEmbeddedGraph).toEqual(true);
         done();
      });
      fixture.componentInstance.SearchResultsLinkToEmbeddedGraph = true;
    });
    it('search results "truncateIdentifierDataAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.searchResults.truncateIdentifierDataAt).toEqual(9);
         done();
      });
      fixture.componentInstance.SearchResultsTruncateIdentifierDataAt = 9;
    });

    // --------------------------- entity detail -----------------------------------------

    it('entity detail "showGraphSection" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showGraphSection).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowGraphSection = true;
    });
    it('entity detail "showMatchesSection" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showMatchesSection).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowMatchesSection = true;
    });
    it('entity detail "showPossibleMatchesSection" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showPossibleMatchesSection).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowPossibleMatchesSection = true;
    });
    it('entity detail "showPossibleRelationshipsSection" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showPossibleRelationshipsSection).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowPossibleRelationshipsSection = true;
    });
    it('entity detail "showDisclosedSection" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showDisclosedSection).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowDisclosedSection = true;
    });

    it('entity detail "graphSectionCollapsed" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.graphSectionCollapsed).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailGraphSectionCollapsed = true;
    });
    it('entity detail "recordsSectionCollapsed" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.recordsSectionCollapsed).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailRecordsSectionCollapsed = true;
    });
    it('entity detail "possibleMatchesSectionCollapsed" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.possibleMatchesSectionCollapsed).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailPossibleMatchesSectionCollapsed = true;
    });
    it('entity detail "possibleRelationshipsSectionCollapsed" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.possibleRelationshipsSectionCollapsed).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailPossibleRelationshipsSectionCollapsed = true;
    });
    it('entity detail "disclosedRelationshipsSectionCollapsed" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.disclosedRelationshipsSectionCollapsed).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailDisclosedRelationshipsSectionCollapsed = true;
    });

    it('entity detail "rememberSectionCollapsedState" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.rememberSectionCollapsedState).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailRememberSectionCollapsedState = true;
    });
    it('entity detail "truncateSummaryAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.truncateSummaryAt).toEqual(9);
         done();
      });
      fixture.componentInstance.EntityDetailTruncateSummaryAt = 9;
    });
    it('entity detail "showOtherData" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showOtherData).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowOtherData = true;
    });
    it('entity detail "truncateOtherDataAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.truncateOtherDataAt).toEqual(9);
         done();
      });
      fixture.componentInstance.EntityDetailTruncateOtherDataAt = 9;
    });
    it('entity detail "openLinksInNewTab" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.openLinksInNewTab).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailOpenLinksInNewTab = true;
    });
    it('entity detail "showOtherDataInRecords" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showOtherDataInRecords).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowOtherDataInRecords = true;
    });
    it('entity detail "showOtherDataInEntities" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showOtherDataInEntities).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowOtherDataInEntities = true;
    });
    it('entity detail "showOtherDataInSummary" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showOtherDataInSummary).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowOtherDataInSummary = true;
    });
    it('entity detail "truncateOtherDataInRecordsAt" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.truncateOtherDataInRecordsAt).toEqual(9);
         done();
      });
      fixture.componentInstance.EntityDetailTruncateOtherDataInRecordsAt = 9;
    });
    it('entity detail "hideGraphWhenZeroRelations" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.hideGraphWhenZeroRelations).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailHideGraphWhenZeroRelations = true;
    });
    it('entity detail "showRecordIdWhenNative" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showRecordIdWhenNative).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowRecordIdWhenNative = true;
    });
    it('entity detail "showTopEntityRecordIdsWhenSingular" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
         expect(g.entityDetail.showTopEntityRecordIdsWhenSingular).toEqual(true);
         done();
      });
      fixture.componentInstance.EntityDetailShowTopEntityRecordIdsWhenSingular = true;
    });

    // --------------------------- graph -----------------------------------------
    it('graph "openInNewTab" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.openInNewTab).toEqual(true);
        done();
      });
      fixture.componentInstance.GraphOpenInNewTab = true;
    });
    it('graph "openInSidePanel" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.openInSidePanel).toEqual(true);
        done();
      });
      fixture.componentInstance.GraphOpenInSidePanel = true;
    });
    it('graph "showLinkLabels" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.showLinkLabels).toEqual(true);
        done();
      });
      fixture.componentInstance.GraphShowLinkLabels = true;
    });
    it('graph "rememberStateOptions" changes to true', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.rememberStateOptions).toEqual(true);
        done();
      });
      fixture.componentInstance.GraphRememberStateOptions = true;
    });
    it('graph "maxDegreesOfSeparation" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.maxDegreesOfSeparation).toEqual(9);
        done();
      });
      fixture.componentInstance.GraphMaxDegreesOfSeparation = 9;
    });
    it('graph "maxEntities" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.maxEntities).toEqual(9);
        done();
      });
      fixture.componentInstance.GraphMaxEntities = 9;
    });
    it('graph "buildOut" changes to 9', (done) => {
      fixture.componentInstance.prefsChange.subscribe((g: SzSdkPrefsModel) => {
        expect(g.graph.buildOut).toEqual(9);
        done();
      });
      fixture.componentInstance.GraphBuildOut = 9;
    });
  });
});
