import Controller from "../Controller";
import Effect from "../effect/Effect";
import DelayQueue from "../utils/DelayedQueue";
import Vector from "../utils/Vector";
import type Wall from "../wall/Wall";
import Bomb from "./Bombs";
import ExplodeBomb from "./ExplodeBomb";

export default class BombController extends Controller {
    private placedBombs: DelayQueue<Bomb> = new DelayQueue();
    private explodeBombs: DelayQueue<ExplodeBomb> = new DelayQueue();

    //Add Bomb

    public addBomb(bomb: Bomb) {
        this.placedBombs.put(bomb);
    }

    public placeBomb(playerId: number) {
        const player = super.getPlayerController().getPlayers()[playerId];
        
        const playerPos = player.getPosition();
        const newBomb = new Bomb(player.getId(), this.modifyPosition(playerPos));
        for (const bomb of this.getPlacedBombs()) {
            if (newBomb.getBox().overlaps(bomb.getBox())) {
                return;
            }
        }
        this.placedBombs.put(newBomb);
    }

    //Pick Bombs

    public triggerExplosion(): ExplodeBomb[] {
        const pickBomb: ExplodeBomb[] = [];
        let bomb: Bomb | undefined = undefined;
        while (bomb = this.placedBombs.poll()) {
            if (!bomb) break;
            pickBomb.push(this.modifyBomb(bomb));
        }

        this.triggerOtherBomb(pickBomb);

        this.explodeBombs.put(...pickBomb);
        return pickBomb;
    }

    public triggerOtherBomb(pickBomb: ExplodeBomb[]) {
        const triggers: ExplodeBomb[] = [...pickBomb];
        do {
            const trigger: ExplodeBomb | undefined = triggers.pop();
            if (!trigger) break; //(Save is Save xD)

            for (const bomb of this.placedBombs.getValues()) {
                for (const vec of trigger.getCalculatedRange()) {
                    
                    if (bomb.getBox().intersects(trigger.getBomb().getPosition(), vec) != null) {
                        const explode: ExplodeBomb = this.modifyBomb(bomb);

                        this.placedBombs.delete(bomb);

                        triggers.push(explode);
                        pickBomb.push(explode);
                    }
                }
            }
        } while (triggers.length !== 0);
    }

    //Explode Time down

    public triggerExplodeTimeDown() {
        let explodeBomb: ExplodeBomb | undefined = undefined;
        while (explodeBomb = this.explodeBombs.poll()) {
            if (!explodeBomb) break;
            for (const vec of explodeBomb.getCalculatedRange()) {
                const eff: number | undefined = this.getWallController().expositionOnVector(explodeBomb, vec);
                if (!eff) continue;
                this.getEffectController().placeEffect(vec, eff);
            }
        }
    }

    //explodeBombs List

    public getExplodeBombs() {
        return this.explodeBombs;
    }

    public clearExplodeBombs() {
        this.explodeBombs.clear();
    }

    //placedBombs List
    
    public getPlacedBombs(): Bomb[] {
        return this.placedBombs.getValues();
    }

    public clearPlacedBombs() {
        this.placedBombs.clear();
    }

    //Movement

    public updateMovement() {
        for (const bomb of this.placedBombs.getValues()) {
            if (bomb.getMovement().equals(Vector.nullVector)) continue;
            const futureVector = bomb.getPosition().add(bomb.getMovement());
            let wall: Wall | undefined = super.getWallController().getWallInVectorDirection(bomb.getPosition(), futureVector);
            if (!wall) {
                wall = super.getWallController().overlapsMoveableWithWall(bomb.getMovedBox());
            }
            bomb.updateMove(wall);
            bomb.setVelocity(Vector.nullVector);
            bomb.setPosition(this.modifyPosition(bomb.getPosition()));
        }
    }
    
    public playerCollidedWithBomb(withoutProtectionTime: boolean) { //withoutProtectionTime is for Testing because tests can not wait a specific time
        for (const player of super.getPlayerController().getPlayers()) {
            for (const bomb of this.getPlacedBombs()) {
                if (player.getBox().overlaps(bomb.getBox())) {
                    if (!withoutProtectionTime && bomb.noCollision()) continue;
                    bomb.setVelocity(player.getMovement().scale(20));
                    break;
                }
            }
        }
    }

    //Modify

    public modifyBomb(bomb: Bomb): ExplodeBomb {
        const player = this.getPlayerController().getPlayers()[bomb.getPlayerId()];
        const effRange = player.getEffect(Effect.RANGE);
        const effStrange = player.getEffect(Effect.STRANGE);
        const explode = new ExplodeBomb(bomb);
        if (effRange) {
            explode.addRange(effRange.getScale());
        }
        if (effStrange) {
            explode.addStrange(effStrange.getScale());
        }
        explode.setCalculatedRange(this.getWallController().getExpositionRange(explode));
        return explode;
    }

    private modifyPosition(pos: Vector): Vector {
        const gridSize = 10; 
        const centerX = Math.round(pos.getX() / gridSize) * gridSize;
        const centerY = Math.round(pos.getY() / gridSize) * gridSize;
        return new Vector(centerX, centerY);
    }
}