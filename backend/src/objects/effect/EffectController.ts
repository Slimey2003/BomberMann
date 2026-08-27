import Controller from "../Controller";
import type Player from "../moveable/Player";
import type Vector from "../utils/Vector";
import EffectCard from "./EffectCard";

export default class EffectController extends Controller {
    private effectsCards: EffectCard[] = [];


    public placeEffect(vec: Vector, effId: number) {
        this.effectsCards.push(new EffectCard(vec, effId));
    }

    public pickUp(player: Player) {
        for (const eff of this.effectsCards) {
            if (player.getBox().overlaps(eff.getBox())) {
                player.addEffectOrChange(eff.getEffectId());
            }
        }
    }

    public getEffects(): EffectCard[] {
        return [...this.effectsCards];
    }
}