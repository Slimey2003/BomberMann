import type Bomb from "../moveable/Bombs";
import { Direction } from "../utils/Direction";
import type Effect from "../effect/Effect";
import Vector from "../utils/Vector";
import BreakableWall from "./BreakableWall";
import Wall from "./Wall";

export default class WallManager {
    private height: number;
    private width: number;
    private blockProbability: number;
    private walls: Map<Vector, Wall>;

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

    public expositionOnVector(bomb: Bomb, vec: Vector): Effect | undefined {
        const wall = this.walls.get(vec);
        if (!wall) return undefined;
        if (wall instanceof BreakableWall) {
            wall.addDamage(bomb.getStrange());
            if (wall.isDestroyed()) {
                this.walls.delete(wall.getPosition());
                return wall.getEffect();
            }
        }
        return undefined;
    }

    public getExpositionRange(bomb: Bomb): Array<Vector | undefined> {
        return Direction.values().map(dir => this.calculateRange(bomb.getPosition(), bomb.getRange(), dir));
    }

    public calculateRange(pos: Vector, range: number, dir: Direction): Vector | undefined {
        const rangeVectors: Vector[] = [];
        for (let i = 1; i <= range; i++) {
            switch (dir) {
                case Direction.NORTH:
                    rangeVectors.push(pos.add(new Vector(0, i)));
                    break;
                case Direction.SOUTH:
                    rangeVectors.push(pos.add(new Vector(0, -i)));
                    break;
                case Direction.EAST: 
                    rangeVectors.push(pos.add(new Vector(0, i)));
                    break;
                case Direction.WEST:
                    rangeVectors.push(pos.add(new Vector(0, -i)));
                    break;
            }
        }
        let vecRange: Vector | undefined = undefined;
        for (const vec of rangeVectors) {
            const wall =  this.walls.get(vec);
            if (!wall) {
                vecRange = vec;
            } else if (this.walls.get(vec) instanceof BreakableWall) {
                vecRange = vec;
                break;
            } else if (this.walls.get(vec)) break;
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
                        const pos = new Vector(x, y); 
                        this.walls.set(pos, new Wall(`${x}-${y}`, pos));
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

                const pos = new Vector(x, y); 
                if (this.walls.get(pos) !== undefined) continue;

                this.walls.set(pos, new BreakableWall(`${x}-${y}`, pos));
            }
        }
    }


}