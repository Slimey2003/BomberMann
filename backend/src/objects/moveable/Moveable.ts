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

    public getBox(): BoundingBox {
        return new BoundingBox(this.position, this.height, this.width);
    }

    public getMovedBox(): BoundingBox {
        const movement = this.getMovement();
        const movedPos = this.position.add(movement);

        return new BoundingBox(movedPos, this.height, this.width);
    }

    public setVelocity(vector: Vector) {
        this.velocity = vector;
    }

    public getMovement(): Vector {
        return this.velocity.getCopy();
    }

    public updateMove(wall: Wall | undefined) {
        if (!wall) {
            this.position = this.position.add(this.velocity);
            return;
        }
        const backVector = this.getCollisionResolutionVector(wall.getBox());
        if (!backVector) {
            this.position = this.position.add(this.velocity);
            return;
        }
        this.position = this.position.add(this.velocity).add(backVector);
    }

    public getCollisionResolutionVector(obstacle: BoundingBox): Vector | null {
        const currentPos = this.getPosition();
        const futurePos = currentPos.add(this.velocity);


        const box = new BoundingBox(futurePos, this.height, this.width);

        if (!box.overlaps(obstacle)) {
            return null;
        }

        const expandedObstacle = new BoundingBox(
            new Vector(obstacle.centerX(), obstacle.centerY()),
            obstacle.getHeight() + this.height,
            obstacle.getWidth() + this.width
        );

        
        const hitTime = expandedObstacle.intersects(currentPos, futurePos);

        if (hitTime === null) {
            return null;
        }
        const safeMove: Vector = this.velocity.scale(hitTime);
        
        return safeMove.subtract(this.velocity);
    }
}