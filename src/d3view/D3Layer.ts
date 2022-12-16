import { D3Sprite } from "./D3Sprite";
import { proxyGetterSetter, Ticks, unProxyGetterSetter } from "./D3Util";
import { D3View } from "./D3View";

export type GComponent = {
    parent: GComponent
    scrollPane: any;
    displayObject: Laya.Sprite,
    displayListContainer: Laya.Sprite
}

export type AglinComponent = GComponent | Laya.Sprite;

export type D3LayerOptions = {
    /**对齐容器 当前控件会添加到对齐容器的同一层级**/
    aglinComp: AglinComponent,
    /**滚动设置 */
    scroll?: {
        /**Y方向滚动开启 默认关闭 */
        y?: boolean,
        /**X方向滚动开启 默认关闭 */
        x?: boolean
    }
}

/**
 * 混合层 包含3d和2d层
 */
export class D3Layer extends D3Sprite {
    public top: Laya.Sprite;
    public bottom: Laya.Sprite;
    public ticks: Ticks;
    private _aglinComp: AglinComponent;
    public scrollContainer: Laya.Sprite;
    constructor(d3: D3View) {
        super();
        this.d3 = d3;
        this.top = new Laya.Sprite();
        this.top.mouseEnabled = false;
        this.bottom = new Laya.Sprite();
        this.bottom.mouseEnabled = false;
        this.ticks = new Ticks();
        this.d3layer = this;
    }

    /**
     * 初始化
     * @param aglinComp 对齐容器 当前控件会添加到对齐容器的同一层级
     * @param aglinOptions.y Y方向滚动开启 默认开启
     * @param aglinOptions.x X方向滚动开启 默认关闭
     * @returns 
     */
    public initialize(options: D3LayerOptions) {
        this._aglinComp = options.aglinComp;
        this.bindScroll(options.scroll?.y, options.scroll?.x);
        return this;
    }

    /**默认的父级容器 */
    public get deafultParent(): Laya.Sprite {
        if (this._aglinComp instanceof Laya.Sprite) {
            return this._aglinComp.parent as Laya.Sprite;
        }
        return this._aglinComp.parent.displayListContainer;
    }

    /**默认的父级容器 */
    public get aglinComp(): Laya.Sprite {
        if (this._aglinComp instanceof Laya.Sprite) {
            return this._aglinComp;
        }
        return this._aglinComp.displayObject;
    }

    /**添加显示 */
    public add() {
        if (!this.isOnView && !!this._aglinComp) {
            this.deafultParent.addChild(this.bottom);
            this.d3.d3vp.addTo(this.deafultParent);
            this.d3.d3vp.scene3d.addChild(this);
            this.deafultParent.addChild(this.top);
            this.ticks.enable = true;
        }
    }

    /**移除显示 */
    public remove() {
        if (this.isOnView) {
            this.d3.d3vp.remove();
            this.removeSelf();
            this.top.removeSelf();
            this.bottom.removeSelf();
            this.ticks.enable = false;
        }
    }

    /**是否处于显示状态 */
    public get isOnView() {
        return !!this.top.parent;
    }

    /**清理 */
    public clear() {
        this.d3.d3vp.clear();
        this.top.removeChildren();
        this.bottom.removeChildren();
    }

    /**
     * 销毁该混合层
     * - 推荐先清理后销毁
     * @param destoryChildren 
     */
    public destroy(destoryChildren?: boolean) {
        this.remove();
        this.ticks.clear();
        super.destroy(destoryChildren);
        if (this.top) {
            this.top.destroy(destoryChildren);
            this.top = null;
        }
        if (this.bottom) {
            this.bottom.destroy(destoryChildren);
            this.bottom = null;
        }
    }

    /**
     * 更新3d
     */
    public update(x: number, y: number, width: number, height: number) {
        this.top.pos(x, y);
        this.bottom.pos(x, y);
        this.setScrollRect(this.top, 0, 0, width, height);
        this.setScrollRect(this.bottom, 0, 0, width, height);
        this.updatePosition();
        for (let i = 0; i < this.numChildren; i++) {
            let d3sprite = this.getChildAt(i);
            if (d3sprite instanceof D3Sprite) {
                d3sprite.updatePosition();
            }
        }
    }

    /**
     * 绑定根容器滚动跟随
     * @param y 
     * @param x 
     * */
    public bindScroll(y: boolean = false, x: boolean = false) {
        if (!this._aglinComp) return;
        if (!y && !x) return;
        if (this._aglinComp instanceof Laya.Sprite) {
            if (this._aglinComp instanceof Laya.List) {
                this.scrollContainer = this._aglinComp.getChildAt(0) as Laya.Sprite;
            } else {
                this.scrollContainer = this._aglinComp;
            }

            let __this = this;
            if (x) {
                let defaultX = this.scrollContainer.scrollRect.x;
                Object.defineProperty(this.scrollContainer.scrollRect, "x", {
                    set: function (v) {
                        this._x = v;
                        __this.__updateScrollPosition();
                    },
                    get: function () {
                        return this._x
                    }
                });
                this.scrollContainer.scrollRect.x = defaultX;
            }
            if (y) {
                let defaultY = this.scrollContainer.scrollRect.y;
                Object.defineProperty(this.scrollContainer.scrollRect, "y", {
                    set: function (v) {
                        this._y = v;
                        __this.__updateScrollPosition();
                    },
                    get: function () {
                        return this._y
                    }
                });
                this.scrollContainer.scrollRect.y = defaultY;
            }
        } else {
            this.scrollContainer = this._aglinComp.scrollPane["_container"];
            if (x) {
                proxyGetterSetter(this.scrollContainer, "x", {
                    caller: this,
                    set: (value: number) => {
                        this.__updateScrollPosition();
                    }
                });
            }
            if (y) {
                proxyGetterSetter(this.scrollContainer, "y", {
                    caller: this,
                    set: (value: number) => {
                        this.__updateScrollPosition();
                    }
                });
            }
        }
        this.updateScrollPosition();
        return this;
    }

    public unBindScroll() {
        if (this.scrollContainer) {
            if (this._aglinComp instanceof Laya.Sprite) {
                let __valueX = this._aglinComp.scrollRect.x;
                let __valueY = this._aglinComp.scrollRect.y;
                Object.defineProperty(this.scrollContainer.scrollRect, "x", { value: __valueX });
                Object.defineProperty(this.scrollContainer.scrollRect, "y", { value: __valueY });
            } else {
                unProxyGetterSetter(this.scrollContainer, "x");
                unProxyGetterSetter(this.scrollContainer, "y");
            }
            this.scrollContainer = null;
        }
    }

    public updateScrollPosition() {
        if (this._aglinComp && this.d3.isReady) {
            this.__updateScrollPosition();
        }
    }

    private __updateScrollPosition() {
        let p1 = (this.scrollContainer as Laya.Sprite).localToGlobal(new Laya.Point());
        if (!this.isOnView) return;

        if (this._aglinComp instanceof Laya.Sprite) {
            if (!this.scrollContainer.scrollRect) return;
            this.updateScrollHandler(this.scrollContainer.scrollRect.x, this.scrollContainer.scrollRect.y, p1.x - this.d3.d3vp.viewRect.x, p1.y - this.d3.d3vp.viewRect.y);
        } else {
            this.updateScrollHandler(-this.scrollContainer.x, -this.scrollContainer.y, p1.x - this.d3.d3vp.viewRect.x, p1.y - this.d3.d3vp.viewRect.y);
        }
    }

    private updateScrollHandler(x2d: number, y2d: number, x3d: number, y3d: number) {
        this.top.scrollRect.x = x2d;
        this.top.scrollRect.y = y2d;
        this.bottom.scrollRect.x = x2d;
        this.bottom.scrollRect.y = y2d;
        this.pos(x3d, y3d, true);
    }

    private setScrollRect(d2: Laya.Sprite, x: number, y: number, width: number, height: number) {
        let rect = d2.scrollRect;
        if (!rect) rect = new Laya.Rectangle();
        rect.setTo(x, y, width, height);
        d2.scrollRect = rect;
    }

    public get2dOffset(x: number, y: number) {
        let scale = this.get2dScaleOffset();
        if (!scale) return null;
        return { x: x * scale.scaleX, y: y * scale.scaleY }
    }

    public get2dScaleOffset() {
        let scaleX = 1;
        let scaleY = 1;
        let cur = this.aglinComp;
        while (cur != Laya.stage) {
            if (!cur) return null;
            scaleX *= cur.scaleX;
            scaleY *= cur.scaleY;
            cur = cur.parent as Laya.Sprite;
        }
        return { scaleX: scaleX, scaleY: scaleY }
    }

    public addChildToTop(node: Laya.Sprite) {
        this.top.addChild(node);
    }

    public removeChildFromTop(node: Laya.Sprite) {
        this.top.removeChild(node)
    }

    public addChildToBottom(node: Laya.Sprite) {
        this.bottom.addChild(node)
    }

    public removeChildFromBottom(node: Laya.Sprite) {
        this.bottom.removeChild(node)
    }

    public set visible(v: boolean) {
        this.top.visible = this.bottom.visible = this.active = v;
    }

    public get visible() {
        return this.top.visible;
    }

    public get width() { return this.aglinComp.width }
    public get height() { return this.aglinComp.height }
}
