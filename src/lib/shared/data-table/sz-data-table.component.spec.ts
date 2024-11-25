import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzDataTable } from './sz-data-table.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailGraphControlComponent', () => {
  let component: SzDataTable;
  let fixture: ComponentFixture<SzDataTable>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzDataTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
