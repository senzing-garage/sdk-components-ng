import { Injectable } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Observable, fromEventPattern, Subject } from 'rxjs';
import { map, tap, mapTo } from 'rxjs/operators';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';
import { SzEntityDetailComponent } from '../entity/detail/sz-entity-detail.component';
/**
 * Utility service for creating and manipulating PDF files from components and models.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzPdfUtilService {
  constructor(
    private entityDataService: EntityDataService,
    private titleCasePipe: TitleCasePipe,
    private configService: ConfigService) {}

  /**
   * Create a downloadable PDF from an HTMLElement node. Uses canvas as an intermediary.
   */
  public createPdfFromHtmlElement(node: HTMLElement | any, filename: string = 'result.pdf'): Promise<boolean> {
    console.log('SzPdfUtilService.createPdfFromHtmlElement: ',node);

    return new Promise((res, reject) => {
      html2canvas(node).then(canvas => {
        // Few necessary setting options
        var imgWidth = 208;
        var pageHeight = 295;
        var imgHeight = canvas.height * imgWidth / canvas.width;
        var heightLeft = imgHeight;

        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        var position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
        pdf.save('MYPdf.pdf'); // Generated PDF

        res(true);
      }, (err)=>{
        console.error(err);
        reject(false);
      });
    });
  }
  /**
   * Create a downloadable PDF from an entity search result.
   */
  public createPdfFromEntitySearch(data: SzEntityData): void{
    console.log('SzPdfUtilService.createPdfFromAttributeSearch: ', data);

    const doc = new jsPDF();
    const entity = data.resolvedEntity;
    if(data && data.resolvedEntity) {
      let pIndex = 0;
      let pLineY = 10;
      const pMarginLeft = 10;
      const pLineHeight = 12;
      const rNameHeight = 20;
      const rAddrHeight = 12;
      const resultSpacing = 20;
      const pHeadHeight = 20;

      doc.setFontSize(rNameHeight);
      doc.text(entity.entityName, pMarginLeft, pLineY); pLineY = pLineY+(rNameHeight - (rNameHeight / 2));

      doc.save(`${entity.entityName.toLowerCase().replace(' ','-')}-${entity.entityId}.pdf`);
    }
  }
  /**
   * Create a downloadable PDF from a attribute search result.
   */
  public createPdfFromAttributeSearch(data: SzAttributeSearchResult[], searchParams?: SzEntitySearchParams, resultsPerPage: number = 10): void {
    console.log('SzPdfUtilService.createPdfFromAttributeSearch: ', data, searchParams);
    const doc = new jsPDF();

    let pages = 1;
    let pIndex = 0;
    let pLineY = 10;
    const pMarginLeft = 10;
    const pLineHeight = 12;
    const rNameHeight = 20;
    const rAddrHeight = 12;
    const resultSpacing = 20;
    const pHeadHeight = 20;

    data.forEach((entity: SzAttributeSearchResult, ind: number) => {
      if(pIndex >= resultsPerPage) {
        console.log('\tadd page to pdf: '+ (pages + 1));
        doc.addPage("p");
        pages++;
        pIndex = 1;
        pLineY = 10;
      } else {
        pIndex++;
      }
      if(pIndex === 1) {
        console.log('add header');
        this.addHeaderForAttributeSearch(doc, data, searchParams, pHeadHeight);
        pLineY = pLineY+pHeadHeight+resultSpacing;
      }
      console.log(`\tadd search result entry: ${ind}`);
      doc.setFontSize(rNameHeight);
      doc.text(entity.entityName, pMarginLeft, pLineY); pLineY = pLineY+(rNameHeight - (rNameHeight / 2));

      let nameAndAddrData = entity.nameData.concat(entity.attributeData).concat( entity.addressData );
      let addrAndPhoneData = entity.addressData.concat( entity.phoneData );

      doc.setFontSize(rAddrHeight);
      nameAndAddrData.forEach( (line: string) => {
        doc.text(line, pMarginLeft, pLineY); pLineY = pLineY+ (rAddrHeight - 4);
      });
      pLineY = pLineY+resultSpacing;
    });

    let filename = 'search-by';
    if(searchParams){
      filename += "-";
      const attrs = this.getDisplayAttributes(searchParams);
      if(attrs.length > 0){
        filename += attrs.map( (attr: { attr: string, value: string }) => {
          return attr.attr.toLowerCase().replace(' ','-') +'-'+ attr.value.toLowerCase().replace(' ','-');
        }).join('-');
      }
    }
    doc.save(`${filename}.pdf`);
  }

  private getDisplayAttributes(value: SzEntitySearchParams): { attr: string, value: string }[] {
    let attributeDisplay = Object.keys(value)
      .filter((key, index, self) => {
        if(key === 'IDENTIFIER_TYPE'){
          return Object.keys(self).includes('IDENTIFIER');
        }
        if(key === 'NAME_TYPE'){
          return false;
        }
        if(key === 'ADDR_TYPE'){
          return false;
        }
        if(key === 'COMPANY_NAME_ORG'){
          return false;
        }

        return true;
      })
      .map(key => {
        const humanKeys = {
          'PHONE_NUMBER':'PHONE',
          'NAME_FULL':'NAME',
          'PERSON_NAME_FULL':'NAME',
          'NAME_FIRST':'FIRST NAME',
          'NAME_LAST':'LAST NAME',
          'EMAIL_ADDRESS': 'EMAIL',
          'ADDR_CITY':'CITY',
          'ADDR_STATE':'STATE',
          'ADDR_POSTAL_CODE':'ZIP CODE',
          'SSN_NUMBER':'SSN',
          'DRIVERS_LICENSE_NUMBER':'DL#'
        }
        let retVal = {'attr': key, 'value': value[key]};                  // temp const
        if(humanKeys[retVal.attr]){ retVal.attr = humanKeys[retVal.attr]; };      // repl enum val with human readable
        retVal.attr = this.titleCasePipe.transform(retVal.attr.replace(/_/g,' ')); // titlecase trans

        return retVal
      })
      .filter(i => !!i);
    return attributeDisplay;
  }

  private addHeaderForAttributeSearch(doc: jsPDF, searchResults?: SzAttributeSearchResult[] | undefined | null, searchParams?: SzEntitySearchParams | undefined | null, yPos: number = 20, page: number = 1, pageTotal: number = 1): void {
    doc.text(`page ${page} of ${pageTotal}`, 160, yPos);
    doc.setLineWidth(1);
    doc.line(10,yPos + 10, 200,yPos + 10);
    let xPos = 10;

    // search criteria header
    if(searchParams){
      let attributes = this.getDisplayAttributes(searchParams);
      console.warn('search header: ', attributes, searchResults);
      let headerStr = (searchResults && searchResults.length) ? `${searchResults.length} Results found for` : `Results for`;
      doc.text(headerStr, 10, yPos); yPos=yPos+2;
      yPos = yPos+5;
      attributes.forEach((attribute) => {
        doc.text(`${attribute.attr}: ${attribute.value}`, xPos, yPos); xPos=xPos+10;
      });
      yPos=yPos+10;
    }
    //doc.text(`${searchResultsTotal} of ${pageTotal}`, 160, yPos); yPos=yPos+3;

    /*
    <div class="sz-search-results-total-summary">
        <div class="sz-search-results-total" *ngIf="searchResults && searchValue">
          <span class="sz-search-results-total-bold">{{searchResultsTotal}} Results </span>found for
          <div>
            <ng-container *ngFor="let attribute of attributeDisplay">{{attribute?.attr}}
              <span *ngIf="attribute?.value">:</span>
              <span class="sz-search-results-parameter-value">{{attribute?.value}}&nbsp;</span>
            </ng-container>
          </div>
        </div>
    </div>
    */

  }
}
