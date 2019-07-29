import { Component, OnInit, Input } from '@angular/core';
import { SzEntityDetailSectionSummary } from '../../../models/entity-detail-section-data';


import {
  SzEntityData,
  SzRelatedEntity,
  SzEntityRecord,
  SzRelationshipType,
  SzEntityFeature
} from '@senzing/rest-api-client-ng';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class SzEntityDetailHeaderComponent implements OnInit {
  @Input() public searchTerm: string;
  @Input() public entity: SzEntityData;

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
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLEMATCH;
    }) : undefined;
  }
  /**
   * A list of the search results that are related.
   *
   * @readonly
   */
  public get discoveredRelationships(): SzRelatedEntity[] {
    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.POSSIBLERELATION;
    }) : undefined;
  }
  /**
   * A list of the search results that are name only matches.
   *
   * @readonly
   */
  public get disclosedRelationships(): SzRelatedEntity[] {

    return this.entity && this.entity.relatedEntities.filter ? this.entity.relatedEntities.filter( (sr) => {
      return sr.relationType == SzRelationshipType.DISCLOSEDRELATION;
    }) : undefined;
  }

  /**
   * Best name to use for entity
   *
   * @readonly
   */
  public get bestName(): string {
    if(this.entity) {
      if(this.entity.resolvedEntity.bestName) {
        return this.entity.resolvedEntity.bestName.trim();
      } else if(this.entity.resolvedEntity.entityName) {
        return this.entity.resolvedEntity.entityName.trim();
      } else if(this.entity.resolvedEntity.nameData.length > 0) {
        return this.entity.resolvedEntity.nameData[1];
      }
    }
    return "";
  }
  /**
   * returns "M", "F", or undefined if gender cannot be determined.
   * @param features
   */
  private getGenderFromFeatures(features: {[key: string] : SzEntityFeature[]} | undefined | null): string | undefined {
    if(features){
      //console.warn('getGenderFromFeatures: ', features.GENDER);
      if(features.GENDER){
        // has gender
        let _gender = features.GENDER;
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
      if(features && (features.ORG || features.NAME_ORG)){
        hasBusinessKey = true;
      }
      return (!hasBusinessKey && hasPersonKey);
    }
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
  /**
   * returns string[] of classes to be applied to icon svg element
   * @readonly
   */
  public get iconClasses() {
    let ret = ['icon-user', 'icon-inline'];
    if(this.entity && this.entity.resolvedEntity.features) {
      let isPerson = this.isPerson(this.entity.resolvedEntity.features);
      let gender = this.getGenderFromFeatures(this.entity.resolvedEntity.features);
      //console.warn('gender: ', gender);
      if(gender) {
        ret.push( (gender == 'F' ? 'female' : 'male') );
        if(gender == 'M'){
          ret.push('icon-flip');
        }
      } else if(!isPerson) {
        ret.push('company');
      } else {
        ret.push('default'); ret.push('icon-flip');
      }
    } else {
      // default
      ret.push('default'); ret.push('icon-flip');
    }
    //console.log('iconClasses: ', ret);
    return ret
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

  constructor() {}

  ngOnInit() {}

  get sectionSummaryInfo(): SzEntityDetailSectionSummary[] {
    if (this.entity) {
      return [
        {
          total: this.entity.resolvedEntity.records.length,
          title: 'Matched Record'+ (this.entity.resolvedEntity.records.length === 1 ? '' : 's')
        },
        {
          total: this.possibleMatches.length,
          title: 'Possible Match'+ (this.possibleMatches.length === 1 ? '' : 'es')
        },
        {
          total: this.discoveredRelationships.length,
          title: 'Possible Relationship'+ (this.discoveredRelationships.length === 1 ? '' : 's')
        },
        {
          total: this.disclosedRelationships.length,
          title: 'Disclosed Relationship'+ (this.disclosedRelationships.length === 1 ? '' : 's')
        },
      ];
    }
    return [];
  }

}
