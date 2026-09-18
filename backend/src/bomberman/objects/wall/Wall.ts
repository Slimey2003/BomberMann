import BoundingBox from "@project/utils/BoundingBox";
import type Vector from "@project/utils/Vector";


export default class Wall {
    private id: string;
    private position: Vector;
    private box: BoundingBox;

    constructor(id: string, position: Vector, height: number, width: number) {
        this.id = id;
        this.position = position;
        this.box = new BoundingBox(position, height, width);
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