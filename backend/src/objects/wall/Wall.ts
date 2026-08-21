import type Vector from "../utils/Vector";

export default class Wall {
    private position: Vector

    constructor(position: Vector) {
        this.position = position;
    }

    public getPosition(): Vector {
        return this.position;
    }
}