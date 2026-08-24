import BoundingBox from "../utils/BoundingBox";
import type Vector from "../utils/Vector";

export default class Wall {
    private id: string;
    private position: Vector;
    private box: BoundingBox;

    constructor(id: string, position: Vector) {
        this.id = id;
        this.position = position;
        this.box = new BoundingBox(position, 10, 10);
    }

    public getId(): string {
        return this.id;
    }

    public getBox(): BoundingBox {
        return this.box;
    }

    public getPosition(): Vector {
        return this.position;
    }
}