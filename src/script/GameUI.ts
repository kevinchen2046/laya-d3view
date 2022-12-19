import { D3Cube } from "src/d3view/D3Cube";
import { D3Sprite } from "src/d3view/D3Sprite";
import { D3View } from "src/d3view/D3View";
import { ui } from "./../ui/layaMaxUI";
/**
 * 本示例采用非脚本的方式实现，而使用继承页面基类，实现页面逻辑。在IDE里面设置场景的Runtime属性即可和场景进行关联
 * 相比脚本方式，继承式页面类，可以直接使用页面定义的属性（通过IDE内var属性定义），比如this.tipLbll，this.scoreLbl，具有代码提示效果
 * 建议：如果是页面级的逻辑，需要频繁访问页面内多个元素，使用继承式写法，如果是独立小模块，功能单一，建议用脚本方式实现，比如子弹脚本。
 */
export default class GameUI extends ui.test.TestSceneUI {

    public list: Laya.List;
    constructor() {
        super();

        Laya.stage.bgColor = "#361c1c";

        this.list = this.getChildByName("list") as Laya.List;
        this.list.x=Laya.stage.width/2-this.list.width/2;
        this.list.y=Laya.stage.height/2-this.list.height/2;
        var data: Array<any> = [];
        for (var m: number = 0; m < 20; m++) {
            data.push({ m_label: "No." + m });
        }
        this.list.array = data;

        let view = D3View.get("ui");
        let layer = view.getLayer("panel1");
        layer.initialize({
            aglinComp: this.list,
            scroll: { y: true }
        });
        view.enableLayer("panel1");

        let cellHeight = 94;
        let iconSize = 80;
        let offset = { x: 231, y: 8 };
        for (let i = 0; i < data.length; i++) {
            let cube = this.createCube(0.8);
            view.addToLayer("panel1", cube);
            cube.pos(offset.x + iconSize / 2, offset.y + iconSize / 2 + cellHeight * i);
            cube.startRotaion(1, 1, 1);
        }

        Laya.stage.on(Laya.Event.RESIZE, this, () => {
            D3View.get("ui").update();
            console.log(this);
        });

        //this.addTestCube();
    }   

    onOpened(param: any): void {
        D3View.get("ui").update();
    }

    onClosed(type?: string): void {
        D3View.get("ui").disableLayer();
    }


    createCube(scale: number = 1) {
        let sprite = new D3Sprite();
        let cube = new D3Cube(0.5);
        cube.setScale(scale, scale, scale);
        sprite.addChild(cube);
        return sprite;
    }

    addTestCube() {
        let view=D3View.get("ui");
        let cube = this.createCube();
        view.addToLayer("panel1", cube);
        let shape = new Laya.Sprite();
        Laya.stage.addChild(shape);
        shape.alpha = 0.5;
        shape.graphics.drawCircle(0, 0, 5, "#ffff00");

        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, () => {
            shape.pos(Laya.stage.mouseX, Laya.stage.mouseY);
            cube.pos(Laya.stage.mouseX - view.d3vp.viewRect.x, Laya.stage.mouseY - view.d3vp.viewRect.y, true);
            cube.rotationOnce(0, 360, 0);
        });
    }

}