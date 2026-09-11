import Controller from "../Controller";
import Vector from "@project/utils/Vector";
import type Wall from "../wall/Wall";
import Player from "./Player";
import type { Canvas } from "@project/utils";
import BoundingBox from "@project/utils/BoundingBox";
import PlayerInputController from "../PlayerInputController";

export default class PlayerController extends Controller {
    private players: Player[];
    private movementMultiplayer: number;

    constructor(playerNames: string[], lives: number, canvas: Canvas) {
        super(canvas);
        this.players = [];
        this.genPlayer(playerNames, lives, canvas);
        switch (canvas.playerSize) {
            case 40:
            case 30:
                this.movementMultiplayer = 10;
                break;
            case 15:
                this.movementMultiplayer = 5;
                break;
            default:
                this.movementMultiplayer = 10;
        }
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
            const controller: PlayerInputController = new PlayerInputController();
            controller.onSpace = () => {
                this.getBombController().placeBomb(i);
            }
            this.players.push(new Player(i, lives, playerNames[i], pos[i], canvas.playerSize, canvas.playerSize, controller));
        }
    }

    public addInputPlayerKey(playerId: number, keycode: string) {
        this.players[playerId].getInputController().addKey(keycode);
    }

    public releaseInputPlayerKey(playerId: number, keycode: string) {
        this.players[playerId].getInputController().removeKey(keycode);
    }

    public clearPlayerKeys(playerId: number) {
        this.players[playerId].getInputController().clearKeys();
    }

    public updateMovement() {
        for (const player of this.players) {
            player.setVelocity(player.getInputController().getLastDirection().getVector().scale(this.movementMultiplayer));
            const movement = player.getMovement();
            this.playerMovement(player, movement);
            super.getEffectController().pickUp(player);
        }
    }

    public playerTakeDamage(hasDamage: number[], bombPos: Vector, bombRange: Vector[]): number[] {
        for (const player of this.players) {
            if (hasDamage.some(id => id === player.getId())) continue;
            const playerBox = player.getBox();
            
            const expandedBox = new BoundingBox(
                new Vector(playerBox.centerX(), playerBox.centerY()),
                playerBox.getHeight() + this.canvas.bombSize,
                playerBox.getWidth() + this.canvas.bombSize
            );

            for (const vec of bombRange) {
                if (vec.equals(Vector.nullVector)) continue;
                if (expandedBox.intersects(bombPos, vec) !== null) {
                    hasDamage.push(player.getId());
                    player.lostLive();
                    break;
                }
            }
        }
        return hasDamage;
    }

    public getPlayers(): Player[] {
        return this.players;
    }

    private playerMovement(player: Player, movement: Vector) {
        let wall: Wall | undefined = this.getWallOnMove(player, movement, Vector.nullVector);

        if (!wall) {
            player.updateMove(Vector.nullVector);
            return;
        }

        const slideVector = player.getCornerSlideVector(wall.getBox());
        let futurePos = player.getPosition().add(movement);

        if (slideVector) {
            futurePos = futurePos.add(slideVector);
            const slideMovement = movement.add(slideVector);
            wall = this.getWallOnMove(player, slideMovement, slideVector);
        }

        if (slideVector && !wall) {
            player.updateMove(slideVector);
            return;
        }

        if (wall) {
            const backVector = player.getCollisionResolutionVector(wall.getBox(), futurePos);
            player.updateMove(backVector || Vector.nullVector);
        }
    }

    private getWallOnMove(player: Player, movement: Vector, modifyMove: Vector): Wall | undefined {
        let wall: Wall | undefined = super.getWallController().getCollidingWall(player.getPosition(), movement);
            
        if (!wall) {
            wall = super.getWallController().overlapsMoveableWithWall(player.getMovedBox(modifyMove));
        }
        return wall;
    }
}