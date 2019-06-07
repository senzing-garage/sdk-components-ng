import { TestBed } from '@angular/core/testing';

import { SenzingSdkModule } from './sdk.module';

//import { CustomHttp } from './custom-http.service';

describe(`SenzingSdkModule`, () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ SenzingSdkModule.forRoot() ]
        });
    });

    //it(`should not provide 'CustomHttp' service`, () => {
    //    expect(() => TestBed.get(CustomHttp)).toThrowError(/No provider for/);
    //});

    it(`should be truthy`, () => {
      expect(() => {
        return true;
      });
    })

});
