import Effect from "../effect/Effect";
import { getRandomInt } from "../../Util";
import type Vector from "../utils/Vector";
import Wall from "./Wall";

export default class BreakableWall extends Wall {
    private resistance: number;
    private damage: number = 0; 
    private effect: Effect | undefined;

    constructor(id: string ,position: Vector) {
        super(id, position);
        this.resistance = getRandomInt(0, 3);
        this.effect = Effect.getEffectById(getRandomInt(0, 6));
    }

    public getEffect(): Effect | undefined {
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