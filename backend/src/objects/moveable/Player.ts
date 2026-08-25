import Effect from "../effect/Effect";
import type Vector from "../utils/Vector";
import Moveable from "./Moveable";

export default class Player extends Moveable {
    private id: number;
    private name: string;
    private lives: number;
    private effects: Effect[] = [];

    constructor(id: number, lives: number, name: string, startPosition: Vector) {
        super(startPosition, 5, 5); //5 für die Höhe und 5 für die Breite
        this.id = id;
        this.name = name;
        this.lives = lives;
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public lostLive() {
        if (this.lives <= 0) return;
        this.lives--;
    }

    public isDead() {
        return this.lives <= 0;
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
        const eff = this.getEffect(Effect.SPEED);
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

}