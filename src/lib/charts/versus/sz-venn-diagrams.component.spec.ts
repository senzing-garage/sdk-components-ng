import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzVennDiagramsComponent } from './sz-venn-diagrams.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzRecordStatsDonutChart', () => {
  let component: SzVennDiagramsComponent;
  let fixture: ComponentFixture<SzVennDiagramsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzVennDiagramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    // test fails on CI only (issue #75)
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
