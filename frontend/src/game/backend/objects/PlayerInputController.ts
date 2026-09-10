import Direction from "@project/utils/Direction";

export default class PlayerInputController {
    private inputs: number[];
    public onSpace: () => void = () => {};

    constructor() {
        this.inputs = [];
    }

    public addKey(key: number) {
        if (key === 32) {
            this.onSpace();
            return;
        }
        this.inputs.unshift(key);
    }

    public removeKey(key: number) {
        this.inputs = this.inputs.filter(k => key !== k);
    }

    public clearKeys() {
        this.inputs = [];
    }

    public getLastKey(): number {
        return this.inputs[0];
    }

    public getLastDirection(): Direction {
        if (this.inputs.length === 0) return Direction.NONE;
        return Direction.fromKeyCode(this.getLastKey());
    }
}