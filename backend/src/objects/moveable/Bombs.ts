import type { Delayed } from "../utils/DelayedQueue";
import type Vector from "../utils/Vector";
import Moveable from "./Moveable";

export default class Bomb extends Moveable implements Delayed {
    private static EXPOSITION_TIME: number = 5000; //sec
    private playerId: number;
    private placeTime: number;

    private expositionRange: number = 1;
    private expositionStrange: number = 1;

    private calculatedRange: Vector[] = [];

    constructor(playerId: number, startPosition: Vector) {
        super(startPosition, 4, 4); //4 für die Breite und Höhe
        this.placeTime = Date.now();
        this.playerId = playerId;
    }

    public getPlayerId() {
        return this.playerId;
    }

    public getPlacedTime() {
        return this.placeTime;
    }

    public getRange() {
        return this.expositionRange;
    }

    public getStrange() {
        return this.expositionStrange;
    }

    public getCalculatedRange() {
        return this.calculatedRange;
    }

    public setCalculatedRange(range: Vector[]) {
        this.calculatedRange = range;
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