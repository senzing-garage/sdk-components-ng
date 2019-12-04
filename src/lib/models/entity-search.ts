/**
 * A model of search parameters that can be sent to the
 * api server.
 *
 * @export
 */
export interface SzEntitySearchParams {
  "NAME_TYPE"?: string,
  "NAME_FIRST"?: string,
  "NAME_LAST"?: string,
  "NAME_FULL"?: string,
  "ADDR_TYPE"?: string,
  "ADDR_LINE1"?: string,
  "ADDR_CITY"?: string,
  "ADDR_STATE"?: string,
  "ADDR_POSTAL_CODE"?: string,
  "ADDR_FULL"?: string;

  "PHONE_NUMBER"?: string;
  "EMAIL_ADDRESS"?: string;
  "PERSON_NAME_FULL"?: string;
  "COMPANY_NAME_ORG"?: string;

  "GENDER"?: string;
  "DATE_OF_BIRTH"?: string;
  "PASSPORT_NUMBER"?: string;
  "PASSPORT_COUNTRY"?: string;
  "DRIVERS_LICENSE_NUMBER"?: string;
  "DRIVERS_LICENSE_STATE"?: string;
  "SSN_NUMBER"?: string;
  "SOCIAL_HANDLE"?: string;
  "SOCIAL_NETWORK"?: string;
  "IDENTIFIER"?: string;
  "IDENTIFIER_TYPE"?: string;

  "NIN_NUMBER"?: string;
  "NIN_COUNTRY"?: string;
  "NAME_MIDDLE"?: string;
  "NAME_PREFIX"?: string;
  "NAME_SUFFIX"?: string;
}
