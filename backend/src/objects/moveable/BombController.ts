import Effect from "../effect/Effect";
import DelayQueue from "../utils/DelayedQueue";
import Vector from "../utils/Vector";
import type Wall from "../wall/Wall";
import type WallController from "../wall/WallController";
import Bomb from "./Bombs";
import type PlayerController from "./PlayerController";

export default class BombController {
    private wallController: WallController
    private playerController: PlayerController;
    private placedBombs: DelayQueue<Bomb> = new DelayQueue();

    constructor(wallController: WallController, playerController: PlayerController) {
        this.playerController = playerController;
        this.wallController = wallController;
    }

    public updateMovement() {
        for (const bomb of this.placedBombs.getValues()) {
            if (bomb.getMovement().equals(Vector.nullVector)) continue;
            const futureVector = bomb.getPosition().add(bomb.getMovement());
            let wall: Wall | undefined = this.wallController.getWallInVectorDirection(bomb.getPosition(), futureVector);
            if (!wall) {
                wall = this.wallController.overlapsMoveableWithWall(bomb.getMovedBox());
            }
            bomb.updateMove(wall);
            bomb.setVelocity(Vector.nullVector);
        }
    }

    public placeBomb(playerId: number) {
        const player = this.playerController.getPlayers()[playerId];
        const playerBox = player.getBox();
        for (const bomb of this.getBombs()) {
            if (playerBox.overlaps(bomb.getBox())) {
                return;
            }
        }

        const playerPos = player.getPosition();
        const gridSize = 10; 
        const centerX = Math.round(playerPos.getX() / gridSize) * gridSize;
        const centerY = Math.round(playerPos.getY() / gridSize) * gridSize;
        const centerFieldPos = new Vector(centerX, centerY);
        const newBomb = new Bomb(player.getId(), centerFieldPos);
        this.placedBombs.put(newBomb);
    }
    
    public pickBomb(): Bomb[] {
        const pickBomb: Bomb[] = [];
        let bomb: Bomb | undefined = undefined;
        do {
            bomb = this.placedBombs.poll();
            if (!bomb) break;
            this.modifyBomb(bomb);
        } while (!bomb);

        this.triggerOtherBomb(pickBomb);
        return pickBomb;
    }

    public triggerOtherBomb(pickBomb: Bomb[]) {
        const triggers: Bomb[] = [...pickBomb];
        do {
            const trigger: Bomb | undefined = triggers.pop();
            if (!trigger) break; //(Save is Save xD)

            for (const bomb of this.placedBombs.getValues()) {
                for (const vec of trigger.getCalculatedRange()) {
                    if (bomb.getBox().intersects(trigger.getPosition(), vec) != null) {
                        this.modifyBomb(bomb);

                        this.placedBombs.delete(bomb);

                        triggers.push(bomb);
                        pickBomb.push(bomb);
                    }
                }
            }
        } while (triggers.length !== 0);
    }
    
    public playerCollidedWithBomb(withoutProtectionTime: boolean) { //withoutProtectionTime is for Testing because tests can not wait a specific time
        for (const player of this.playerController.getPlayers()) {
            for (const bomb of this.getBombs()) {
                if (player.getBox().overlaps(bomb.getBox())) {
                    if (!withoutProtectionTime && bomb.noCollision()) continue;
                    bomb.setVelocity(player.getMovement().scale(20));
                    break;
                }
            }
        }
    }

    public getBombs(): Bomb[] {
        return this.placedBombs.getValues();
    }

    private modifyBomb(bomb: Bomb) {
        const player = this.playerController.getPlayers()[bomb.getPlayerId()];
        const effRange = player.getEffect(Effect.RANGE);
        const effStrange = player.getEffect(Effect.STRANGE);
        if (effRange) {
            bomb.addRange(effRange.getScale());
        }
        if (effStrange) {
            bomb.addRange(effStrange.getScale());
        }
        bomb.setCalculatedRange(this.wallController.getExpositionRange(bomb));
    }
}