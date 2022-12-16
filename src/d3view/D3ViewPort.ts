export class D3ViewPort {
    public parent: Laya.Sprite;
    public scene3d: Laya.Scene3D;
    public camera: Laya.Camera;
    public light: Laya.DirectionLight;
    public viewRect: Laya.Rectangle;
    public initialize(name: string) {
        this.create();
        this.light.intensity = 1.5;
        this.camera.name = name;
        this.camera.useOcclusionCulling = true;
        this.camera.orthographic = true;
        this.camera.clearFlag = Laya.Camera.CLEARFLAG_DEPTHONLY;
        this.camera.clearColor = new Laya.Vector4(0.0, 0.0, 0.0, 0.1);//Laya.Vector4.ZERO;
        this.camera.orthographicVerticalSize = 7;
    }

    public destroy(destoryChildren?: boolean) {
        this.remove();
        if (this.scene3d) {
            this.scene3d.destroy(destoryChildren);
            this.scene3d = null;
        }
    }

    protected create() {
        this.scene3d = new Laya.Scene3D();
        this.light = new Laya.DirectionLight();
        this.scene3d.addChild(this.light);
        this.camera = new Laya.Camera(0, 0.3, 100);
        this.scene3d.addChild(this.camera);
    }

    public update(x: number, y: number, width: number, height: number) {
        if(!this.viewRect) this.viewRect = new Laya.Rectangle();
        this.viewRect.setTo(x, y, width, height);
        let viewport = this.camera.viewport;
        viewport.x = x * Laya.stage.clientScaleX;
        viewport.y = y * Laya.stage.clientScaleY;
        viewport.width = width * Laya.stage.clientScaleX;
        viewport.height = height * Laya.stage.clientScaleY;
        this.camera.viewport = viewport;
    }

    /**是否显示 */
    public set visible(v: boolean) {
        this.scene3d.visible = v;
    }
    public get visible() { return this.scene3d.visible }

    public get isReady() { return !!this.viewRect };

    public addTo(parent: Laya.Sprite) {
        this.parent = parent;
        this.parent.addChild(this.scene3d);
    }

    /**从父节点移除 */
    public remove() {
        this.scene3d.removeSelf();
    }

    /**清理 */
    public clear() {
        this.scene3d.removeChildren();
    }

    public addChild(node: Laya.Node) {
        this.scene3d.addChild(node)
    }

    public removeChild(node: Laya.Node) {
        this.scene3d.removeChild(node)
    }
}
