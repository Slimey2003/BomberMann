import Vector from "../utils/Vector";
import Bomb from "./Bombs";
import Player from "./Player";

export default class PlayerController {
    private players: Player[];


    constructor(playerNames: string[], lives: number, height: number, width: number) {
        this.players = [];
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

    public placeBomb(playerId: number) {
        const playerBox = this.players[playerId].getBox();
        for (const bomb of this.getBombs()) {
            if (playerBox.overlaps(bomb.getBox())) {
                return;
            }
        }
        this.players[playerId].placeBomb();
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

    public playerCollidedWithBomb() {
        for (const player of this.players) {
            for (const bomb of this.getBombs()) {
                if (player.getBox().overlaps(bomb.getBox())) {
                    bomb.setVelocity(player.getMovement().scale(20));
                    break;
                }
            }
        }
    }

    public pickBomb(): Bomb[] {
        const pickBomb: Bomb[] = [];
        for (const player of this.players) {
            const bomb: Bomb | undefined = player.pickBomb();
            if (!bomb) continue;
            pickBomb.push(bomb);
        }
        return pickBomb;
    }

    public getPlayers(): Player[] {
        return this.players;
    }

    public getBombs(): Bomb[] {
        const bombs: Bomb[] = [];
        for (const player of this.players) {
            bombs.push(...player.getBombs());
        }
        return bombs;
    }
}