import BoundingBox from "../utils/BoundingBox";
import type Vector from "../utils/Vector";

export default class EffectCard {
    private effectId: number;
    private position: Vector;
    private box: BoundingBox;

    constructor(pos: Vector, eff: number) {
        this.effectId = eff;
        this.position = pos;
        this.box = new BoundingBox(pos, 9, 9);
    }

    public getPosition(): Vector {
        return this.position;
    }

    public getEffectId(): number {
        return this.effectId;
    }

    public getBox(): BoundingBox {
        return this.box;
    }
}