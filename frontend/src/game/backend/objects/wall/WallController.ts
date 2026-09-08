import Direction from "@project/utils/Direction";
import Vector from "@project/utils/Vector";
import BreakableWall from "./BreakableWall";
import Wall from "./Wall";
import BoundingBox from "@project/utils/BoundingBox";
import type { Canvas } from "@project/utils";

export default class WallController {
    private canvas: Canvas;
    private blockProbability: number;
    private walls: Map<string, Wall>;

    constructor(canvas: Canvas, blockProbability: number) {
        this.canvas = canvas;
        this.walls = new Map();
        this.blockProbability = blockProbability;
        this.placeSolidWalls();
    }

    public getWalls(): Map<string, Wall> {
        return this.walls;
    }

    public getCollidingWall(start: Vector, movement: Vector): Wall | undefined {
        let closestWall: Wall | undefined = undefined;
        let minHitTime = Infinity;
        const end = start.add(movement);

        for (const wall of this.walls.values()) {
            const hitTime = wall.getBox().intersects(start, end);
            
            if (hitTime !== null && hitTime < minHitTime) {
                minHitTime = hitTime;
                closestWall = wall;
            }
        }
        return closestWall;
    }

    public overlapsMoveableWithWall(box: BoundingBox): Wall | undefined {
        for (const wall of this.walls.values()) {
            if (wall.getBox().overlaps(box)) {
                return wall;
            }
        }
        return undefined;
    }

    public expositionOnVector(strange: number, vec: Vector): number | undefined {
        const hashKey = vec.toHashKey();
        const wall = this.walls.get(hashKey);
        if (!wall) return undefined;
        if (wall instanceof BreakableWall) {
            wall.addDamage(strange);
            if (wall.isDestroyed()) {
                this.walls.delete(hashKey);
                return wall.getEffect();
            }
        }
        
        return undefined;
    }

    public getExpositionRange(pos: Vector, range: number): Vector[] {
        return Direction.values().map(dir => this.calculateRange(pos, range, dir));
    }

    public calculateRange(pos: Vector, range: number, dir: Direction): Vector {
        const rangeVectors: Vector[] = [];
        for (let i = 1; i <= range; i++) {
            const distanceInPixels = i * (this.canvas.wallSize);
            rangeVectors.push(pos.add(dir.getVector().scale(distanceInPixels)));
        }
        
        let vecRange: Vector = new Vector(0, 0);
        
        for (const vec of rangeVectors) {
            const wall = this.walls.get(vec.toHashKey());
            
            if (!wall) {
                vecRange = vec;
            } else if (wall instanceof BreakableWall) {
                vecRange = vec;
                break;
            } else if (wall) break;
            
        }
        
        return vecRange;
    }

    private placeSolidWalls(): void {
        const size = this.canvas.wallSize;
        const columns = Math.floor(this.canvas.width / size);
        const rows = Math.floor(this.canvas.height / size);
        const xLast = columns - 1;
        const yLast = rows - 1;
        const halfSize = size / 2;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const centerX = (x * size) + halfSize;
                const centerY = (y * size) + halfSize;
                const pos = new Vector(centerX, centerY);
                const hashKey = pos.toHashKey();
                
                const isBorder = x === 0 || x === xLast || y === 0 || y === yLast;
                const isPillar = x % 2 === 0 && y % 2 === 0;
                
                if (isBorder || isPillar) {
                    this.walls.set(hashKey, new Wall(`${x}-${y}`, pos, size, size));
                    continue;
                }
                
                const distanceX = Math.min(x, xLast - x);
                const distanceY = Math.min(y, yLast - y);
                const isSafeZone = (distanceX === 1 && distanceY <= 3) || (distanceY === 1 && distanceX <= 3);
                
                if (isSafeZone || Math.random() > this.blockProbability || this.walls.has(hashKey)) {
                    continue;
                }
                
                this.walls.set(hashKey, new BreakableWall(`${x}-${y}`, pos, size, size));
            }
        }
    }
}