import Controller from "../Controller";
import type { Direction } from "../utils/Direction";
import Vector from "../utils/Vector";
import type Wall from "../wall/Wall";
import Player from "./Player";

export default class PlayerController extends Controller {
    private players: Player[];


    constructor(playerNames: string[], lives: number, height: number, width: number) {
        super();
        this.players = [];
        this.genPlayer(playerNames, lives, height, width);
    }

    public genPlayer(playerNames: string[], lives: number, height: number, width: number) {
        const xLast = (width - 2) * 10;
        const yLast = (height - 2) * 10;

        //links oben, rechts unten, links unten, rechts oben
        const pos: Vector[] = [new Vector(10, 10), new Vector(xLast, yLast), new Vector(10, yLast), new Vector(xLast, 10)];
        for (let i = 0; i < playerNames.length; i++) {
            this.players.push(new Player(i, lives, playerNames[0], pos[i]))
        }
    }

    public setPlayerVelocity(playerId: number, dir: Direction) {
        this.players[playerId].setVelocity(dir.getVector().scale(2));
    }

    public updateMovement() {
        for (const player of this.players) {
            if (player.getMovement().equals(Vector.nullVector)) continue;
            const futureVector = player.getPosition().add(player.getMovement());
            let wall: Wall | undefined = super.getWallController().getWallInVectorDirection(player.getPosition(), futureVector);
            if (!wall) {
                wall = super.getWallController().overlapsMoveableWithWall(player.getMovedBox());
            }
            player.updateMove(wall);
        }
    }

    public addEffectOrChangeToPlayer(playerId: number, effectId: number) {
        this.players[playerId].addEffectOrChange(effectId);
    }

    public playerTakeDamage(bombPos: Vector, bombRange: Vector[]) {
        for (const player of this.players) {
            for (const vec of bombRange) {
                if (player.getBox().intersects(bombPos, vec) != null) {
                    player.lostLive();
                    break;
                }
            }
        }
    }

    public getPlayers(): Player[] {
        return this.players;
    }
}