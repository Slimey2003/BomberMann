import { getRandomInt } from "../../Util";
import type Vector from "../utils/Vector";
import Wall from "./Wall";

export default class BreakableWall extends Wall {
    private resistance: number;
    private damage: number = 0; 
    private effect: number | undefined;

    constructor(id: string ,position: Vector) {
        super(id, position);
        this.resistance = getRandomInt(0, 3);
        this.effect = getRandomInt(0, 6);
    }

    public getEffect(): number | undefined {
        return this.effect;
    }

    public getResistance(): number {
        return this.resistance;
    }

    public addDamage(bombStrange: number): void {
        this.damage += bombStrange;
    }

    public isDestroyed(): boolean {
        return this.damage >= this.resistance;
    }
}