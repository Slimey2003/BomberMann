import Direction from "@project/utils/Direction";

export default class PlayerInputController {
    private playerId: number;
    private inputs: string[];

    constructor(playerId: number) {
        this.playerId = playerId;
        this.inputs = [];
    }

    public getPlayerId(): number {
        return this.playerId;
    }

    public addKey(key: string) {
        this.inputs.unshift(key);
    }

    public removeKey(key: string) {
        this.inputs = this.inputs.filter(k => key !== k);
    }

    public getLastKey(): string {
        return this.inputs[0];
    }

    public getLastDirection(): Direction {
        if (this.inputs.length === 0) return Direction.NONE;
        return Direction.fromKey(this.getLastKey());
    }
}