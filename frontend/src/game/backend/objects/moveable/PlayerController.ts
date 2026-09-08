import Controller from "../Controller";
import type Direction from "@project/utils/Direction";
import Vector from "@project/utils/Vector";
import type Wall from "../wall/Wall";
import Player from "./Player";
import type { Canvas } from "@project/utils";

export default class PlayerController extends Controller {
    private players: Player[];


    constructor(playerNames: string[], lives: number, canvas: Canvas) {
        super(canvas);
        this.players = [];
        this.genPlayer(playerNames, lives, canvas);
    }

    public genPlayer(playerNames: string[], lives: number, canvas: Canvas): void {
        const size = canvas.wallSize;
        const halfSize = size / 2;

        const columns = Math.floor(canvas.width / size);
        const rows = Math.floor(canvas.height / size);

        const leftX = size + halfSize;
        const topY = size + halfSize;
        const rightX = (columns - 2) * size + halfSize;
        const bottomY = (rows - 2) * size + halfSize;

        const pos: Vector[] = [
            new Vector(leftX, topY),
            new Vector(rightX, bottomY),
            new Vector(leftX, bottomY),
            new Vector(rightX, topY)
        ];

        for (let i = 0; i < playerNames.length; i++) {
            this.players.push(new Player(i, lives, playerNames[i], pos[i], canvas.playerSize, canvas.playerSize));
        }
    }

    public setPlayerVelocity(playerId: number, dir: Direction) {
        this.players[playerId].setVelocity(dir.getVector().scale(10));
    }

    public updateMovement() {
        for (const player of this.players) {
            const movement = player.getMovement();
            if (movement.equals(Vector.nullVector)) continue;
            let wall: Wall | undefined = super.getWallController().getCollidingWall(player.getPosition(), movement);
            
            if (!wall) {
                wall = super.getWallController().overlapsMoveableWithWall(player.getMovedBox());
            }
            
            player.updateMove(wall);
            super.getEffectController().pickUp(player);
        }
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