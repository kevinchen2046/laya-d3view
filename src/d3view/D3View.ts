

import { D3Event } from "./D3Event";
import { D3Layer } from "./D3Layer";
import { D3Sprite } from "./D3Sprite";
import { D3ViewPort } from "./D3ViewPort";


/**
 * 混合渲染容器
 * - 特点
 *      - 将无缩放的3d视图对齐到有缩放的2d容器
 *      - 使容器/对象的操作还以相对的坐标进行操作
 *      - 默认开启不绑定滚动 你可以在D3Layer初始化时设置 aglinOptions.y aglinOptions.x 为 true 以启用滚动
 * - 使用方法
 *      - ☆ `D3View.get`获取混合视图
 *      - ☆ `D3View.getLayer`获取混合层
 *      - ☆ `D3Layer.initialize`初始化混合层
 *      - ☆ `D3View.enableLayer`开启混合层显示
 *      - ☆ `D3View.disableLayer`关闭混合层显示/默认全部关闭
 *      - ☆ `D3View.update`更新视口
 *      - ☆ `D3Layer.visible`显示/隐藏
 *      - 你可以完全控制每层的显示内容
 *           - ☆`D3View.addToLayerTop` 最上层2d层
 *           - ☆`D3View.addToLayer` 直接添加到中间3d层
 *           - ☆`D3View.addToLayerBottom` 最下层2d层
 *      - D3Layer.bindScroll 绑定到根容器 无需单独调用,已在初始化绑定
 */
export class D3View extends Laya.EventDispatcher {
    private static __map: { [name: string]: D3View };
    /**
     * 获取混合视图 
     * @param name
     */
    public static get(name: string) {
        if (!D3View.__map) D3View.__map = {};
        return D3View.__map[name] || (D3View.__map[name] = new D3View(name));
    }


    private _layers: D3Layer[];
    private _d3vp: D3ViewPort;
    private _curLayer: D3Layer;
    constructor(name: string) {
        super();
        this._d3vp = new D3ViewPort();
        this._d3vp.initialize(name);
        this._layers = [];
    }

    /**
     * 创建混合层
     * @param name 层名称
     * @param options 层设置
     * @returns 
     */
    private createLayer(name: string = "default") {
        let layer = new D3Layer(this);
        layer.name = name;
        layer.d3 = this;
        this._layers.push(layer);
        return layer;
    }

    /**
     * 开启混合层
     * @param name 
     */
    public enableLayer(name: string) {
        for (let layer of this._layers) {
            if (layer.name != name) {
                layer.remove();
            }
        }
        this._curLayer = this.addLayer(name);
        this.update();
    }

    /**
     * 关闭混合层
     * @param name 默认关闭全部混合层 
     * @returns 
     */
    public disableLayer(name?: string) {
        if (name) {
            if (this._curLayer == this.removeLayer(name)) {
                this._curLayer = null;
            }
            return;
        }
        for (let layer of this._layers) {
            layer.remove();
        }
        this._curLayer = null;
    }

    /**
     * 获取混合层
     * @param name 
     * @returns 
     */
    public getLayer(name: string) {
        for (let layer of this._layers) {
            if (layer.name == name) {
                return layer;
            }
        }
        return this.createLayer(name);
    }

    private addLayer(name: string) {
        let layer = this.getLayer(name);
        layer.add();
        return layer;
    }

    private removeLayer(name: string) {
        let layer = this.getLayer(name);
        layer.remove();
        return layer;
    }

    /**
     * 销毁该混合层
     * - 推荐先清理后销毁
     * @param destoryChildren 
     */
    public destroy(destoryChildren?: boolean) {
        for (let k in this._layers) {
            this._layers[k].destroy();
            this._layers[k] = null;
            delete this._layers[k];
        }
        this._d3vp.destroy(destoryChildren);
    }

    /**清理 */
    public clear() {
        for (let k in this._layers) {
            this._layers[k].clear();
        }
    }

    /**更新视口 */
    public update() {
        if (!this._curLayer) {
            return;
        }
        let aglinComp: Laya.Sprite = this._curLayer.aglinComp;
        let p = aglinComp.localToGlobal(new Laya.Point());
        let s = this._curLayer.get2dScaleOffset();
        if (!s) return;
        this.d3vp.update(p.x, p.y, aglinComp.width * s.scaleX, aglinComp.height * s.scaleY);
        this._curLayer.update(aglinComp.x, aglinComp.y, aglinComp.width, aglinComp.height);
        this._curLayer.updateScrollPosition();
        this.event(D3Event.READY);
    }

    /**
     * 转换坐标
     * @param x 2d x
     * @param y 2d x
     * @param viewRect 跟3dviewport对应的显示范围,这里的矩形是指2d的范围,跟camera.viewport是有区别的
     * @param camera 
     * @param cache 
     * @returns 
     */
    public convertCoord(x: number, y: number, viewRect?: Laya.Rectangle, camera?: Laya.Camera, cache?: Laya.Vector3) {
        if (!viewRect) viewRect = this._d3vp.viewRect;
        if (!camera) camera = this._d3vp.camera;
        if (!cache) cache = new Laya.Vector3();
        if (!viewRect) {
            console.warn(`坐标转换错误,未设置视口大小...`);
            return cache;
        }
        let sx = Laya.stage.width / viewRect.width;
        let sy = Laya.stage.height / viewRect.height;
        let tx = (x) * sx;
        let ty = (y) * sy;
        cache.setValue(tx, ty, 0);
        camera.convertScreenCoordToOrthographicCoord(cache, cache);
        return cache;
    }


    /**是否显示 */
    public setVisible(v: boolean) {
        for (let layer of this._layers) {
            layer.visible = v;
        }
        this.d3vp.scene3d.visible = v;
    }

    public get name() { return this._d3vp.camera.name }
    /**当前3d环境 */
    public get d3vp() { return this._d3vp }
    /**视图的当前宽度*/
    public get viewWidth() { return this._curLayer ? this._curLayer.width : 0 }
    /**视图的当前高度*/
    public get viewHeight() { return this._curLayer ? this._curLayer.height : 0 }
    /**3d环境是否已经就绪 */
    public get isReady() { return !!this._d3vp.viewRect };

    /**添加到场景 通常情况下你无需调用此方法 你可能需要调用`addToLayer`以将显示对象适应滚动*/
    public addChild(node: D3Sprite) {
        this._d3vp.scene3d.addChild(node);
        node.d3 = this;
    }

    public removeChild(node: D3Sprite) {
        this._d3vp.scene3d.removeChild(node);
        node.d3 = null;
    }

    /**
     * 添加到混合层
     * @param name 混合层名称
     * @param node 3d显示单位
     */
    public addToLayer(name: string, node: D3Sprite) {
        this.getLayer(name).addChild(node);
        node.d3 = this;
    }

    public removeFromLayer(name: string, node: D3Sprite) {
        this.getLayer(name).removeChild(node);
        node.d3 = null;
    }

    /**
     * 添加到混合层上层
     * @param name 混合层名称
     * @param node 2d显示单位
     */
    public addToLayerTop(name: string, node: Laya.Sprite) {
        this.getLayer(name).addChildToTop(node);
    }

    public removeFromLayerTop(name: string, node: Laya.Sprite) {
        this.getLayer(name).removeChildFromTop(node)
    }

    /**
     * 添加到混合层下层
     * @param name 混合层名称
     * @param node 2d显示单位
     */
    public addToLayerBottom(name: string, node: Laya.Sprite) {
        this.getLayer(name).addChildToBottom(node)
    }

    public removeFromLayerBottom(name: string, node: Laya.Sprite) {
        this.getLayer(name).removeChildFromBottom(node)
    }
}