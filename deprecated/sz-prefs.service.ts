import { Injectable, Output, Input, Inject } from '@angular/core';
import { Observable, fromEventPattern, Subject, BehaviorSubject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';
import { Configuration as SzRestConfiguration, ConfigurationParameters as SzRestConfigurationParameters } from '@senzing/rest-api-client-ng';

import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
// import { SzGraphConfigurationService } from '@senzing/sdk-graph-components';

/*
export class SzSdkPrefsBase {
  public prefsChanged: BehaviorSubject<any> = new BehaviorSubject<any>(this.toJSONObject());

  // the keys of methods in the object
  // to output in json, or to take as json input
  jsonKeys = [];

  // methods
  public toJSONObject() {
    const retObj = {};
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        if( this[k] !== undefined){
          try{
            retObj[k] = this[k];
          } catch (err) {
            // console.warn('attempted to get prefVal, but pref unset. ', err)
          };
        }
      });
    }
    return retObj;
  }
  public fromJSONObject(value: string) {
    if (this.jsonKeys && this.jsonKeys.forEach) {
      this.jsonKeys.forEach((k: string) => {
        if( value[k] !== undefined ){
          try{
            this[k] = value[k];
          } catch (err) {
            // console.warn('attempted to get prefVal, but pref unset. ', err)
          };
        }
      });
    }
  }
  public toJSONString(): string {
    return JSON.stringify(this.toJSONObject());
  }
}

export class SzSearchFormPrefs extends SzSdkPrefsBase {
  // private vars
  private _allowedTypeAttributes: string[] = [
    'SSN_NUMBER',
    'PASSPORT_NUMBER',
    'TRUSTED_ID_NUMBER'
  ];
  // json key that are output through
  // toJSONObject and fromJSONObject
  jsonKeys = [
    'allowedTypeAttributes'
  ]

  // getters and setters
  public get allowedTypeAttributes(): string[] {
    return this._allowedTypeAttributes;
  }
  public set allowedTypeAttributes(value: string[]) {
    this._allowedTypeAttributes = value;
    this.prefsChanged.next( this.toJSONObject );
  }

}

export class SzSearchResultsPrefs extends SzSdkPrefsBase {
  // private vars
  private _openInNewTab: boolean = false;
  private _showOtherData: boolean = false;
  private _truncateRecordsAt: number = 3;
  private _showEmbeddedGraph?: boolean = false;
  private _linkToEmbeddedGraph?: boolean = false;
  private _showAttributeData: boolean = false;
  private _truncateOtherDataAt: number = 3;
  private _truncateAttributeDataAt: number = 3;
  private _showRecordIds: boolean = false;

  // json key that are output through
  // toJSONObject and fromJSONObject
  jsonKeys = [
    'openInNewTab',
    'showOtherData',
    'showAttributeData',
    'truncateRecordsAt',
    'truncateOtherDataAt',
    'truncateAttributeDataAt',
    'showEmbeddedGraph',
    'showRecordIds',
    'linkToEmbeddedGraph'
  ]

  // getters and setters
  public get openInNewTab(): boolean {
    return this._openInNewTab;
  }
  public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get showOtherData(): boolean {
    return this._showOtherData;
  }
  public set showOtherData(value: boolean) {
    this._showOtherData = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get showAttributeData(): boolean {
    return this._showAttributeData;
  }
  public set showAttributeData(value: boolean) {
    this._showAttributeData = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get showRecordIds(): boolean {
    return this._showRecordIds;
  }
  public set showRecordIds(value: boolean) {
    this._showRecordIds = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get truncateRecordsAt(): number {
    return this._truncateRecordsAt;
  }
  public set truncateRecordsAt(value: number) {
    this._truncateRecordsAt = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  public set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get truncateAttributeDataAt(): number {
    return this._truncateAttributeDataAt;
  }
  public set truncateAttributeDataAt(value: number) {
    this._truncateAttributeDataAt = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get showEmbeddedGraph(): boolean {
    return this._showEmbeddedGraph;
  }
  public set showEmbeddedGraph(value: boolean) {
    this._showEmbeddedGraph = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get linkToEmbeddedGraph(): boolean {
    return this._linkToEmbeddedGraph;
  }
  public set linkToEmbeddedGraph(value: boolean) {
    this._linkToEmbeddedGraph = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
}
export class SzEntityDetailPrefs extends SzSdkPrefsBase {
  private _graphCollapsed: boolean;
  private _recordsCollapsed: boolean;
  private _disclosedCollapsed: boolean;
  private _possibleMatchesCollapsed: boolean;
  private _possibleRelationshipsCollapsed: boolean;
  private _showEdgeLabels: boolean;
  private _truncateAt: number;
  private _openInNewTab: boolean;

  // json key that are output through
  // toJSONObject and fromJSONObject
  jsonKeys = [
    'graphCollapsed',
    'recordsCollapsed',
    'disclosedCollapsed',
    'possibleMatchesCollapsed',
    'possibleRelationshipsCollapsed',
    'showEdgeLabels',
    'truncateAt',
    'openInNewTab'
  ]

  // getters and setters
  public get graphCollapsed(): boolean {
    return this._graphCollapsed;
  }
  public set graphCollapsed(value: boolean) {
    this._graphCollapsed = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get recordsCollapsed(): boolean {
    return this._recordsCollapsed;
  }
  public set recordsCollapsed(value: boolean) {
    this._recordsCollapsed = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get disclosedCollapsed(): boolean {
    return this._disclosedCollapsed;
  }
  public set disclosedCollapsed(value: boolean) {
    this._disclosedCollapsed = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get possibleMatchesCollapsed(): boolean {
    return this._possibleMatchesCollapsed;
  }
  public set possibleMatchesCollapsed(value: boolean) {
    this._possibleMatchesCollapsed = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get possibleRelationshipsCollapsed(): boolean {
    return this._possibleRelationshipsCollapsed;
  }
  public set possibleRelationshipsCollapsed(value: boolean) {
    this._possibleRelationshipsCollapsed = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get showEdgeLabels(): boolean {
    return this._showEdgeLabels;
  }
  public set showEdgeLabels(value: boolean) {
    this._showEdgeLabels = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get truncateAt(): number {
    return this._truncateAt;
  }
  public set truncateAt(value: number) {
    this._truncateAt = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
  public get openInNewTab(): boolean {
    return this._openInNewTab;
  }
  public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
    this.prefsChanged.next( this.toJSONObject() );
  }
}*/

/**
 * TODO: move this to graph package
 * and have this file import from npm package
 */
/*
export class SzGraphPrefs extends SzSdkPrefsBase {
  // private vars
  public openInNewTab: boolean = false;
  public openInSidePanel: boolean = false;
  public showEdgeLabels: boolean = false;
  public dataSourceColors = {
    'owners':'#0088ff'
  };
  // json key that are output through
  // toJSONObject and fromJSONObject
  jsonKeys = [
    'openInNewTab',
    'openInSidePanel',
    'showEdgeLabels',
    'dataSourceColors'
  ]
}

export interface SzSdkPrefsModel {
  searchForm?: any,
  searchResults?: any,
  entityDetail?: any,
  graph?: any
};

export class SzSdkPrefs {
  public prefsChanged: BehaviorSubject<SzSdkPrefsModel> = new BehaviorSubject<SzSdkPrefsModel>( this.toJSONObject() );
  public searchForm?: SzSearchFormPrefs       = new SzSearchFormPrefs();
  public searchResults?: SzSearchResultsPrefs = new SzSearchResultsPrefs();
  public entityDetail?: SzEntityDetailPrefs   = new SzEntityDetailPrefs();
  public graph?: SzGraphPrefs                 = new SzGraphPrefs();

  public toJSONObject() {
    let retObj: SzSdkPrefsModel = {};

    if(this.searchForm){
      retObj.searchForm = this.searchForm.toJSONObject();
    }
    if(this.searchResults){
      retObj.searchResults = this.searchResults.toJSONObject();
    }
    if(this.entityDetail){
      retObj.entityDetail = this.entityDetail.toJSONObject();
    }
    return retObj;
  }
  public fromJSONObject(value: SzSdkPrefsModel) {
    const _keys = Object.keys(value);
    _keys.forEach( (_k ) => {
      if( this[_k] && this[_k].fromJSONObject ){
        // object inheriting from 'SzSdkPrefsBase'
        this[_k].fromJSONObject( value[_k] );
      } else {
        //   maybe top level property
        //   :-/
        this[_k] = value[_k];
      }
    });
  }
  public fromJSONString(value: string) {
    let _sVal = JSON.parse(value);

    if(_sVal.searchForm){
      this.searchForm.fromJSONObject( _sVal.searchForm );
    }
    if(_sVal.searchResults){
      this.searchResults.fromJSONObject( _sVal.searchResults );
    }
    if(_sVal.entityDetail){
      this.entityDetail.fromJSONObject( _sVal.entityDetail );
    }
  }
  public toJSONString(): string {
    return JSON.stringify(this.toJSONObject());
  }

  constructor(defaultPrefs?: any){
    if(defaultPrefs) {
      // initialize with defaults passed in
      if( typeof defaultPrefs == 'string'){
        this.fromJSONString( defaultPrefs );
      } else {
        // shrug
        this.fromJSONObject( defaultPrefs );
      }
    }
    this.searchForm.prefsChanged.subscribe( (prefsObj ) => {
      console.log('search form prefs changed!!', prefsObj);
      this.prefsChanged.next( this.toJSONObject() );
    });
    this.searchResults.prefsChanged.subscribe( (prefsObj ) => {
      console.log('search results prefs changed!!', prefsObj);
      this.prefsChanged.next( this.toJSONObject() );
    });
    this.entityDetail.prefsChanged.subscribe( (prefsObj ) => {
      console.log('entity detail prefs changed!!', prefsObj);
      this.prefsChanged.next( this.toJSONObject() );
    });
    this.graph.prefsChanged.subscribe( (prefsObj ) => {
      console.log('graph prefs changed!!', prefsObj);
      this.prefsChanged.next( this.toJSONObject() );
    });
  }

  public forceChange() {
    this.prefsChanged.next( this.toJSONObject() );
  }
}


@Injectable({
  providedIn: 'root'
})
export class SzPrefsService extends SzSdkPrefs {
  public tval = true;

  constructor(
    ) {
    super();
    console.warn(' !!INITIALIZE SzPrefsService!! ');
  }
}
*/
