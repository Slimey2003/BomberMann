import Controller from "../Controller";
import DelayQueue from "../utils/DelayedQueue";
import Vector from "@project/utils/Vector";
import type Wall from "../wall/Wall";
import Bomb from "./Bombs";
import ExplodeBomb from "./ExplodeBomb";
import { EffectType } from "@project/utils";

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
        const newBomb = new Bomb(player.getId(), this.modifyPosition(playerPos), this.canvas.bombSize, this.canvas.bombSize);
        let playerBombCount = 0;
        for (const bomb of this.getPlacedBombs()) {
            if (bomb.getPlayerId() == playerId) {
                playerBombCount++;
            }
            if (newBomb.getBox().overlaps(bomb.getBox())) {
                return;
            }
        }
        if (playerBombCount >= player.getMaxPlacedBomb()) return; //Max 
        
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
                if (bomb.getId() == trigger.getBomb().getId() || !bomb.getMovement().equals(Vector.nullVector)) continue;
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

    //Explode

    public triggerExplodeTick() {
        for (const explode of this.explodeBombs.getValues()) {
            this.getPlayerController().playerTakeDamage(explode.getPlayerTakeDamage(), explode.getBomb().getPosition(), explode.getCalculatedRange());
        }
    }

    public triggerExplodeTimeDown() {
        let explodeBomb: ExplodeBomb | undefined = undefined;
        while (explodeBomb = this.explodeBombs.poll()) {
            if (!explodeBomb) break;
            for (const vec of explodeBomb.getCalculatedRange()) {
                const eff: number | undefined = this.getWallController().expositionOnVector(explodeBomb.getStrange(), vec);
                if (eff == undefined) continue;
                this.getEffectController().placeEffect(vec, eff);
            }
        }
    }

    //explodeBombs List

    public getExplodeBombs(): ExplodeBomb[] {
        return this.explodeBombs.getValues();
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
            const movement = bomb.getMovement();
            if (movement.equals(Vector.nullVector)) continue;
            let wall: Wall | undefined = super.getWallController().getCollidingWall(bomb.getPosition(), movement);
            
            if (!wall) {
                wall = super.getWallController().overlapsMoveableWithWall(bomb.getMovedBox());
            }
            
            bomb.updateMove(wall);
            if (wall) {
                const safePos = bomb.getPosition().subtract(movement.scale(1));
                
                bomb.setVelocity(Vector.nullVector);
                bomb.setPosition(this.modifyPosition(safePos));
            }
        }
    }
    
    public playerCollidedWithBomb() {
        for (const player of super.getPlayerController().getPlayers()) {
            for (const bomb of this.getPlacedBombs()) {
                if (player.getBox().overlaps(bomb.getBox())) {
                    const playerMovement = player.getMovement()
                    const bombMovement = bomb.getMovement();
                    if (bomb.noCollision() 
                        || playerMovement.equals(Vector.nullVector)
                        || !bombMovement.equals(Vector.nullVector)) continue;
                    bomb.setVelocity(playerMovement.normalize().scale(20));
                    break;
                }
            }
        }
    }

    //Modify

    public modifyBomb(bomb: Bomb): ExplodeBomb {
        const player = this.getPlayerController().getPlayers()[bomb.getPlayerId()];
        const effRange = player.getEffect(EffectType.RANGE);
        const effStrange = player.getEffect(EffectType.STRANGE);
        bomb.setVelocity(Vector.nullVector);
        bomb.setPosition(this.modifyPosition(bomb.getPosition()));
        const explode = new ExplodeBomb(bomb);
        if (effRange) {
            explode.addRange(effRange.getScale());
        }
        if (effStrange) {
            explode.addStrange(effStrange.getScale());
        }
        explode.setCalculatedRange(this.getWallController().getExpositionRange(bomb.getPosition(), explode.getRange()));

        return explode;
    }

    private modifyPosition(pos: Vector): Vector {
        const size = this.canvas.wallSize;
        const col = Math.floor(pos.getX() / size);
        const row = Math.floor(pos.getY() / size);
        const centerX = (col * size) + (size / 2);
        const centerY = (row * size) + (size / 2);
        
        return new Vector(centerX, centerY);
    }
}