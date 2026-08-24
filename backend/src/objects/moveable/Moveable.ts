import BoundingBox from "../utils/BoundingBox";
import Vector from "../utils/Vector";

export default abstract class Moveable {
    private position: Vector;
    private velocity: Vector;
    private height: number;
    private width: number;

    constructor(startPosition: Vector, height: number, width: number) {
        this.position = startPosition;
        this.velocity = new Vector(0, 0);
        this.height = height;
        this.width = width;
    }

    public getPosition(): Vector {
        return this.position.getCopy();
    }

    public getBox() {
        return new BoundingBox(this.position, this.height, this.width);
    }

    public setVelocity(vector: Vector) {
        this.velocity = vector;
    }

    public getMovement(gameTime: number) {
        return this.velocity.scale(gameTime);
    }

    public updateMove(movement: Vector) {
        this.position = this.position.add(movement);
    }
}