import {SzResponseWithRawData} from '@senzing/rest-api-client-ng';

export interface SzRawData {
  DATA_SOURCE: string;
  ENTITY_TYPE: string;
  SOURCE_ID: string;
  RECORD_ID: string;
  PRIMARY_NAME_LAST?: string;
  PRIMARY_NAME_FIRST?: string;
  PRIMARY_NAME_MIDDLE?: string;
  DATE_OF_BIRTH: string;
  GENDER?: string;
  SSN_NUMBER?: string;
  ADDR_LINE1?: string;
  ADDR_LINE2?: string;
  ADDR_CITY?: string;
  ADDR_STATE?: string;
  ADDR_POSTAL_CODE?: string;
  PRIMARY_PHONE_NUMBER?: string;
  EMAIL_ADDRESS?: string;
  ENTITY_KEY: string;
  ENTITY_NAME: string;
  MATCH_KEY: string;
  MATCH_SCORE: string;
  ERRULE_CODE: string;
  REF_SCORE: string;
  MATCH_LEVEL: number;
  NAME_FULL?: string;
  DRIVERS_LICENSE_STATE?: string;
  DRIVERS_LICENSE_NUMBER?: number;
  HOME_ADDR_FULL?: string;
  DSRC_ACTION?: string;
  LOAD_ID?: string;
  LENS?: string;
}
