import type { Delayed } from "../utils/DelayedQueue";
import type Vector from "@project/utils/Vector";
import Moveable from "./Moveable";

export default class Bomb extends Moveable implements Delayed {
    private static EXPOSITION_EXPIRATION: number = 8000; //8 sec
    private static PROTECTION_TIME: number = 2000; //2 sec
    private id: string;
    private playerId: number;
    private placeTime: number;
    

    constructor(playerId: number, startPosition: Vector, height:number, width: number) {
        super(startPosition, height, width);
        this.placeTime = Date.now();
        this.playerId = playerId;
        this.id = crypto.randomUUID();
    }

    public getId(): string {
        return this.id;
    }

    public getPlayerId(): number {
        return this.playerId;
    }

    public getPlacedTime(): number {
        return this.placeTime;
    }

    public noCollision(): boolean {
        return ((this.placeTime + Bomb.PROTECTION_TIME) - Date.now()) <= 0;
    }

    public getDelay(): number {
        return (this.placeTime + Bomb.EXPOSITION_EXPIRATION) - Date.now();
    }
}