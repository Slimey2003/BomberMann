import type { Canvas, GameSetting, RoomSetting } from "@project/utils";
import Game from "./objects/Game";

export default class GameManager {
    private roomSettings: {[key: string]: RoomSetting} = {}

    public createRoom(playerName: string, roomSize: number): RoomSetting {
        const roomSetting: RoomSetting = {
            roomId: crypto.randomUUID(),
            roomSize: roomSize,
            players: [playerName],
            gameTime: 600_000,
            canvasSize: 0,
            difficulty: 2,
        };
        this.roomSettings[roomSetting.roomId] = roomSetting;
        return roomSetting;
    }

    public updatePlayerName(roomId: string, playerId: number, name: string) {
        this.roomSettings[roomId].players[playerId] = name;
    }

    public updateDifficulty(roomId: string, diff: number) {
        this.roomSettings[roomId].difficulty = diff
    }

    public updateCanvasSize(roomId: string, size: number) {
        this.roomSettings[roomId].canvasSize = size;
    }
    
    public updateGameTime(roomId: string, time: number) {
        this.roomSettings[roomId].gameTime = time;
    }

    public addPlayer(roomId: string, name: string): number {
        const setting = this.roomSettings[roomId];
        setting.players.push(name);
        return setting.players.length-1;
    }

    public createGame(roomSettings: RoomSetting) {
        const settings: GameSetting = this.generateGameSetting(roomSettings);
        return new Game(roomSettings.roomId, roomSettings.players, settings);
    }

    public startGame(roomId: string): Game {
        const game: Game = this.createGame(this.roomSettings[roomId]);
        this.roomSettings[roomId].activeGame = game;
        setTimeout(() => game.gameStart(), 1000);
        return game;
    } 

    private generateGameSetting(roomSettings: RoomSetting): GameSetting {
        switch (roomSettings.difficulty) {
            case 1: //leicht
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.85,
                    playerMaxLive: 6,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                } 
                break;
            case 3: //schwer
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.4,
                    playerMaxLive: 1,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                }
            default: //normal
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.7,
                    playerMaxLive: 3,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                }
        }
    }

    private generateCanvas(canvasSize: number): Canvas {
        console.log(canvasSize);
        switch (canvasSize) {
            case 1: { //Groß 
                return {
                    height: 520,
                    width: 520,
                    playerSize: 30,
                    wallSize: 30, 
                    bombSize: 20,
                    effectSize: 27.5 
                }
            }
            case 2: { //experimental
                return {
                    height: 525,
                    width: 525,
                    playerSize: 15,
                    wallSize: 15,
                    bombSize: 10,
                    effectSize: 12.5 
                }
            }
            default: { //klein
                return {
                    height: 520,
                    width: 520,
                    playerSize: 40,
                    wallSize: 40, 
                    bombSize: 30,
                    effectSize: 35 
                }
            }
        }
    }
}