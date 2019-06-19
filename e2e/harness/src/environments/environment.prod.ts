import { SzRestConfigurationParameters } from '@senzing/sdk-components-ng';

export const environment = {
  production: true,
  test: false
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'withCredentials': true
};
