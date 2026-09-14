import BoundingBox from "@project/utils/BoundingBox";
import Vector from "@project/utils/Vector";
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

    public setPosition(vec: Vector) {
        this.position = vec;
    }

    public getBox(): BoundingBox {
        return new BoundingBox(this.position, this.height, this.width);
    }

    public getMovedBox(modifyMove: Vector): BoundingBox {
        const movement = this.getMovement();
        const movedPos = this.position.add(movement).add(modifyMove);

        return new BoundingBox(movedPos, this.height, this.width);
    }

    public setVelocity(vector: Vector) {
        this.velocity = vector;
    }

    public getMovement(): Vector {
        return this.velocity.getCopy();
    }

    public updateMove(modifyMove: Vector) {
        this.position = this.position.add(this.velocity).add(modifyMove);
    }

    public getCollisionResolutionVector(obstacle: BoundingBox, futurePos: Vector): Vector | null {
        const currentPos = this.getPosition();
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

    public getCornerSlideVector(obstacle: BoundingBox): Vector | null {
        const thresholdX = this.width * 0.6;
        const thresholdY = this.height * 0.6;
        const box = this.getBox();

        if (this.velocity.getX() !== 0 && this.velocity.getY() === 0) {
            const overlapBottom = box.getMaxY() - obstacle.getMinY();
            const overlapTop = obstacle.getMaxY() - box.getMinY();

            if (overlapBottom > 0 && overlapBottom <= thresholdY && box.getMinY() < obstacle.getMinY()) {
                return new Vector(0, -overlapBottom);
            }
            
            if (overlapTop > 0 && overlapTop <= thresholdY && box.getMaxY() > obstacle.getMaxY()) {
                return new Vector(0, overlapTop);
            }
        } else if (this.velocity.getY() !== 0 && this.velocity.getX() === 0) {
            const overlapRight = box.getMaxX() - obstacle.getMinX();
            const overlapLeft = obstacle.getMaxX() - box.getMinX();

            if (overlapRight > 0 && overlapRight <= thresholdX && box.getMinX() < obstacle.getMinX()) {
                return new Vector(-overlapRight, 0);
            }
            
            if (overlapLeft > 0 && overlapLeft <= thresholdX && box.getMaxX() > obstacle.getMaxX()) {
                return new Vector(overlapLeft, 0);
            }
        }
        
        return null;
    }
}