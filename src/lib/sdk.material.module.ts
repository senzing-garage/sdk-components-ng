import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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