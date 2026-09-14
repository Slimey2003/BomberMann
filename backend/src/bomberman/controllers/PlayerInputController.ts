import Direction from "@project/utils/Direction";

export default class PlayerInputController {
    private inputs: string[];
    public onSpace: () => void = () => {};

    constructor() {
        this.inputs = [];
    }

    public addKey(key: string) {
        if (key === " ") {
            this.onSpace();
            return;
        }
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
}