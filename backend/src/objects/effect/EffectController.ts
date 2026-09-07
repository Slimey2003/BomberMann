import Controller from "../Controller";
import type Player from "../moveable/Player";
import type Vector from "@project/utils/Vector";
import EffectCard from "./EffectCard";

export default class EffectController extends Controller {
    private effectsCards: EffectCard[] = [];


    public placeEffect(vec: Vector, effId: number) {
        this.effectsCards.push(new EffectCard(vec, effId));
    }

    public pickUp(player: Player) {
        this.effectsCards = this.effectsCards.filter(c => {
            if (player.getBox().overlaps(c.getBox())) {
                player.addEffectOrChange(c.getEffectId());
                return false;
            }
            return true;
        });
    }

    public getEffects(): EffectCard[] {
        return [...this.effectsCards];
    }
}