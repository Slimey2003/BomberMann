import Effect from "../utils/Effect";
import { getRandomInt } from "../utils/Util";
import type Vector from "../utils/Vector";
import Wall from "./Wall";

export default class BreakableWall extends Wall {
    private resistance: number;
    private damage: number = 0; 
    private effect: Effect | undefined;

    constructor(position: Vector) {
        super(position);
        this.resistance = getRandomInt(0, 3);
        this.effect = Effect.getEffectById(getRandomInt(0, 4));
    }

    public getEffect() {
        return this.effect;
    }

    public getResistance() {
        return this.resistance;
    }

    public addDamage(bombStrange: number) {
        this.damage += bombStrange;
    }

    public destroyed() {
        return this.damage >= this.resistance;
    }
}