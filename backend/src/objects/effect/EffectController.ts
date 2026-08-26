import Controller from "../Controller";
import type Player from "../moveable/Player";
import type Vector from "../utils/Vector";
import type Effect from "./Effect";
import EffectCard from "./EffectCard";

export default class EffectController extends Controller {
    private effectsCards: EffectCard[] = [];


    public placeEffect(vec: Vector, eff: Effect) {
        this.effectsCards.push(new EffectCard(vec, eff));
    }

    public pickUp(player: Player): Effect | undefined {
        for (const eff of this.effectsCards) {
            if (player.getBox().overlaps(eff.getBox())) {
                return eff.getEffect();
            }
        }
    }

    public getEffects(): EffectCard[] {
        return [...this.effectsCards];
    }
}