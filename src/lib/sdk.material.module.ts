import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [],
  imports: [ 
    DragDropModule, 
    MatBadgeModule, 
    MatBottomSheetModule, 
    MatButtonModule, 
    MatCheckboxModule, 
    MatChipsModule, 
    MatDialogModule, 
    MatGridListModule,
    MatIconModule, 
    MatInputModule, 
    MatMenuModule, 
    MatPaginatorModule, 
    MatSidenavModule, 
    MatSliderModule,
    MatSlideToggleModule,
    MatSortModule, 
    MatTableModule, 
    MatToolbarModule, 
    MatTooltipModule, 
    NoopAnimationsModule],
  exports: [ 
    DragDropModule, 
    MatBadgeModule, 
    MatBottomSheetModule, 
    MatButtonModule, 
    MatCheckboxModule, 
    MatChipsModule, 
    MatDialogModule,
    MatGridListModule, 
    MatIconModule,
    MatInputModule, 
    MatMenuModule,
    MatPaginatorModule, 
    MatSidenavModule, 
    MatSliderModule,
    MatSlideToggleModule,
    MatSortModule, 
    MatTableModule, 
    MatToolbarModule, 
    MatTooltipModule,
    NoopAnimationsModule
  ],
})
export class SzSdkMaterialModule { }