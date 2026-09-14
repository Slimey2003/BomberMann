import Controller from "./Controller";
import type Player from "../objects/moveable/Player";
import type Vector from "@project/utils/Vector";
import EffectCard from "../objects/effect/EffectCard";
import type BombController from "./BombController";
import type PlayerController from "./PlayerController";
import type WallController from "./WallController";
import BreakableWall from "../objects/wall/BreakableWall";

export default class EffectController extends Controller {
    private effectsCards: EffectCard[] = [];
    private maxEffectCards: number = 0;
    private pickedEffectCount: number = 0;

    public init(wallCon: WallController, player: PlayerController, bomb: BombController, effect: EffectController) {
        super.init(wallCon, player, bomb, effect);
        for (const wall of wallCon.getWalls().values()) {
            if (!(wall instanceof BreakableWall)) continue;
            if (wall.getEffect() === undefined) continue;
            this.maxEffectCards++;
        }
    }

    public placeEffect(vec: Vector, effId: number) {
        this.effectsCards.push(new EffectCard(vec, effId, this.canvas.effectSize, this.canvas.effectSize));
    }

    public pickUp(player: Player) {
        this.effectsCards = this.effectsCards.filter(c => {
            if (player.getBox().overlaps(c.getBox())) {
                player.addEffectOrChange(c.getEffectId());
                this.pickedEffectCount++;
                return false;
            }
            return true;
        });
    }



    public getPickedEffectCount(): number {
        return this.pickedEffectCount;
    }

    public getMaxEffectsCards(): number {
        return this.maxEffectCards;
    }

    public getEffectCards(): EffectCard[] {
        return [...this.effectsCards];
    }
}