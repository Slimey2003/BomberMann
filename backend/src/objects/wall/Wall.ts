import BoundingBox from "../utils/BoundingBox";
import type Vector from "../utils/Vector";

export default class Wall {
    private position: Vector;
    private box: BoundingBox;

    constructor(position: Vector) {
        this.position = position;
        this.box = new BoundingBox(position, 10, 10);
    }

    public getBox(): BoundingBox {
        return this.box;
    }

    public getPosition(): Vector {
        return this.position;
    }
}