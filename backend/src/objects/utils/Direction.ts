import Vector from "./Vector";

export class Direction {
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

    public static fromKey(key: string): Direction | undefined {
        switch (key.toLowerCase()) {
            case "w":
            case "W":
            case "arrowup":
                return Direction.NORTH;

            case "d":
            case "D":
            case "arrowright":
                return Direction.EAST;

            case "s":
            case "S":
            case "arrowdown":
                return Direction.SOUTH;

            case "a":
            case "A":
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