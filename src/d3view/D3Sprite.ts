


import { Ticks } from "./D3Util";
import { D3Layer } from "./D3Layer";
import { D3Event } from "./D3Event";

/**
 * 混合渲染3d容器
 */
export class D3Sprite extends Laya.Sprite3D {
    public d3: any;
    public ticks: Ticks;
    public d3layer: D3Layer;
    private _position: { x: number, y: number, isGlobal?: boolean };
    private _rotaAddtion = new Laya.Vector3();
    private _cache = new Laya.Vector2();
    constructor() {
        super();
        this._position = { x: 0, y: 0, isGlobal: false }
        this.transform.localScale.setValue(1.2, 1.2, 1.2);
        this.transform.localScale = this.transform.localScale;
    }

    public destroy(destoryChildren?: boolean) {
        super.destroy(destoryChildren);
        this._position = null;
        this.d3 = null;
    }

    public reset() {
        this.stopRotaion();
        this._position.x = 0;
        this._position.y = 0;
    }

    public addChild(node: Laya.Node) {
        super.addChild(node as any);
        if (node instanceof D3Sprite) {
            node.d3 = this.d3;
            node.ticks = this.ticks;
            node.d3layer = this.d3layer;
        }
        return node as Laya.Node;
    }

    public removeChild(node: Laya.Node) {
        super.removeChild(node);
        if (node instanceof D3Sprite) {
            node.d3 = null;
            node.ticks = null;
        }
        return node;
    }

    /**
     * 设置2d坐标
     * @param x 
     * @param y 
     * @param isGlobal 是否为全局坐标 默认始终计算缩放误差已适应到全局坐标
     */
    public pos(x: number, y: number, isGlobal?: boolean) {
        this._position.x = x;
        this._position.y = y;
        this._position.isGlobal = isGlobal;
        this.updatePosition();
    }

    public set x(v: number) {
        this._position.x = v;
        Laya.timer.callLater(this, this.updatePosition);
    }

    /**2d x位置 */
    public get x() {
        return this._position.x;
    }

    public set y(v: number) {
        this._position.y = v;
        Laya.timer.callLater(this, this.updatePosition);
    }

    /**2d y位置 */
    public get y() {
        return this._position.y;
    }

    /**
     * 获取校准的误差值 
     * 计算因容器嵌套产生的坐标问题
    */
    private getAdjust(position?: Laya.Vector2) {
        if (!position) position = new Laya.Vector2();
        position.setValue(0, 0);
        let parent = this.parent as D3Sprite;
        while (parent instanceof D3Sprite) {
            position.x += parent.x
            position.y += parent.y;
            parent = this.parent.parent as D3Sprite;
        }
        return position;
    }

    public updatePosition() {
        if (!this.d3) {
            return;
        }
        if (!this.d3.isReady) {
            this.d3.once(D3Event.READY, this, this.__$updatePosition);
            return;
        }
        this.__$updatePosition();
    }

    private __position: Laya.Vector3;
    private __$updatePosition() {
        let x = this._position.x;
        let y = this._position.y;
        if (!this._position.isGlobal) {
            //非全局坐标 需要消除缩放误差
            const ret = this.d3layer.get2dOffset(x, y);
            if (!ret) {
                //计算不成功
                return;
            }
            x = ret.x;
            y = ret.y;
        }
        //计算嵌套偏移
        let adjust = this._cache = this.getAdjust(this._cache);
        x += adjust.x;
        y += adjust.y;
        this.__position = this.d3.convertCoord(x, y, null, null, this.__position);
        this.transform.position.setValue(this.__position.x, this.__position.y, -5);
        this.transform.position = this.transform.position;
    }

    public setPosition(x?: number, y?: number, z?: number) {
        this.transform.position.setValue(x ?? 0, y ?? 0, z ?? 0);
        this.transform.position = this.transform.position;
    }

    public setScale(x?: number, y?: number, z?: number) {
        if (x != undefined) this.transform.localScale.x = x;
        if (y != undefined) this.transform.localScale.y = y;
        if (z != undefined) this.transform.localScale.z = z;
        this.transform.localScale = this.transform.localScale;
    }
    private _originalRotation: Laya.Quaternion;
    /**开始旋转 */
    public startRotaion(x: number, y: number, z: number) {
        let mesh: Laya.Sprite3D = this.getChildAt(0) as Laya.Sprite3D;
        if (!mesh) return;
        if (!this._originalRotation) {
            this._originalRotation = mesh.transform.rotation.clone();
        }
        mesh.transform.rotation.x = this._originalRotation.x;
        mesh.transform.rotation.y = this._originalRotation.y;
        mesh.transform.rotation.z = this._originalRotation.z;
        mesh.transform.rotation.w = this._originalRotation.w;
        mesh.transform.rotation = mesh.transform.rotation;
        this._rotaAddtion.setValue(x, y, z);
        this.ticks && this.ticks.add(this, this.updateFrameHandler);
        return this;
    }

    /**停止旋转 */
    public stopRotaion() {
        this.ticks && this.ticks.remove(this, this.updateFrameHandler);
        let mesh: Laya.Sprite3D = this.getChildAt(0) as Laya.Sprite3D;
        if (!mesh || !this._originalRotation) return;
        mesh.transform.rotation.x = this._originalRotation.x;
        mesh.transform.rotation.y = this._originalRotation.y;
        mesh.transform.rotation.z = this._originalRotation.z;
        mesh.transform.rotation.w = this._originalRotation.w;
        mesh.transform.rotation = mesh.transform.rotation;
    }

    private updateFrameHandler() {
        let mesh: Laya.Sprite3D = this.getChildAt(0) as Laya.Sprite3D;
        mesh.transform.rotate(this._rotaAddtion, false, false);
    }

    private _originalEuler: { x: number, y: number, z: number };
    /**旋转一次 */
    public rotationOnce(eulerX?: number, eulerY?: number, eulerZ?: number) {
        let mesh: Laya.Sprite3D = this.getChildAt(0) as Laya.Sprite3D;
        if (!mesh) return;
        Laya.Tween.clearAll(mesh.transform);
        if (!this._originalEuler) {
            this._originalEuler = {
                x: mesh.transform.localRotationEulerX,
                y: mesh.transform.localRotationEulerY,
                z: mesh.transform.localRotationEulerZ
            }
        }
        mesh.transform.localRotationEulerX = this._originalEuler.x;
        mesh.transform.localRotationEulerY = this._originalEuler.y;
        mesh.transform.localRotationEulerZ = this._originalEuler.z;

        Laya.Tween.to(mesh.transform, {
            localRotationEulerX: this._originalEuler.x + (eulerX ?? 0),
            localRotationEulerY: this._originalEuler.y + (eulerY ?? 0),
            localRotationEulerZ: this._originalEuler.z + (eulerZ ?? 0)
        }, 1000, Laya.Ease.circInOut, Laya.Handler.create(this, () => {
            mesh.transform.localRotationEulerX = mesh.transform.localRotationEulerX % 360;
            mesh.transform.localRotationEulerY = mesh.transform.localRotationEulerY % 360;
            mesh.transform.localRotationEulerZ = mesh.transform.localRotationEulerZ % 360;
        }))
    }
}
