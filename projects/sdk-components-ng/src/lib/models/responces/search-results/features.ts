export interface SzFeatures {
  ADDRESS: SzFeature[];
  DOB: SzFeature[];
  EMAIL_ADDR?: SzFeature[];
  GENDER?: SzFeature[];
  NAME: SzFeature[];
  PHONE?: SzFeature[];
  SSN?: SzFeature[];
  DRLIC: SzFeature[];
}

export interface SzFeature {
  id: number;
  description: string;
  usageType: string;
  duplicateValues?: any;
}
