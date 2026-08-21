import DelayQueue from "../utils/DelayedQueue";
import Effect from "../utils/Effect";
import type Vector from "../utils/Vector";
import Bomb from "./Bombs";
import Moveable from "./Moveable";

export default class Player extends Moveable {
    private id: number;
    private name: string;
    private effects: Effect[] = [];
    private placedBombs: DelayQueue<Bomb> = new DelayQueue();

    constructor(id: number, name: string, startPosition: Vector) {
        super(startPosition);
        this.id = id;
        this.name = name;
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
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

    public placeBomb() {
        const newBomb = new Bomb(this.getPosition());
        this.placedBombs.put(newBomb);
    }

    public pickBomb(): Bomb | undefined {
        const bomb = this.placedBombs.poll();
        if (!bomb) return undefined;
        const effRange = this.getEffect(Effect.RANGE);
        const effStrange = this.getEffect(Effect.STRANGE);
        if (effRange) {
            bomb.addRange(effRange.getScale());
        }
        if (effStrange) {
            bomb.addRange(effStrange.getScale());
        }

        return bomb;
    }
}