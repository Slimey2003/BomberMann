import Vector from "../utils/Vector";
import type Wall from "../wall/Wall";
import type WallController from "../wall/WallController";
import Player from "./Player";

export default class PlayerController {
    private players: Player[];
    private wallController: WallController;


    constructor(wallController: WallController, playerNames: string[], lives: number, height: number, width: number) {
        this.players = [];
        this.wallController = wallController;
        this.genPlayer(playerNames, lives, height, width);
    }

    public genPlayer(playerNames: string[], lives: number, height: number, width: number) {
        const xLast = width - 2;
        const yLast = height - 2;

        //links oben, rechts unten, links unten, rechts oben
        const pos: Vector[] = [new Vector(1, 1), new Vector(xLast, yLast), new Vector(1, yLast), new Vector(xLast, 1)];
        for (let i = 0; i < playerNames.length; i++) {
            this.players.push(new Player(i, lives, playerNames[0], pos[i]))
        }
    }

    public updateMovement() {
        for (const player of this.players) {
            if (player.getMovement().equals(Vector.nullVector)) continue;
            const endVector = player.getPosition().add(player.getMovement());
            const wall: Wall | undefined = this.wallController.getWallInVectorDirection(player.getPosition(), endVector);
            player.updateMove(wall);
        }
    }

    public addEffectOrChangeToPlayer(playerId: number, effectId: number) {
        this.players[playerId].addEffectOrChange(effectId);
    }

    public playerTakeDamage(bombPos: Vector, bombRange: Vector[]) {
        for (const player of this.players) {
            for (const vec of bombRange) {
                if (player.getBox().intersects(bombPos, vec)) {
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