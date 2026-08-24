import BoundingBox from "../utils/BoundingBox";
import type Vector from "../utils/Vector";
import Effect from "./Effect";

export default class EffectCard {
    private effect: Effect;
    private position: Vector;
    private box: BoundingBox;

    constructor(pos: Vector, eff: Effect) {
        this.effect = eff;
        this.position = pos;
        this.box = new BoundingBox(pos, 9, 9);
    }

    public getPosition(): Vector {
        return this.position;
    }

    public getEffect(): Effect {
        return this.effect;
    }

    public getBox(): BoundingBox {
        return this.box;
    }
}