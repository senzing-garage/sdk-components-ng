import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Observable, of, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators'
//import 'rxjs/add/observable/fromPromise'; // no idea where these are
//import 'rxjs/add/operator/catch'; // no idea where these are

import { SzMappingAttr } from '../models/mapping-attr';
import { SzRestConfiguration } from '../common/sz-rest-configuration';

@Injectable({
  providedIn: 'root'
})
export class SzMappingAttrService {
  private mappingAttrsPath = 'mapping-attributes';

  constructor(private http: HttpClient, @Inject(SzRestConfiguration) private apiConfiguration: SzRestConfiguration) {
    // do nothing
  }

  getAttributes(): Observable<SzMappingAttr[]> {
    const url = this.getMappingAttrsURL();
    return this.http.get<any[]>(url).pipe(
      switchMap(response => of(
        this.resolveArray<SzMappingAttr>(<SzMappingAttr[]> [],
                                         response,
                                         () => new SzMappingAttr())
      ))
    )
  }

  getAttribute(attrCodeOrId: string|number)
    : Observable<SzMappingAttr> {
    return this.http.get(this.getMappingAttrURL(attrCodeOrId)).pipe(
      switchMap(response => of(
        this.resolve<SzMappingAttr>(new SzMappingAttr(), response)))
    )
  }

  private getMappingAttrsURL(): string {
    let baseURL = this.apiConfiguration.basePath;
    if (!baseURL.endsWith('/')) {
      baseURL = baseURL + '/';
    }
    return baseURL + this.mappingAttrsPath;
  }

  private getMappingAttrURL(attrIdOrCode: number | string)
  : string {
    let attrsURL = this.getMappingAttrsURL();
    if (!attrsURL.endsWith('/')) {
      attrsURL = attrsURL + '/';
    }
    return attrsURL + attrIdOrCode;
  }

  private resolveArray<T>(target: T[], source: any[], producer: () => T): T[] {
    source.forEach(s => {
      target.push(this.resolve<T>(producer(), s));
    });
    return target;
  }

  private resolve<T>(target: T, source: any): T {
    let field: string;
    for (field in source) {
      if (source.hasOwnProperty(field)) {
        switch (field) {
          case 'createdOn':
          case 'lastModified':
            if (typeof source[field] === 'number') {
              target[field] = new Date(source[field]);
              break;
            } else {
              target[field] = source[field];
              break;
            }
          default:
            target[field] = source[field];
        }
      }
    }
    return target;
  }
}
