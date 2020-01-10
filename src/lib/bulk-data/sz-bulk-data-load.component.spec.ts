import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzBulkDataLoadComponent } from './sz-bulk-data-load.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzBulkDataLoadComponent', () => {
  let component: SzBulkDataLoadComponent;
  let fixture: ComponentFixture<SzBulkDataLoadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzBulkDataLoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
