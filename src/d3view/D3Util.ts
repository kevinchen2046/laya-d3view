export class Ticks {
    private _ticks: Laya.Handler[];
    private _enable: boolean;

    constructor() {
        this._ticks = [];
        this._enable = true;
    }

    public clear() {
        this._ticks.forEach(handler => handler.recover());
        this._ticks.length = 0;
    }

    public set enable(v: boolean) {
        if (this._enable != v) {
            this._enable = v;
            if (this._enable) {
                if (this._ticks.length > 0) {
                    Laya.timer.frameLoop(1, this, this.tickHandler);
                }
            } else {
                Laya.timer.clear(this, this.tickHandler);
            }
        }
    }

    public get enable() { return this._enable }

    public add(caller: any, method: Function, ...args: any[]) {
        if (!this._ticks) {
            this._ticks = [];
        }
        this._ticks.push(Laya.Handler.create(caller, method, args, false));
        if (this._enable) {
            Laya.timer.frameLoop(1, this, this.tickHandler);
        }
    }

    public remove(caller: any, method: Function) {
        for (let i = 0; i < this._ticks.length; i++) {
            let tick = this._ticks[i];
            if (tick.caller == caller && tick.method == method) {
                tick.recover();
                this._ticks.splice(i, 1);
                break;
            }
        }
        if (this._ticks.length == 0) Laya.timer.clear(this, this.tickHandler);
    }

    private tickHandler() {
        for (let tick of this._ticks) tick.run();
    }
}

export function getSetter(object: any, prop: string) {
    return Object.getPrototypeOf(object)["__lookupSetter__"](prop);
}
export function getGetter(object: any, prop: string) {
    return Object.getPrototypeOf(object)["__lookupGetter__"](prop);
}

export function proxyGetterSetter<T, U>(object: T, prop: string, detail: { caller?: any, setpre?: (value: U) => U, set?: (value: U) => void, get?: (returnValue?: U) => U }) {
    let oldSetter: (val: U) => void = getSetter(object, prop);
    let oldGetter: () => U = getGetter(object, prop);
    let proptype = Object.getPrototypeOf(object);
    proptype[`__orig_${prop}_Setter__`] = oldSetter;
    proptype[`__orig_${prop}_Getter__`] = oldGetter;
    Object.defineProperty(object, prop, {
        set: function (val) {
            if (!!detail.setpre) {
                val = detail.setpre.call(detail.caller, val);
            }
            oldSetter.call(this, val);
            if (!!detail.set) {
                detail.set.call(detail.caller, this[prop]);
            }
        },
        get: function () {
            let val = oldGetter.call(this);
            if (!!detail.get) {
                return detail.get.call(detail.caller, val);
            }
            return val
        },
        enumerable: true,
        configurable: true
    });
}

export function unProxyGetterSetter<T, U>(object: T, prop: string) {
    let proptype = Object.getPrototypeOf(object);
    let oldSetter: (val: U) => void = proptype[`__orig_${prop}_Setter__`];
    let oldGetter: () => U = proptype[`__orig_${prop}_Getter__`];
    if (oldSetter && oldGetter) {
        Object.defineProperty(object, prop, {
            set: oldSetter,
            get: oldGetter,
            enumerable: true,
            configurable: true
        });
    }
}