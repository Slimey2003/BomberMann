import BoundingBox from "../utils/BoundingBox";
import Vector from "../utils/Vector";
import type Wall from "../wall/Wall";

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

    public getMovedBox() {
        const movement = this.getMovement();
        const movedPos = this.position.add(movement);

        return new BoundingBox(movedPos, this.height, this.width);
    }

    public setVelocity(vector: Vector) {
        this.velocity = vector;
    }

    public getMovement() {
        return this.velocity.getCopy();
    }

    public updateMove(wall: Wall | undefined) {
        if (!wall) {
            this.position.add(this.velocity);
            return;
        }
        const backVector = this.getCollisionResolutionVector(wall.getBox());
        if (backVector == null) {
            this.position.add(this.velocity);
            return;
        }
        this.position.add(this.velocity.add(backVector));
    }

    public getCollisionResolutionVector(obstacle: BoundingBox): Vector | null {
        const box = this.getBox();

        if (!box.overlaps(obstacle)) {
            return null;
        }

        const overlapX = Math.min(box.getMaxX(), obstacle.getMaxX()) - Math.max(box.getMinX(), obstacle.getMinX());
        const overlapY = Math.min(box.getMaxY(), obstacle.getMaxY()) - Math.max(box.getMinY(), obstacle.getMinY());

        if (overlapX < overlapY) {
            const obstacleCenterX = (obstacle.getMinX() + obstacle.getMaxX()) / 2;
            const pushX = this.position.getX() < obstacleCenterX ? -overlapX : overlapX;
            
            return new Vector(pushX, 0);
        }

        const obstacleCenterY = (obstacle.getMinY() + obstacle.getMaxY()) / 2;
        const pushY = this.position.getY() < obstacleCenterY ? -overlapY : overlapY;
        
        return new Vector(0, pushY);
    }
}