import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import {
  SzEntityData,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType,
  SzEntityFeature,
  SzResolvedEntity
} from '@senzing/rest-api-client-ng';
import { SzRelationshipNetworkComponent } from '@senzing/sdk-graph-components';

import { bestEntityName } from '../../entity-utils';
import { SzWhyEntityDialog } from '../../../why/sz-why-entity.component';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class SzEntityDetailHeaderComponent implements OnInit, OnDestroy {
  @Input() public searchTerm: string;
  /** the entity to display */
  private _entity: SzEntityData;
  /** set the entity to display */
  @Input() public set entity(value: SzEntityData) {
    this._entity = value;
    if(value && value.resolvedEntity) {
      this.setIconClassesFromEntity( value.resolvedEntity );
    }
  }
  /** get the entity being displayed */
  public get entity(): SzEntityData {
    return this._entity;
  }
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** the width to switch from wide to narrow layout */
  @Input() public layoutBreakpoints = [
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 700, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 699 }
  ]
  public _layoutClasses: string[] = [];
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  public get layoutClasses() {
    return this._layoutClasses;
  }
  @Input() public forceLayout: boolean = false;

  private _bestName: string = null;
  private _bestNameEntity: SzEntityData = null;

  /**
   * A list of the search results that are matches.
   * @readonly
   */
  public get matches(): SzEntityRecord[] {
    return this.entity && this.entity.resolvedEntity.records ? this.entity.resolvedEntity.records : undefined;
  }
  /**
   * A list of the search results that are possible matches.
   *
   * @readonly
   */
  public get possibleMatches(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   */
  public get discoveredRelationships(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   */
  public get disclosedRelationships(): SzRelatedEntity[] {

    return this.entity && this.entity.relatedEntities && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    }) : undefined;
  }

/**
   * Best name to use for entity
   *
   * @readonly
   */
  public get bestName(): string {
    if (this._bestName && this._bestNameEntity === this.entity) {
      return this._bestName;
    }
    if (!this.entity) {
      return bestEntityName(null);
    }
    this._bestName = bestEntityName(this.entity.resolvedEntity);
    this._bestNameEntity = this.entity;
    return this._bestName;
  }
  /** get the entity id if available, otherwise undefined */
  public get entityId(): number | undefined {
    if(this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.entityId) {
      return this.entity.resolvedEntity.entityId;
    }
    return undefined;
  }

  /**
   * returns "M", "F", or undefined if gender cannot be determined.
   * @param features
   */
  private getGenderFromFeatures(features: {[key: string] : SzEntityFeature[]} | undefined | null): string | undefined {
    if(features){
      //console.warn('getGenderFromFeatures: ', features.GENDER);
      if(features['GENDER']){
        // has gender
        let _gender = features['GENDER'];
        if(_gender.some) {
          let _female = _gender.some( (val: {primaryValue: string, usageType: any, duplicateValues: any} ) => {
            return val.primaryValue === "F";
          });
          let _male = _gender.some( (val: {primaryValue: string, usageType: any, duplicateValues: any} ) => {
            return val.primaryValue === "M";
          });
          //console.warn('getGenderFromFeatures: ', _female, features.GENDER);
          return (_female ? 'F' : ( _male ? 'M' : undefined));
        }
      }
    }
    return undefined;
  }
  /**
   * returns true if a Entities features collection can identify it as a person.
   * returns false if a Entities features collection cannot identify it as a company or the entity type cannot be identified.
   */
  private isPerson(features: {[key: string] : SzEntityFeature[]} | undefined | null): boolean {
    if(features) {
      let hasPersonKey = false;
      let hasBusinessKey = false;
      let personKeys = ["DOB","DRLIC","SSN","SSN_LAST4","PASSPORT","GENDER"];
      personKeys.forEach((keyName) => {
        if( features[keyName] ){
          hasPersonKey = true; // has key
        }
      });
      if(features && (features['ORG'] || features['NAME_ORG'])){
        hasBusinessKey = true;
      }
      return (!hasBusinessKey && hasPersonKey);
    }
    return false;
  }
  /**
   * returns the svg view box to use for the primary icon
   * @readonly
   */
  public get iconViewBox() {
    let ret = '0, 0, 1024, 1024';
    const iconClasses = this.iconClasses;
    if(iconClasses && iconClasses.indexOf){

      if(iconClasses.indexOf('company') >= 0){
        ret = '0, -5, 24, 32';
      } else if(iconClasses.indexOf('female') >= 0) {
        ret = '0, -50, 1024, 1024';
      }
    }
    return ret;
  }
  /** @internal */
  private _iconClasses = ['icon-user', 'icon-inline'];
  /**
   * returns string[] of classes to be applied to icon svg element
   * @readonly
   */
  public get iconClasses(): string[] {
    return this._iconClasses;
  }
  /** sets the appropriate icon to show for the entity in the header */
  private setIconClassesFromEntity(entity: SzResolvedEntity) {
    const iconClasses = ['icon-user', 'icon-inline'];
    if(entity) {
      const iconType    = SzRelationshipNetworkComponent.getIconType(entity);
      const gender      = entity && entity.features ? this.getGenderFromFeatures(entity.features) : undefined;

      if(iconType && iconType !== undefined){
        if (iconType === 'business') {
          iconClasses.push('company');
        } else if (iconType === 'userFemale' || iconType === 'userMale') {
          iconClasses.push( (gender == 'F' || iconType === 'userFemale' ? 'female' : 'male') );
          iconClasses.push('icon-flip');
        } else if (iconType === 'default') {
          iconClasses.push('default'); iconClasses.push('icon-flip');
        }
      }
    }
    this._iconClasses = iconClasses;
    //console.warn('SzEntityDetailHeaderComponent.setIconClassesFromEntity: ', iconType, iconClasses, entity);
  }

  /**
   * return the gender to be used for the icon.
   * @returns none | F | M
   * @readonly
   */
  public get iconGender(): string {
    let gender = 'none';
    if(this.entity && this.entity.resolvedEntity){
      gender = this.getGenderFromFeatures(this.entity.resolvedEntity.features)
    }
    return gender;
  }

  constructor( public breakpointObserver: BreakpointObserver, public dialog: MatDialog) {}

  getCssQueryFromCriteria(minWidth?: number, maxWidth?: number): string | undefined {
    if(minWidth && maxWidth){
      // in between
      return (`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
    } else if(minWidth){
      return (`(min-width: ${minWidth}px)`);
    } else if(maxWidth){
      return (`(max-width: ${maxWidth}px)`);
    }
    return undefined;
  }

  ngOnInit() {
    // detect layout changes
    let bpSubArr = [];
    this.layoutBreakpoints.forEach( (bpObj: any) => {
      if(bpObj.minWidth && bpObj.maxWidth){
        // in between
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px) and (max-width: ${bpObj.maxWidth}px)`);
      } else if(bpObj.minWidth){
        bpSubArr.push(`(min-width: ${bpObj.minWidth}px)`);
      } else if(bpObj.maxWidth){
        bpSubArr.push(`(max-width: ${bpObj.maxWidth}px)`);
      }
    });
    const layoutChanges = this.breakpointObserver.observe(bpSubArr);

    layoutChanges.pipe(
      takeUntil(this.unsubscribe$),
      filter( () => { return !this.forceLayout })
    ).subscribe( (state: BreakpointState) => {

      const cssQueryMatches = [];
      // get array of media query matches
      for(let k in state.breakpoints){
        const val = state.breakpoints[k];
        if(val == true) {
          // find key in layoutBreakpoints
          cssQueryMatches.push( k )
        }
      }
      // get array of layoutBreakpoints objects that match media queries
      const _matches = this.layoutBreakpoints.filter( (_bp) => {
        const _mq = this.getCssQueryFromCriteria(_bp.minWidth, _bp.maxWidth);
        if(cssQueryMatches.indexOf(_mq) >= 0) {
          return true;
        }
        return false;
      });
      // assign matches to local prop
      this.layoutClasses = _matches.map( (_bp) => {
        return _bp.cssClass;
      })
    })

  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get sectionSummaryInfo(): SzEntityDetailSectionSummary[] {
    if (this.entity) {
      return [
        {
          total: ((this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.records && this.entity.resolvedEntity.records.length) ? this.entity.resolvedEntity.records.length : 0),
          title: 'Matched Record'+ ((this.entity && this.entity.resolvedEntity && this.entity.resolvedEntity.records && this.entity.resolvedEntity.records.length === 1) ? '' : 's')
        },
        {
          total: ((this.possibleMatches && this.possibleMatches.length) ? this.possibleMatches.length : 0),
          title: 'Possible Match'+ ((this.possibleMatches && this.possibleMatches.length === 1) ? '' : 'es')
        },
        {
          total: ((this.discoveredRelationships && this.discoveredRelationships.length) ? this.discoveredRelationships.length : 0),
          title: 'Possible Relationship'+ (this.discoveredRelationships && this.discoveredRelationships.length === 1 ? '' : 's')
        },
        {
          total: ((this.disclosedRelationships && this.disclosedRelationships.length) ? this.disclosedRelationships.length : 0),
          title: 'Disclosed Relationship'+ (this.disclosedRelationships && this.disclosedRelationships.length === 1 ? '' : 's')
        },
      ];
    }
    return [];
  }

  public onWhyButtonClick(event: any) {
    console.log('Show Why Dialog for entity: ', this.entityId);
    this.dialog.open(SzWhyEntityDialog, {
      width: '1200px',
      height: '800px',
      data: {
        entityId: this._entity.resolvedEntity.entityId
      }
    });
  }

}
