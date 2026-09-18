import type { Canvas, GameSetting, RoomSetting } from "@project/utils";
import Game from "../bomberman/objects/Game";
import type { Room } from "../utils/util";

export default class GameManager {
    private rooms: { [key: string]: Room } = {};

    public getRoom(roomId: string): Room | undefined {
        return this.rooms[roomId];
    }

    public createRoom(hostId: string, playerName: string, roomSize: number): Room {
        const roomID = Math.random().toString(36).substring(2, 9);
        const roomSetting: RoomSetting = {
            roomSize: roomSize,
            gameTime: 600_000,
            canvasSize: 0,
            difficulty: 2,
        };
        
        const room: Room = {
            id: roomID,
            ownerId: hostId,
            players: {},
            setting: roomSetting,
        };
        
        room.players[hostId] = playerName;
        this.rooms[room.id] = room;
        
        return room;
    }

    public deleteRoom(roomId: string) {
        delete this.rooms[roomId];
    }

    public updatePlayerName(roomId: string, playerId: string, name: string): void {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return;
        room.players[playerId] = name;
    }

    public updateDifficulty(roomId: string, diff: number): Room | undefined {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return undefined;
        room.setting.difficulty = diff;
        return room;
    }

    public updateCanvasSize(roomId: string, size: number): Room | undefined {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return undefined;
        room.setting.canvasSize = size;
        return room;
    }
    
    public updateGameTime(roomId: string, time: number): Room | undefined {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return undefined;
        room.setting.gameTime = time;
        return room;
    }

    public getSetting(roomId: string): RoomSetting | undefined {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return undefined;
        return room.setting;
    }

    public addPlayer(roomId: string, playerId: string, name: string): { [key: string]: string } {
        const room = this.getRoom(roomId);
        if (!room) return {};
        room.players[playerId] = name;
        return room.players;
    }

    public removePlayer(roomId: string, playerId: string): { [key: string]: string } {
        const room = this.getRoom(roomId);
        if (!room) return {};
        if (room.ownerId === playerId) {
            delete this.rooms[roomId];
            return {}
        }
        delete room.players[playerId];
        
        const game: Game | undefined = room.activeGame;
        if (game) {
            game.getPlayerController().removePlayer(playerId);
            
        }
        
        return room.players;
    }

    public createGame(room: Room): Game {
        const settings: GameSetting = this.generateGameSetting(room.setting);
        
        const playerData: { id: string, name: string }[] = [];
        for (const playerId in room.players) {
            playerData.push({ id: playerId, name: room.players[playerId] });
        }
        
        return new Game(room.id, playerData, settings);
    }

    public startGame(roomId: string): Game {
        const game: Game = this.createGame(this.rooms[roomId]);
        this.rooms[roomId].activeGame = game;
        setTimeout(() => game.gameStart(), 1000);
        return game;
    }

    public deleteGame(roomId: string): void {
        const room: Room | undefined = this.getRoom(roomId);
        if (!room) return;
        this.rooms[roomId].activeGame = undefined;
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