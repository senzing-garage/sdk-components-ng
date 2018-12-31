import { Injectable, Inject } from '@angular/core';
// import { SzGlobalRuntime } from '../../global-runtime.service';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SzEntitySearchParams } from './sz-search-params.model';
import { HttpResponse } from '@angular/common/http/src/response';
import { SzRestConfiguration } from '../common/sz-rest-configuration';

@Injectable({
  providedIn: 'root'
})
export class SzSearchHttpService {
  private searchPath = 'projects';
  private entityIdPath = 'by-entity-id';
  private recordIdPath = 'by-record-id';

  constructor(
    private http: HttpClient,
    @Inject(SzRestConfiguration) private apiConfiguration: SzRestConfiguration) {

    console.warn('SzSearchHttpService: ', this.apiConfiguration, this);
  }

  public search(queryParams: SzEntitySearchParams, projectId: number): Observable<any> {
    let params = new HttpParams();
    const {name, dob, email, phoneNumber, identifier, type, address} = queryParams;
    const q = JSON.stringify(queryParams);
    params = params.append('q', q);
    const url = this.getSearchURL(projectId);
    return this.http.get(url, {params});
  }

  searchByAttributes(queryParams: SzEntitySearchParams, projectId: number): Observable<any> {
    let params = new HttpParams();
    params = params.append('q', this.asSingleQueryParameter(queryParams));
    const url = this.getSearchByAttributeURL(projectId);
    return this.http.get(url, {params});
  }

  searchCsvByAttributes(searchParams: SzEntitySearchParams, id: number): Observable<HttpResponse<Blob>> {
    const url = this.getSearchByAttributeURL(id);
    return this.http.get(url, {
      headers: new HttpHeaders().append('Accept', 'application/csv; charset=UTF-8'),
      params: new HttpParams().append('q', this.asSingleQueryParameter(searchParams)),
      observe: 'response' as 'response',
      responseType: 'blob' as 'blob'
    });
  }

  public getEntityByEntityId(projectId: number, entityId: number) {
    const params = new HttpParams();
    params.append('projectId', `${projectId}`);
    params.append('entityId', `${entityId}`);
    const url = this.getEntityByEntityIdURL(entityId, projectId);
    return this.http.get(url, {params});
  }

  getEntityByRecordId(projectId: number, recordId: number, dataSource: string) {
    const params = new HttpParams();
    params.append('projectId', `${projectId}`);
    params.append('recordId', `${recordId}`);
    params.append('dataSource', `${dataSource}`);
    const url = this.getEntityByRecordIdURL(recordId, dataSource);
    return this.http.get(url, {params});
  }

  private getSearchURL(projectId: number): string {
    let baseURL = this.apiConfiguration.basePath;
    if (!baseURL.endsWith('/')) {
      baseURL = `${baseURL}/`;
    }
    return `${baseURL}${this.searchPath}/${projectId}/entities/query`;
  }
  private getSearchByAttributeURL(projectId: number): string {
    let baseURL = this.apiConfiguration.basePath;
    if (!baseURL.endsWith('/')) {
      baseURL = `${baseURL}/`;
    }
    return `${baseURL}${this.searchPath}/${projectId}/entities/search`;
  }
  private getEntityByEntityIdURL(entityId: number, projectId: number): string {
    let baseURL = this.apiConfiguration.basePath;
    if (!baseURL.endsWith('/')) {
      baseURL = `${baseURL}/`;
    }
    return `${baseURL}projects/${projectId}/entities/by-entity-id/${entityId}`;
    // return `${baseURL}${this.entityIdPath}/${entityId}/search`;
  }
  private getEntityByRecordIdURL(recordId: number, dataSource: string): string {
    let baseURL = this.apiConfiguration.basePath;
    if (!baseURL.endsWith('/')) {
      baseURL = `${baseURL}/`;
    }
    return `${baseURL}${this.recordIdPath}/${dataSource}/${recordId}/query`;
  }
  private transformQueryKeys(params: SzEntitySearchParams) {
    const keyMap = {
      email: 'EMAIL_ADDRESS',
      phoneNumber: 'PHONE_NUMBER',
      dob: 'DATE_OF_BIRTH',
      name: 'PERSON_NAME_FULL',
      address: 'ADDR_FULL',
      orgName: 'COMPANY_NAME_ORG'
    };

    const typeField = {
      [params.type] : params.identifier
    };
    const combined = {...params, ...typeField};
    this.stripUnusedKeys(combined);

    const keyValues = Object.keys(combined).map(key => {
      const newKey = keyMap[key] || key;
      return {[newKey]: params[key] || params.identifier};
    });
    return Object.assign({}, ...keyValues);
  }

  private stripUnusedKeys(obj): void {
    Object.keys(obj).forEach(key => (
      (
        obj[key] === '' ||
        obj[key] === null ||
        obj[key] === 'null' ||
        key === 'type' ||
        key === 'identifier') && delete obj[key]));
  }

  private asSingleQueryParameter(queryParams: SzEntitySearchParams): string {
    const toBackEndParams = this.transformQueryKeys(queryParams);
    return JSON.stringify(toBackEndParams);
  }
}
