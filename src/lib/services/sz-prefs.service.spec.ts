import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SzSdkPrefsModel, SzPrefsService } from './sz-prefs.service';
import { filter, debounceTime } from 'rxjs/operators';

describe('SzPrefsService', () => {
  let injector: TestBed;
  let service: SzPrefsService;
  let httpMock: HttpTestingController;

  // json mock data for data loading
  const mockData = {
    "searchForm":{
        "allowedTypeAttributes":[
            "SSN_NUMBER",
            "PASSPORT_NUMBER",
            "TRUSTED_ID_NUMBER",
            "SOCIAL_NETWORK"
        ]
    },
    "searchResults":{
        "openInNewTab":false,
        "showOtherData":true,
        "showAttributeData":true,
        "truncateRecordsAt":4,
        "truncateOtherDataAt":3,
        "truncateAttributeDataAt":6,
        "showEmbeddedGraph":false,
        "showRecordIds":true,
        "linkToEmbeddedGraph":false,
        "truncateIdentifierDataAt":2
    },
    "entityDetail":{
        "showGraphSection":true,
        "showMatchesSection":true,
        "showPossibleMatchesSection":true,
        "showPossibleRelationshipsSection":true,
        "showDisclosedSection":true,
        "graphSectionCollapsed":false,
        "recordsSectionCollapsed":false,
        "possibleMatchesSectionCollapsed":false,
        "possibleRelationshipsSectionCollapsed":false,
        "disclosedRelationshipsSectionCollapsed":false,
        "rememberSectionCollapsedState":true,
        "truncateSummaryAt":2,
        "showOtherData":true,
        "truncateOtherDataAt":2,
        "openLinksInNewTab":false,
        "showOtherDataInRecords":true,
        "showOtherDataInEntities":false,
        "showOtherDataInSummary":true,
        "truncateOtherDataInRecordsAt":2,
        "hideGraphWhenZeroRelations":true,
        "showRecordIdWhenNative":true,
        "showTopEntityRecordIdsWhenSingular":true
    },
    "graph":{
        "openInNewTab":false,
        "openInSidePanel":false,
        "dataSourceColors":{
            "owners":"#0088ff"
        },
        "showMatchKeys":true,
        "rememberStateOptions":true,
        "maxDegreesOfSeparation":3,
        "maxEntities":70,
        "buildOut":1
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SzPrefsService],
    });

    injector = getTestBed();
    service = injector.get(SzPrefsService);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** *********************************************************
   * for some reason the service publishes a series of prefsChange
   * event(s) immediately. this leads to a situation where
   * the tests only care about the last one in the stack, but
   * the service is delivering a history stack. to get around it
   * using "debounceTime(500)"
   *
  *************************************************************/

  // ------------------ test against mock data load -------------------
  it('can set preferences via fromJSONString()', (done) => {
    //console.log('-------------- DEBUG (input) --------------- \n\r', JSON.stringify(mockData, null, 2));
    service.fromJSONString( JSON.stringify(mockData) );

    service.prefsChanged.pipe(
      // filter because the first publish is always empty object
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      console.log('------------------- DEBUG (output) ------------', Object.keys(g).join(', '));
      console.log('2', JSON.stringify(g, null, 2) );
       expect(g.searchResults.showOtherData).toEqual(true);
       done();
    });
  });

  it('can set preferences via fromJSONObject()', (done) => {
    service.prefsChanged.pipe(
      // filter because the first publish is always empty object
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
       expect(g.entityDetail.showTopEntityRecordIdsWhenSingular).toEqual(true);
       done();
    });
    service.fromJSONObject( mockData );
  });

  // --------------------------- test against individual pref setters -------------------
  it('search form pref: can set "allowedTypeAttributes"', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
       expect(g.searchForm.allowedTypeAttributes).toEqual([
        'PASSPORT_NUMBER',
        'NATIONAL_ID_NUMBER',
        'OTHER_ID_NUMBER',
        'TAX_ID_NUMBER',
        'TRUSTED_ID_NUMBER'
       ]);
       done();
    });

    service.searchForm.allowedTypeAttributes = [
      'PASSPORT_NUMBER',
      'NATIONAL_ID_NUMBER',
      'OTHER_ID_NUMBER',
      'TAX_ID_NUMBER',
      'TRUSTED_ID_NUMBER'
    ];

  });

  // --------------------------- search results -----------------------------------------
  it('search results "openInNewTab" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
       expect(g.searchResults.openInNewTab).toEqual(true);
       done();
    });
    service.searchResults.openInNewTab = true;
  });
  it('search results "showOtherData" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.showOtherData).toEqual(true);
      done();
    });
    service.searchResults.showOtherData = true;
  });
  it('search results "showAttributeData" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.showAttributeData).toEqual(true);
      done();
    });
    service.searchResults.showAttributeData = true;
  });
  it('search results "truncateRecordsAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.truncateRecordsAt).toEqual(9);
      done();
    });
    service.searchResults.truncateRecordsAt = 9;
  });
  it('search results "truncateOtherDataAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.truncateOtherDataAt).toEqual(9);
      done();
    });
    service.searchResults.truncateOtherDataAt = 9;
  });
  it('search results "truncateAttributeDataAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.truncateAttributeDataAt).toEqual(9);
      done();
    });
    service.searchResults.truncateAttributeDataAt = 9;
  });
  it('search results "showEmbeddedGraph" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.showEmbeddedGraph).toEqual(true);
      done();
    });
    service.searchResults.showEmbeddedGraph = true;
  });
  it('search results "showRecordIds" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.showRecordIds).toEqual(true);
      done();
    });
    service.searchResults.showRecordIds = true;
  });
  it('search results "linkToEmbeddedGraph" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.linkToEmbeddedGraph).toEqual(true);
      done();
    });
    service.searchResults.linkToEmbeddedGraph = true;
  });
  it('search results "truncateIdentifierDataAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.searchResults.truncateIdentifierDataAt).toEqual(9);
      done();
    });
    service.searchResults.truncateIdentifierDataAt = 9;
  });

  // --------------------------- entity detail -----------------------------------------

  it('entity detail "showGraphSection" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showGraphSection).toEqual(true);
      done();
    });
    service.entityDetail.showGraphSection = true;
  });
  it('entity detail "showMatchesSection" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showMatchesSection).toEqual(true);
      done();
    });
    service.entityDetail.showMatchesSection = true;
  });
  it('entity detail "showPossibleMatchesSection" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showPossibleMatchesSection).toEqual(true);
      done();
    });
    service.entityDetail.showPossibleMatchesSection = true;
  });
  it('entity detail "showPossibleRelationshipsSection" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showPossibleRelationshipsSection).toEqual(true);
      done();
    });
    service.entityDetail.showPossibleRelationshipsSection = true;
  });
  it('entity detail "showDisclosedSection" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showDisclosedSection).toEqual(true);
      done();
    });
    service.entityDetail.showDisclosedSection = true;
  });

  it('entity detail "graphSectionCollapsed" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.graphSectionCollapsed).toEqual(true);
      done();
    });
    service.entityDetail.graphSectionCollapsed = true;
  });
  it('entity detail "recordsSectionCollapsed" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.recordsSectionCollapsed).toEqual(true);
      done();
    });
    service.entityDetail.recordsSectionCollapsed = true;
  });
  it('entity detail "possibleMatchesSectionCollapsed" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.possibleMatchesSectionCollapsed).toEqual(true);
      done();
    });
    service.entityDetail.possibleMatchesSectionCollapsed = true;
  });
  it('entity detail "possibleRelationshipsSectionCollapsed" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.possibleRelationshipsSectionCollapsed).toEqual(true);
      done();
    });
    service.entityDetail.possibleRelationshipsSectionCollapsed = true;
  });
  it('entity detail "disclosedRelationshipsSectionCollapsed" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.disclosedRelationshipsSectionCollapsed).toEqual(true);
      done();
    });
    service.entityDetail.disclosedRelationshipsSectionCollapsed = true;
  });

  it('entity detail "rememberSectionCollapsedState" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.rememberSectionCollapsedState).toEqual(true);
      done();
    });
    service.entityDetail.rememberSectionCollapsedState = true;
  });
  it('entity detail "truncateSummaryAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.truncateSummaryAt).toEqual(9);
      done();
    });
    service.entityDetail.truncateSummaryAt = 9;
  });
  it('entity detail "showOtherData" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showOtherData).toEqual(true);
      done();
    });
    service.entityDetail.showOtherData = true;
  });
  it('entity detail "truncateOtherDataAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.truncateOtherDataAt).toEqual(9);
      done();
    });
    service.entityDetail.truncateOtherDataAt = 9;
  });
  it('entity detail "openLinksInNewTab" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.openLinksInNewTab).toEqual(true);
      done();
    });
    service.entityDetail.openLinksInNewTab = true;
  });
  it('entity detail "showOtherDataInRecords" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showOtherDataInRecords).toEqual(true);
      done();
    });
    service.entityDetail.showOtherDataInRecords = true;
  });
  it('entity detail "showOtherDataInEntities" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showOtherDataInEntities).toEqual(true);
      done();
    });
    service.entityDetail.showOtherDataInEntities = true;
  });
  it('entity detail "showOtherDataInSummary" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showOtherDataInSummary).toEqual(true);
      done();
    });
    service.entityDetail.showOtherDataInSummary = true;
  });
  it('entity detail "truncateOtherDataInRecordsAt" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.truncateOtherDataInRecordsAt).toEqual(9);
      done();
    });
    service.entityDetail.truncateOtherDataInRecordsAt = 9;
  });
  it('entity detail "hideGraphWhenZeroRelations" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.hideGraphWhenZeroRelations).toEqual(true);
      done();
    });
    service.entityDetail.hideGraphWhenZeroRelations = true;
  });
  it('entity detail "showRecordIdWhenNative" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showRecordIdWhenNative).toEqual(true);
      done();
    });
    service.entityDetail.showRecordIdWhenNative = true;
  });
  it('entity detail "showTopEntityRecordIdsWhenSingular" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.entityDetail.showTopEntityRecordIdsWhenSingular).toEqual(true);
      done();
    });
    service.entityDetail.showTopEntityRecordIdsWhenSingular = true;
  });

  // --------------------------- graph -----------------------------------------
  it('graph "openInNewTab" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.openInNewTab).toEqual(true);
      done();
    });
    service.graph.openInNewTab = true;
  });
  it('graph "openInSidePanel" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.openInSidePanel).toEqual(true);
      done();
    });
    service.graph.openInSidePanel = true;
  });
  it('graph "showMatchKeys" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.showMatchKeys).toEqual(true);
      done();
    });
    service.graph.showMatchKeys = true;
  });
  it('graph "rememberStateOptions" changes to true', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.rememberStateOptions).toEqual(true);
      done();
    });
    service.graph.showMatchKeys = true;
  });
  it('graph "maxDegreesOfSeparation" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.maxDegreesOfSeparation).toEqual(9);
      done();
    });
    service.graph.maxDegreesOfSeparation = 9;
  });
  it('graph "maxEntities" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.maxEntities).toEqual(9);
      done();
    });
    service.graph.maxEntities = 9;
  });

  it('graph "buildOut" changes to 9', (done) => {
    service.prefsChanged.pipe(
      debounceTime(500)
    ).subscribe((g: SzSdkPrefsModel) => {
      expect(g.graph.buildOut).toEqual(9);
      done();
    });
    service.graph.buildOut = 9;
  });
});
