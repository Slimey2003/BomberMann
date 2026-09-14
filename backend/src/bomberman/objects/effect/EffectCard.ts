import BoundingBox from "@project/utils/BoundingBox";
import type Vector from "@project/utils/Vector";

export default class EffectCard {
    private effectId: number;
    private position: Vector;
    private box: BoundingBox;

    constructor(pos: Vector, eff: number, height: number, width: number) {
        this.effectId = eff;
        this.position = pos;
        this.box = new BoundingBox(pos, height, width);
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