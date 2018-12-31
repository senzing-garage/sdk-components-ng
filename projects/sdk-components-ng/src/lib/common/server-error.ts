import {
  fromServer, toServer, fromServerArray, toServerArray
} from './data-marshalling';

// @dynamic
export class SzServerError {
  id: string;
  critical: boolean;
  code: string;
  message: string;
  detail: string;
  timestamp: Date;

  public static fromServer(source: any): SzServerError {
    return fromServer<SzServerError>(new SzServerError(), source);
  }

  public static fromServerArray(sourceArray: any[]): SzServerError[] {
    return fromServerArray<SzServerError>(
      <SzServerError[]> [], sourceArray, function(){ return new SzServerError() });
  }

  public static toServer(source: SzServerError): SzServerError {
    return <SzServerError> toServer<SzServerError>(new SzServerError(), source);
  }

  public static toServerArray(sourceArray: SzServerError[]): SzServerError[] {
    return <SzServerError[]> toServerArray<SzServerError>(
      <SzServerError[]> [], sourceArray, function(){ return new SzServerError() });
  }
}
