import type { Delayed } from "../utils/DelayedQueue";
import type Vector from "../utils/Vector";
import Moveable from "./Moveable";

export default class Bomb extends Moveable implements Delayed {
    private static EXPOSITION_TIME: number = 5000; //sec
    private placeTime: number;
    private expositionRange: number = 1;
    private expositionStrange: number = 1;

    constructor(startPosition: Vector) {
        super(startPosition);
        this.placeTime = Date.now();
    }

    public getPlacedTime() {
        return this.placeTime;
    }

    public addRange(range: number): Bomb {
        this.expositionRange += range;
        return this;
    }

    public addStrange(strange: number): Bomb {
        this.expositionStrange += strange;
        return this;
    }

    public getDelay(): number {
        return (this.placeTime + Bomb.EXPOSITION_TIME) - Date.now();
    }
}