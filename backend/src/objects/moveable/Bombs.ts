import type { Delayed } from "../utils/DelayedQueue";
import type Vector from "../utils/Vector";
import Moveable from "./Moveable";

export default class Bomb extends Moveable implements Delayed {
    private static EXPOSITION_EXPIRATION: number = 8000; //sec
    private static PROTECTION_TIME: number = 2000; //sec
    private playerId: number;
    private placeTime: number;

    constructor(playerId: number, startPosition: Vector) {
        super(startPosition, 4, 4); //4 für die Breite und Höhe
        this.placeTime = Date.now();
        this.playerId = playerId;
    }

    public getPlayerId(): number {
        return this.playerId;
    }

    public getPlacedTime(): number {
        return this.placeTime;
    }

    public noCollision(): boolean {
        return ((this.placeTime + Bomb.PROTECTION_TIME) - Date.now()) > 0;
    }

    public getDelay(): number {
        return (this.placeTime + Bomb.EXPOSITION_EXPIRATION) - Date.now();
    }
}