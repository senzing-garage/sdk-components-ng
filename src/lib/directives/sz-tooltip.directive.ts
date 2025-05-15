import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, Input, HostListener, OnInit, ComponentRef, ElementRef } from '@angular/core';
import { SzTooltipComponent } from './sz-tooltip.component';

/*@Directive({ selector: '[sz-tooltip]' })
export class SzTooltipDirective implements OnInit {
  private _overlayRef: OverlayRef;
 
  @Input('szTooltip') text = '';
 
  @HostListener('mouseenter')
  show() {
    // Create tooltip portal
    const tooltipPortal = new ComponentPortal(SzTooltipComponent);
 
    // Attach tooltip portal to overlay
    const tooltipRef: ComponentRef<SzTooltipComponent> = this._overlayRef.attach(tooltipPortal);
      
    // Pass content to tooltip component instance
    tooltipRef.instance.text = this.text;
    
    return true;
  }
 
  @HostListener('mouseout')
  hide() {
    this._overlayRef.detach();
    return true;
  }
 
  constructor(private overlayPositionBuilder: OverlayPositionBuilder,
    private elementRef: ElementRef,
    private overlay: Overlay) {}
 
  ngOnInit() {
    const positionStrategy = this.overlayPositionBuilder
      // Create position attached to the elementRef
      .flexibleConnectedTo(this.elementRef)
      // Describe how to connect overlay to the elementRef
      // Means, attach overlay's center bottom point to the         
      // top center point of the elementRef.
      .withPositions([{
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
    }]);
    // Connect position strategy
    this._overlayRef = this.overlay.create({ positionStrategy });
  }
}*/


@Directive({
    selector: '[sz-tooltip]',
    standalone: false
})
export class SzTooltipDirective implements OnInit {

  @Input('sz-tooltip') text = '';
  private overlayRef: OverlayRef;

  constructor(private overlay: Overlay,
              private overlayPositionBuilder: OverlayPositionBuilder,
              private elementRef: ElementRef) {
  }

  ngOnInit(): void {
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions([{
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      }]);

    this.overlayRef = this.overlay.create({ positionStrategy });
  }

  @HostListener('mouseenter')
  show() {
    /*const tooltipRef: ComponentRef<SzTooltipComponent>
      = this.overlayRef.attach(new ComponentPortal(SzTooltipComponent));
    tooltipRef.instance.text = this.text;
    return true;*/
  }

  @HostListener('mouseleave')
  hide() {
    /*
    this.overlayRef.detach();
    return;*/
  }
}