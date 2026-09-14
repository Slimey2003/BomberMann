import Controller from "./Controller";
import Vector from "@project/utils/Vector";
import type Wall from "../objects/wall/Wall";
import Player from "../objects/moveable/Player";
import type { Canvas } from "@project/utils";
import BoundingBox from "@project/utils/BoundingBox";
import PlayerInputController from "./PlayerInputController";

export default class PlayerController extends Controller {
    
    private players: { [key: string]: Player };
    private movementMultiplayer: number;

    constructor(playerData: { id: string, name: string }[], lives: number, canvas: Canvas) {
        super(canvas);
        this.players = {};
        this.genPlayer(playerData, lives, canvas);
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

    public isLastPlayerStanding(): boolean {
        const playerArray: Player[] = Object.values(this.players);
        if (playerArray.length === 1) {
            return playerArray[0].isDead();
        }
        const lifePlayers: Player[] = playerArray.filter(p => !p.isDead());
        return lifePlayers.length <= 1;
    }

    public getPlayer(key: string): Player | undefined {
        return this.players[key];
    }

    public genPlayer(playerData: { id: string, name: string }[], lives: number, canvas: Canvas): void {
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

        for (let i = 0; i < playerData.length; i++) {
            const controller: PlayerInputController = new PlayerInputController();
            const playerId = playerData[i].id;
            controller.onSpace = () => {
                super.getBombController().placeBomb(playerId);
            }
            this.players[playerId] = new Player(playerId, lives, playerData[i].name, pos[i], canvas.playerSize, canvas.playerSize, controller);
        }
    }

    public addInputPlayerKey(playerId: string, keycode: string): void {
        if (this.players[playerId]) {
            this.players[playerId].getInputController().addKey(keycode);
        }
    }

    public releaseInputPlayerKey(playerId: string, keycode: string): void {
        if (this.players[playerId]) {
            this.players[playerId].getInputController().removeKey(keycode);
        }
    }

    public clearPlayerKeys(playerId: string): void {
        if (this.players[playerId]) {
            this.players[playerId].getInputController().clearKeys();
        }
    }

    public updateMovement(): void {
        for (const playerId in this.players) {
            const player: Player = this.players[playerId];
            player.setVelocity(player.getInputController().getLastDirection().getVector().scale(this.movementMultiplayer));
            const movement: Vector = player.getMovement();
            this.playerMovement(player, movement);
            super.getEffectController().pickUp(player);
        }
    }

    public playerTakeDamage(hasDamage: string[], bombPos: Vector, bombRange: Vector[]): string[] {
        for (const playerId in this.players) {
            const player: Player = this.players[playerId];
            if (hasDamage.some(id => id === player.getId())) continue;
            
            const playerBox: BoundingBox = player.getBox();
            
            const expandedBox: BoundingBox = new BoundingBox(
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
        return Object.values(this.players);
    }

    private playerMovement(player: Player, movement: Vector): void {
        let wall: Wall | undefined = this.getWallOnMove(player, movement, Vector.nullVector);

        if (!wall) {
            player.updateMove(Vector.nullVector);
            return;
        }

        const slideVector: Vector | null = player.getCornerSlideVector(wall.getBox());
        let futurePos: Vector = player.getPosition().add(movement);

        if (slideVector) {
            futurePos = futurePos.add(slideVector);
            const slideMovement: Vector = movement.add(slideVector);
            wall = this.getWallOnMove(player, slideMovement, slideVector);
        }

        if (slideVector && !wall) {
            player.updateMove(slideVector);
            return;
        }

        if (wall) {
            const backVector: Vector | null = player.getCollisionResolutionVector(wall.getBox(), futurePos);
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