import Vector from "../utils/Vector";

export default abstract class Moveable {
    private position: Vector;
    private velocity: Vector;

    constructor(startPosition: Vector) {
        this.position = startPosition;
        this.velocity = new Vector(0, 0);
    }

    public getPosition(): Vector {
        return this.position.getCopy();
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