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

    public async getRoom(roomId: string): Promise<Room | null> {
        return await this.redisService.getRoom(roomId);
    }

    public async createRoom(hostId: string, playerName: string, roomSize: number): Promise<Room> {
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
        
        await this.redisService.createRoom(room);
        return room;
    }

    public async deleteRoom(roomId: string) {
        await this.redisService.deleteRoom(roomId);
    }

    public async updatePlayerName(roomId: string, playerId: string, name: string) {
        const isExistRoom: boolean = await this.redisService.roomExists(roomId);
        if (!isExistRoom) return;
        await this.redisService.addPlayerToRoom(roomId, playerId);
    }

    public async updateDifficulty(roomId: string, diff: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.difficulty = diff;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }

    public async updateCanvasSize(roomId: string, size: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.canvasSize = size;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }
    
    public async updateGameTime(roomId: string, time: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.gameTime = time;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }

    public async getSetting(roomId: string): Promise<RoomSetting | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        return room.setting;
    }

    public async addPlayer(roomId: string, playerId: string, name: string): Promise<{ [key: string]: string }> {
        const players = await this.redisService.getPlayersInRoom(roomId);
        if (!room) return {};
        
        room.players[playerId] = name;
        return room.players;
    }

    public removePlayer(roomId: string, playerId: string): { [key: string]: string } {
        const room = this.getRoom(roomId);
        if (!room) return {};
        if (room.ownerId === playerId) {
            this.redisService
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

    public async startGame(roomId: string): Promise<Game | null> {
        const room: Room | null = await this.redisService.getRoom(roomId);
        if (!room) return null; 
        const game: Game = this.gameController.createGame(room);
        return game;
    }

    public deleteGame(roomId: string): void {
        this.gameController.deleteGame(roomId);
    }

}