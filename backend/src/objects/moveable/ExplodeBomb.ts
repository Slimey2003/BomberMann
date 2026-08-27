import type { Delayed } from "../utils/DelayedQueue";
import type Vector from "../utils/Vector";
import type Bomb from "./Bombs";

export default class ExplodeBomb implements Delayed {
    private static EXPOSITION_TIME: number = 4000; //sec
    
    private bomb: Bomb;
    private explodeTime: number;
    
    private expositionRange: number = 40;
    private expositionStrange: number = 1;

    private calculatedRange: Vector[] = [];

    constructor(bomb: Bomb) {
        this.bomb = bomb;
        this.explodeTime = performance.now();
    }

    public getBomb() {
        return this.bomb;
    }

    public getExplodeTime(): number {
        return this.explodeTime;
    }

    public getRange(): number {
        return this.expositionRange;
    }

    public getStrange(): number {
        return this.expositionStrange;
    }

    public getCalculatedRange(): Vector[] {
        return this.calculatedRange;
    }

    public setExplodeTime() {
        this.explodeTime = Date.now();
    }

    public setCalculatedRange(range: Vector[]) {
        this.calculatedRange = range;
    }

    public addRange(range: number): ExplodeBomb {
        this.expositionRange += (range * 10);
        return this;
    }

    public addStrange(strange: number): ExplodeBomb {
        this.expositionStrange += strange;
        return this;
    }

    public getDelay(): number {
        return (this.explodeTime + ExplodeBomb.EXPOSITION_TIME) - performance.now();
    }
}