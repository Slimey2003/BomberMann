import Effect from "../effect/Effect";
import type Vector from "@project/utils/Vector";
import Moveable from "./Moveable";
import { EffectType } from "@project/utils";

export default class Player extends Moveable {
    private id: number;
    private name: string;
    private lives: number;
    private effects: Effect[] = [];

    constructor(id: number, lives: number, name: string, startPosition: Vector, height: number, width: number) {
        super(startPosition, height, width); 
        this.id = id;
        this.name = name;
        this.lives = lives;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public lostLive() {
        if (this.lives <= 0) return;
        this.lives--;
    }

    public getLives(): number {
        return this.lives;
    }

    public isDead(): boolean {
        return this.lives <= 0;
    }

    public clearEffects() {
        this.effects = [];
    }

    public addEffectOrChange(effectId: number) {
        let eff: Effect | undefined = this.getEffect(effectId);
        if (eff) {
            eff.addScale();
            return;
        }
        eff = Effect.getEffectById(effectId);
        if (!eff) return;
        this.effects.push(eff);
    }

    /**
     * Ändernt auf basis des (wenn vorhanden) Speed Effekts den gegeben Vector für die Velocity
     */
    public setVelocity(vector: Vector) {
        const eff = this.getEffect(EffectType.SPEED);
        if (!eff) {
            super.setVelocity(vector);
            return;
        }
        super.setVelocity(vector.scale(eff.getScale()));
    }

    public getEffect(id: number) {
        for (const eff of this.effects) {
            if (eff.getId() === id) {
                return eff;
            }
        }
    }

    public getMaxPlacedBomb() {
        let max = 1;
        const eff = this.getEffect(EffectType.STACK);
        if (eff) {
            max += eff.getScale();
        }
        return max;
    }

}