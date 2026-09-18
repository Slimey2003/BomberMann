import { EffectType } from "@project/utils";

export default class Effect {
    private id: number;
    private value: number;
    private stepValue: number;
    private level: number;
    private maxLevel: number;

    constructor(config: {id: number, step: number, defaultVal: number, maxLevel: number}) {
        this.id = config.id;
        this.value = config.defaultVal;
        this.stepValue = config.step;
        this.level = 1;
        this.maxLevel = config.maxLevel;
    }

    public static getEffectById(id: number): Effect | undefined {
        switch(id) {
            case EffectType.SPEED.id:
                return new Effect(EffectType.SPEED);
            case EffectType.STRANGE.id:
                return new Effect(EffectType.STRANGE);
            case EffectType.RANGE.id:
                return new Effect(EffectType.RANGE);
            case EffectType.STACK.id:
                return new Effect(EffectType.STACK);
        }
    }

    public getId(): number {
        return this.id;
    }

    public getValue(): number {
        return this.value;
    }

    public getLevel(): number {
        return this.level;
    }

    public getMaxLevel(): number {
        return this.maxLevel;
    }

    public addScale(): void {
        if (this.level >= this.maxLevel) return;
        this.level += 1;
        this.value = Math.round((this.value + this.stepValue) * 1000) / 1000;
    }
}