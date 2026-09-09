import Direction from "@project/utils/Direction";

export default class PlayerInputController {
    private playerId: number;
    private window: Window;
    private inputs: string[];
    public onSpace: () => void = () => {};

    constructor(playerId: number, window: Window) {
        this.window= window;
        this.playerId = playerId;
        this.inputs = [];

        this.window.addEventListener("click", this.handleClick);
        this.window.addEventListener("keydown", this.handleKeyDown);
        this.window.addEventListener("keyup", this.handleKeyUp);
    }

    public unRegisterListener() {
        this.window.removeEventListener("click", this.handleClick);
        this.window.removeEventListener("keydown", this.handleKeyDown);
        this.window.removeEventListener("keyup", this.handleKeyUp);
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

    public clearKeys() {
        this.inputs = [];
    }

    public getLastKey(): string {
        return this.inputs[0];
    }

    public getLastDirection(): Direction {
        if (this.inputs.length === 0) return Direction.NONE;
        return Direction.fromKey(this.getLastKey());
    }

    private handleKeyDown = (e: KeyboardEvent) => {
            if (!e.key) return;
            e.preventDefault();
            if (e.key === " ") {
                this.onSpace();
            }
            this.addKey(e.key);
        };

    private handleKeyUp = (e: KeyboardEvent) => {
        if (!e.key) return;
        this.removeKey(e.key);
    };

    private handleClick = () => {
        this.clearKeys();
    };
}