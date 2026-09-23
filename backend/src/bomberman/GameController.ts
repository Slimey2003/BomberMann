import type { Canvas, GameSetting, RoomSetting } from "@project/utils";
import type { Room } from "../utils/util";
import Game from "./objects/Game";

export default class GameController {
    private games: {[key: string]: Game} = {};
    
    public createGame(room: Room): Game {
        const settings: GameSetting = this.generateGameSetting(room.setting);
        
        const playerData: { id: string, name: string }[] = [];
        for (const playerId in room.players) {
            playerData.push({ id: playerId, name: room.players[playerId] });
        }
        
        return new Game(room.id, playerData, settings);
    }

    public startGame(room: Room): Game {
        const game: Game = this.createGame(room);
        this.games[room.id] = game;
        setTimeout(() => game.gameStart(), 1000);
        return game;
    }

    public deleteGame(roomId: string): void {
        delete this.games[roomId];
    }

    private generateGameSetting(roomSettings: RoomSetting): GameSetting {
        switch (roomSettings.difficulty) {
            case 1:
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.85,
                    playerMaxLive: 6,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                };
            case 3:
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.4,
                    playerMaxLive: 1,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                };
            default:
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.7,
                    playerMaxLive: 3,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                };
        }
    }

    private generateCanvas(canvasSize: number): Canvas {
        switch (canvasSize) {
            case 1:
                return {
                    height: 520,
                    width: 520,
                    playerSize: 30,
                    wallSize: 30, 
                    bombSize: 20,
                    effectSize: 27.5 
                };
            case 2:
                return {
                    height: 525,
                    width: 525,
                    playerSize: 15,
                    wallSize: 15,
                    bombSize: 10,
                    effectSize: 12.5 
                };
            default:
                return {
                    height: 520,
                    width: 520,
                    playerSize: 40,
                    wallSize: 40, 
                    bombSize: 30,
                    effectSize: 35 
                };
        }
    }
}