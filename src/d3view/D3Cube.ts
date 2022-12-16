

/** 默认立方体 测试用*/
export class D3Cube extends Laya.MeshSprite3D {
    private material: Laya.Material;
    private _rotaAddtion: Laya.Vector3;
    constructor(size: number = 1, color?: Laya.Vector4) {
        super(Laya.PrimitiveMesh.createBox(size, size, size));
        var material: Laya.PBRSpecularMaterial = this.material = new Laya.PBRSpecularMaterial();
        material.albedoColor = color ? color : new Laya.Vector4(Math.random(), Math.random(), Math.random(), 1);
        material.smoothness = 0.8;
        // material.metallic = 0.8;
        this.meshRenderer.material = material;
        this._rotaAddtion = new Laya.Vector3();
    }

    public destroy(destoryChild?: boolean) {
        super.destroy(destoryChild);
        this.material.destroy();
    }

    /**开始旋转 */
    public startRotaion(x: number, y: number, z: number) {
        this._rotaAddtion.setValue(x, y, z);
        Laya.timer.frameLoop(1, this, this.updateFrameHandler);
        return this;
    }

    /**停止旋转 */
    public stopRotaion() {
        Laya.timer.clear(this, this.updateFrameHandler);
    }

    private updateFrameHandler() {
        this.transform.rotate(this._rotaAddtion, false, false);
    }

    public setPosition(x?: number, y?: number, z?: number) {
        this.transform.position.setValue(x ?? 0, y ?? 0, z ?? 0);
        //this.transform.position = this.transform.position;
    }

    public setScale(x?: number, y?: number, z?: number) {
        if (x != undefined) this.transform.localScale.x = x;
        if (y != undefined) this.transform.localScale.y = y;
        if (z != undefined) this.transform.localScale.z = z;
        this.transform.localScale = this.transform.localScale;
    }

    public setPosition2d(camera: Laya.Camera, x: number, y: number) {
        // x = x * Laya.stage.width / camera.viewport.width ;
        // y = y * Laya.stage.height / camera.viewport.height ;
        let vec3 = new Laya.Vector3();
        vec3.setValue(x, y, 0);
        // console.log(vec3);
        camera.convertScreenCoordToOrthographicCoord(vec3, vec3);
        vec3.z = this.transform.position.z;
        this.transform.position = vec3;
        // console.log(this.transform.position);
    }
}
