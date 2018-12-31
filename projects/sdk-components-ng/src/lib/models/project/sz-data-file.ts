import {
  fromServer, toServer, fromServerArray, toServerArray
} from '../../common/data-marshalling';
import { SzServerError } from '../../common/server-error';

export interface SzDataFileInfo {
  name?: string;
  url?: string;
  format?: string;
  uploadName?: string;
  dataSource?: string;
  entityType?: string;
  totalSize?: number;
  timestamp?: Date;
  mappingComplete?: boolean;
}

export interface SzDataFileFieldInfo {
  attributeCode?: string;
  attributeClass?: string;
  grouping?: string;
  autoMapped?: boolean;
  autoAttributeCode?: string;
  autoGrouping?: string;
  mappingLearned?: boolean;
}

// @dynamic
export class SzDataFileField implements SzDataFileFieldInfo {
  id: number;
  fileId: number;
  projectId: number;
  name: string;
  rank: number;
  density: number;
  uniqueness: number;
  attributeCode: string;
  attributeClass: string;
  grouping: string;
  defaultMapped: boolean;
  autoMapped: boolean;
  mappingLearned: boolean;
  autoAttributeCode: string;
  autoGrouping: string;
  reviewRequired: boolean;
  reviewAttributeCode: string;
  reviewGrouping: string;
  topValues: SzTopFieldValue[];
  outliers: { [ assumedDataType : string ] : SzTopFieldValue[] };
  createdOn: Date;
  lastModified: Date;

  public static fromServer(source: any) : SzDataFileField {
    return fromServer<SzDataFileField>(new SzDataFileField(), source);
  }

  public static fromServerArray(sourceArray: any[]) : SzDataFileField[] {

    return fromServerArray<SzDataFileField>(
      <SzDataFileField[]> [], sourceArray, function(){ return new SzDataFileField()});
  }

  public static toServer(source: SzDataFileField|SzDataFileFieldInfo) : SzDataFileField {
    return <SzDataFileField> toServer<SzDataFileFieldInfo>(new SzDataFileField(), source);
  }

  public static toServerArray(sourceArray: SzDataFileField[]|SzDataFileFieldInfo[])
    : SzDataFileField[]
  {
    return <SzDataFileField[]> toServerArray<SzDataFileFieldInfo>(
      <SzDataFileField[]> [], sourceArray, function(){ return  new SzDataFileField() });
  }
}

export class SzTopFieldValue {
  filedValue: string;
  frequency: number;
}

// @dynamic
export class SzDataFile implements SzDataFileInfo {
  id: number;
  projectId: number;
  name: string;
  url: string;
  status: string;
  format: string;
  signature: string;
  uploadName: string;
  dataSource: string;
  entityType: string;
  totalSize: number;
  contentReady: boolean;
  uploadComplete: boolean;
  processingComplete: boolean;
  mappingComplete: boolean;
  resolved: boolean;
  uploadedByteCount: number;
  processedByteCount: number;
  processingRate: number;
  recordCount: number;
  badRecordCount: number;
  processing: boolean;
  resolving: boolean;
  loadedRecordCount: number;
  resolvedRecordCount: number;
  suppressedRecordCount: number;
  failedRecordCount: number;
  resolutionRate: number;
  mappingTemplateKey: string;
  defaultMapped: boolean;
  mappingLearned: boolean;
  reviewRequired: boolean;
  createdOn: Date;
  lastModified: Date;
  timestamp: Date;
  fields: SzDataFileField[];
  recentErrors: SzServerError[];

  public static getName(url: string) : string {
    return url.replace(/^.*\/([^\/]+)$/g,"$1");
  }
  public static getPath(url: string) : string {
    return url.substring("file://".length);
  }

  public static fromServer(source: any) : SzDataFile {
    const file = fromServer<SzDataFile>(new SzDataFile(), source);

    if (!file) return file;

    if (file.fields && file.fields.length > 0) {
      file.fields = SzDataFileField.fromServerArray(file.fields);
    }

    return file;
  }

  public static fromServerArray(sourceArray: any[]) : SzDataFile[] {
    const files = fromServerArray<SzDataFile>(
      <SzDataFile[]> [], sourceArray, function(){ return new SzDataFile() });

    if (!files) return files;

    files.forEach(f => {
      if (f && f.fields && f.fields.length > 0) {
        f.fields = SzDataFileField.fromServerArray(f.fields);
      }
    });

    return files;
  }

  public static toServer(source: SzDataFile|SzDataFileInfo): SzDataFile {
    const file = <SzDataFile> toServer<SzDataFileInfo>(new SzDataFile(), source);

    if (!file) return file;

    if (file.fields && file.fields.length > 0) {
      file.fields = SzDataFileField.toServerArray(file.fields);
    }

    return file;
  }

  public static toServerArray(sourceArray: SzDataFile[]|SzDataFileInfo[])
    : SzDataFile[]
  {
    const files = <SzDataFile[]> toServerArray<SzDataFileInfo>(
      <SzDataFile[]> [], sourceArray, function(){ return new SzDataFile() });

    if (!files) return files;

    files.forEach(f => {
      if (f && f.fields && f.fields.length > 0) {
        f.fields = SzDataFileField.toServerArray(f.fields);
      }
    });

    return files;
  }

  public static getDefaultTemplateIcon(file: SzDataFile): string
  {
    // NOTE: Until we get legal permission we need to return the generic
    // icon for each
    return '';
    /*
     * Uncomment this when we have legal permission to use the icons
     *
    let dsrcCode = file.dataSource.toLowerCase().trim().replace(/[\s-]/g,'_');
    let result = bundle.get('logo-' + dsrcCode, null);
    if (!result) {
      let index = dsrcCode.search(/_\d+$/);
      if (index >= 0) {
        dsrcCode = dsrcCode.substring(0, index);
        result = bundle.get('logo-' + dsrcCode, null);
      }
      while (!result) {
        let index = dsrcCode.search(/_[^_]+$/);
        if (index < 0) break;
        dsrcCode = dsrcCode.substring(0, index);
        result = bundle.get('logo-' + dsrcCode, null);
      }
    }
    if (!result) {
      result = bundle.get('generic-datasource', null);
    }
    return result;
    */
  }
}
