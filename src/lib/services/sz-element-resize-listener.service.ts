import { Injectable, NgZone, OnDestroy } from '@angular/core';

/** callback shape for resize events */
export type SzElementResizeObserverCallback = (resize: ResizeObserverEntry) => void;

/**
 * A service to ease to do the heavy lifting of adding/removing listeners for resize events on specific 
 * dom elements. Used primary by #SzElementResizeObserverDirective for adding resize event listening to elements.
 */
@Injectable()
export class SzElementResizeService implements OnDestroy {
    /** callbacks map where the element is the key and the callback is the value */
    private callbacksByElement  = new Map<Element, SzElementResizeObserverCallback>();
    /** see  https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver */
    private resizeObserver: ResizeObserver | undefined;

    constructor(private readonly ngZone: NgZone) {}

    /** @internal */
    ngOnDestroy() {
        this.disconnect();
    }
    /** add a new callback to be executed on element resize */
    public addListener(ele: Element, cb: SzElementResizeObserverCallback) {
        if(!this.resizeObserver) {
            this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
                for (const entry of entries) {
                    if(this.callbacksByElement.has(entry.target)) {
                        const cbFn = this.callbacksByElement.get(entry.target);
                        // run callback from zone
                        this.ngZone.run(() => {
                            cbFn(entry);
                        });
                    }
                }
            })
        }
        if(this.resizeObserver) this.resizeObserver.observe(ele);
        this.callbacksByElement.set(ele, cb);
    }
    /** remove a resize listener for an element */
    public removeEventListener(ele: Element) {
        if(this.callbacksByElement.has(ele) && this.resizeObserver) {
            this.resizeObserver.unobserve(ele);
            this.callbacksByElement.delete(ele);

            if (this.callbacksByElement.size === 0) {
                this.disconnect();
            }
        }
    }
    /** disconnect resize listener(s) and reset internal props 
     * @internal
    */
    private disconnect() {
        if (this.resizeObserver && this.resizeObserver.disconnect) {
            this.resizeObserver.disconnect();
        }
        this.resizeObserver     = undefined;
        this.callbacksByElement = new Map<Element, SzElementResizeObserverCallback>();
    }
}