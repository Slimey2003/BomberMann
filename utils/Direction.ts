import Vector from "./Vector";

export default class Direction {
    static NORTH = new Direction("NORTH", 0, -1);
    static EAST = new Direction("EAST", 1, 0);
    static SOUTH = new Direction("SOUTH", 0, 1);
    static WEST = new Direction("WEST", -1, 0);
    static NONE = new Direction("NONE", 0, 0);


    private name: string;
    private dx: number;
    private dy: number;

    constructor(name: string, dx: number, dy: number) {
        this.name = name;
        this.dx = dx;
        this.dy = dy;
        Object.freeze(this);
    }

    public static fromVector(start: Vector, end: Vector): Direction {
        const diffX = start.getX() - end.getX();
        const diffY = start.getY() - end.getY();

        if (diffX === 0 && diffY === 0) {
            return Direction.NONE;
        }

        if (Math.abs(diffX) > Math.abs(diffY)) {
            return diffX > 0 ? Direction.EAST : Direction.WEST;
        } 
        
        return diffY > 0 ? Direction.NORTH : Direction.SOUTH;
    }

    public static fromKey(key: string): Direction {
        switch (key.toLowerCase()) {
            case "w":
            case "arrowup":
                return Direction.NORTH;

            case "d":
            case "arrowright":
                return Direction.EAST;

            case "s":
            case "arrowdown":
                return Direction.SOUTH;

            case "a":
            case "arrowleft":
                return Direction.WEST;
        }
        return Direction.NONE;
    }

    public opposite(): Direction | undefined {
        switch (this) {
            case Direction.NORTH: return Direction.SOUTH;
            case Direction.EAST:  return Direction.WEST;
            case Direction.SOUTH: return Direction.NORTH;
            case Direction.WEST:  return Direction.EAST;
        }
    }

    public getVector() {
        return new Vector(this.dx, this.dy);
    }

    public static values(): Direction[] {
        return [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    }

    public toString(): string {
        return this.name;
    }
}