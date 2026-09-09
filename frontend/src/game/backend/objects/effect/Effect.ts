import { EffectType } from "@project/utils";

export default class Effect {
    private static SPEED = {step: 0.25, max: 1.5, default: 1.25};
    private static STACK = {step: 1, max: 3, default: 1};
    private static STRANGE = {step: 1, max: 3, default: 1};
    private static RANGE = {step: 1, max: 3, default: 1};

    private id: number;
    private scale: number;
    private stepScale: number;
    private stepMax: number;

    constructor(id: number, scale: {step: number, max: number, default: number}) {
        this.id = id;
        this.scale = scale.default;
        this.stepScale = scale.step;
        this.stepMax = scale.max;
    }

    public static getEffectById(id: number): Effect | undefined {
        switch(id) {
            case EffectType.SPEED:
                return new Effect(id, Effect.SPEED);
            case EffectType.STRANGE:
                return new Effect(id, Effect.STRANGE);
            case EffectType.RANGE:
                return new Effect(id, Effect.RANGE);
            case EffectType.STACK:
                return new Effect(id, Effect.STACK);
        }
    }

    public getId(): number {
        return this.id;
    }

    public getScale() {
        return this.scale;
    }

    public addScale() {
        if (this.scale >= this.stepMax) return;
        this.scale += this.stepScale;
    }
}