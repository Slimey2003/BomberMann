import { getRandomInt } from "@project/utils/Utils";
import type Vector from "@project/utils/Vector";
import Wall from "./Wall";
import Effect from "../effect/Effect";

export default class BreakableWall extends Wall {
    private resistance: number;
    private damage: number = 0; 
    private effect: number | undefined;

    constructor(id: string ,position: Vector, height: number, width: number) {
        super(id, position, height, width);
        this.resistance = getRandomInt(0, 3);
        this.effect = Effect.getEffectById(getRandomInt(-1, 5))?.getId();
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

    public getDamage() {
        return this.damage;
    }

    public isDestroyed(): boolean {
        return this.damage >= this.resistance;
    }
}