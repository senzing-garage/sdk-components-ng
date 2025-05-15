import { AfterViewInit, Directive, ElementRef, EventEmitter, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import { SzElementResizeService } from '../services/sz-element-resize-listener.service';

/**
 * Directive to listening to resize events on individual elements. Utilizes the 
 * ResizeObserver[https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver] api 
 * 
 * @example <mycomponent (onResize)="myCallBackReference($event)">
 */
@Directive({
    selector: '[onResize]',
    standalone: false
})
export class SzElementResizeObserverDirective implements AfterViewInit, OnChanges, OnDestroy {
    /** event emitter for resize event */
    @Output() onResize = new EventEmitter<ResizeObserverEntry>();
    /** @internal */
    private _listening = false;

    constructor(
        private readonly elementRef: ElementRef,
        private readonly elementResizeService: SzElementResizeService
    ) {}
    /** @internal */
    ngAfterViewInit() {
        // start listening for changes
        this.startListening();
    }
    /** @internal */
    ngOnChanges(changes: SimpleChanges) {
        if (this._listening && changes['onResize']) {
            this.stopListening();
            this.startListening();
        }
    }
    /** @internal */
    ngOnDestroy() {
        this.stopListening();
    }
    /** 
     * start listening for resize events 
     * @internal
    */
    private startListening() {
        if (!this._listening) {
            this.elementResizeService.addListener(
                this.elementRef.nativeElement,
                resize => this.onResize.emit(resize)
            );
            this._listening = true;
        }
    }
    /** 
     * stop listening for resize events
     * @internal
     */
    private stopListening() {
        if (this._listening) {
            this.elementResizeService.removeEventListener(this.elementRef.nativeElement);
            this._listening = false;
        }
    }
}