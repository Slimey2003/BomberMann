import type Bomb from "../moveable/Bombs";
import { Direction } from "../utils/Direction";
import type Effect from "../effect/Effect";
import Vector from "../utils/Vector";
import BreakableWall from "./BreakableWall";
import Wall from "./Wall";
import type BoundingBox from "../utils/BoundingBox";
import type ExplodeBomb from "../moveable/ExplodeBomb";

export default class WallController {
    private height: number;
    private width: number;
    private blockProbability: number;
    private walls: Map<string, Wall>;

    constructor(height: number, width: number, blockProbability: number) {
        this.height = height;
        this.width = width; 
        this.walls = new Map();
        this.blockProbability = blockProbability;
        this.placeSolidWalls();
        this.placeBreakableWalls();
    }

    public getWalls() {
        return this.walls;
    }

    public getWallInVectorDirection(start: Vector, end: Vector): Wall | undefined {
        let closestWall: Wall | undefined = undefined;
        let minHitTime = Infinity;

        for (const wall of this.walls.values()) {
            const hitTime = wall.getBox().intersects(start, end);
            //Bei mehreren Treffer die am nächsten finden
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
    }

    public expositionOnVector(bomb: ExplodeBomb, vec: Vector): number | undefined {
        const wall = this.walls.get(vec.toHashKey());
        if (!wall) return undefined;
        if (wall instanceof BreakableWall) {
            wall.addDamage(bomb.getStrange());
            if (wall.isDestroyed()) {
                this.walls.delete(vec.toHashKey());
                return wall.getEffect();
            }
        }
        return undefined;
    }

    public getExpositionRange(bomb: ExplodeBomb): Vector[] {
        return Direction.values().map(dir => this.calculateRange(bomb.getBomb().getPosition(), bomb.getRange(), dir));
    }

    public calculateRange(pos: Vector, range: number, dir: Direction): Vector {
        const rangeVectors: Vector[] = [];
        for (let i = 5; i <= range; i+=5) {
            rangeVectors.push(pos.add(dir.getVector().scale(i)));
        }
        let vecRange: Vector = new Vector(0, 0);
        for (const vec of rangeVectors) {
            const wall =  this.walls.get(vec.toHashKey());
            if (!wall) {
                vecRange = vec;
            } else if (this.walls.get(vec.toHashKey()) instanceof BreakableWall) {
                vecRange = vec;
                break;
            } else if (this.walls.get(vec.toHashKey())) break;
        }
        return vecRange;
    }

    private placeSolidWalls(): void {
        const xLast = this.width - 1;
        const yLast = this.height - 1;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if ((x === 0 || x === xLast ||  y === 0 ||  y === yLast) || 
                    (x % 2 === 0 && y % 2 === 0)) {
                        const pos = new Vector(x * 10, y * 10); 
                        this.walls.set(pos.toHashKey(), new Wall(`${x}-${y}`, pos));
                }
            }
        }
    }

    private placeBreakableWalls(): void {
        const xLast = this.width - 2;
        const yLast = this.height - 2;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (
                    ((x === 1 || x === xLast) && (y === 1 || y === 2 || y === 3 || y === yLast - 1 || y === yLast - 2 || y === yLast - 3)) || //x und xLast von oben nach unten Frei lassen in den Ecken
                    ((x === 2 || x === 3 || x === xLast - 1 || x === xLast - 2) && (y === 1 || y === yLast - 1)) //y und yLast von links nach rechts Frei lassen in den Ecken 
                ) continue;
                if (Math.random() > this.blockProbability) continue;

                const pos = new Vector(x * 10, y * 10); 
                if (this.walls.get(pos.toHashKey()) !== undefined) continue;

                this.walls.set(pos.toHashKey(), new BreakableWall(`${x}-${y}`, pos));
            }
        }
    }


}