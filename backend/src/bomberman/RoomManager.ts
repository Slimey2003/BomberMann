import type { Canvas, GameSetting, RoomSetting } from "@project/utils";
import Game from "./objects/Game";
import type { Room } from "../utils/util";
import type RedisService from "../service/RedisService";
import type GameController from "./GameController";

export default class RoomManager {
    private redisService: RedisService;
    private gameController: GameController;

    constructor(redisService: RedisService, gameController: GameController) {
        this.redisService = redisService;
        this.gameController = gameController;
    }

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

    public startGame(roomId: string): Game {
        const room: Room;
        const game: Game = this.gameController.createGame(room);
        return game;
    }

    public deleteGame(roomId: string): void {
        this.gameController.deleteGame(roomId);
    }

}